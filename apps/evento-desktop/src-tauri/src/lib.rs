use rand::{distr::Alphanumeric, Rng};
use serde::Serialize;
use std::{
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    time::Duration,
};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, State,
};
use tauri_plugin_autostart::ManagerExt;

const DAEMON_PORT: u16 = 8765;

#[derive(Default)]
struct DaemonState {
    child: Mutex<Option<Child>>,
    token: Mutex<Option<String>>,
    write_token: Mutex<Option<String>>,
}

#[derive(Serialize)]
struct DaemonStatus {
    running: bool,
    url: String,
    version: Option<String>,
    writes_enabled: bool,
}

fn random_token() -> String {
    rand::rng()
        .sample_iter(&Alphanumeric)
        .take(64)
        .map(char::from)
        .collect()
}

fn daemon_url() -> String {
    format!("http://127.0.0.1:{DAEMON_PORT}")
}

fn python_executable() -> String {
    std::env::var("EVENTO_PYTHON").unwrap_or_else(|_| {
        if cfg!(windows) { "python".to_string() } else { "python3".to_string() }
    })
}

fn development_daemon() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../daemon/evento_daemon.py")
}

fn bundled_runtime_root(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .resource_dir()
        .ok()
        .map(|root| root.join("runtime"))
        .filter(|path| path.is_dir())
}

fn bundled_daemon(app: &AppHandle) -> Option<PathBuf> {
    bundled_runtime_root(app)
        .map(|root| root.join("daemon/evento_daemon.py"))
        .filter(|path| path.is_file())
}

fn daemon_script(app: &AppHandle) -> Result<PathBuf, String> {
    bundled_daemon(app)
        .or_else(|| {
            let path = development_daemon();
            path.is_file().then_some(path)
        })
        .ok_or_else(|| "EVENTO daemon resource was not found".to_string())
}

fn daemon_get_json(path: &str, token: Option<&str>) -> Result<serde_json::Value, String> {
    let url = format!("{}{}", daemon_url(), path);
    let mut request = ureq::get(&url);
    if let Some(token) = token {
        request = request.header("Authorization", &format!("Bearer {token}"));
    }
    let mut response = request
        .config()
        .timeout_global(Some(Duration::from_secs(3)))
        .build()
        .call()
        .map_err(|error| error.to_string())?;
    response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())
}

fn health_request() -> Result<serde_json::Value, String> {
    daemon_get_json("/health", None)
}

fn status_from_state(_state: &DaemonState) -> DaemonStatus {
    let health = health_request().ok();
    DaemonStatus {
        running: health.is_some(),
        url: daemon_url(),
        version: health
            .as_ref()
            .and_then(|value| value.get("version"))
            .and_then(|value| value.as_str())
            .map(str::to_string),
        writes_enabled: _state.write_token.lock().map(|guard| guard.is_some()).unwrap_or(false),
    }
}

fn start_daemon_inner(app: &AppHandle, state: &DaemonState, writes: bool) -> Result<DaemonStatus, String> {
    if state.token.lock().map_err(|_| "Token state poisoned")?.is_some() {
        return Ok(status_from_state(state));
    }

    if health_request().is_ok() {
        return Err("Port 8765 already has a local service. EVENTO will not adopt an unauthenticated daemon.".to_string());
    }

    let token = random_token();
    let write_token = writes.then(random_token);
    let script = daemon_script(app)?;
    let mut command = Command::new(python_executable());
    command
        .arg(script)
        .env("EVENTO_DAEMON_TOKEN", &token)
        .env("EVENTO_ENABLE_WRITES", if writes { "true" } else { "false" })
        .env("EVENTO_DAEMON_PORT", DAEMON_PORT.to_string());

    if let Some(resource_root) = bundled_runtime_root(app) {
        command.env("EVENTO_RESOURCE_ROOT", resource_root);
    }
    if let Some(ref secret) = write_token {
        command.env("EVENTO_DAEMON_WRITE_TOKEN", secret);
    }
    command
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    let child = command
        .spawn()
        .map_err(|error| format!("Could not start EVENTO daemon: {error}"))?;
    *state.child.lock().map_err(|_| "Daemon state poisoned")? = Some(child);
    *state.token.lock().map_err(|_| "Token state poisoned")? = Some(token.clone());
    *state.write_token.lock().map_err(|_| "Write token state poisoned")? = write_token;

    for _ in 0..25 {
        std::thread::sleep(Duration::from_millis(150));
        if daemon_get_json("/v1/capabilities", Some(&token)).is_ok() {
            return Ok(status_from_state(state));
        }
    }

    Err("EVENTO daemon did not become ready".to_string())
}

#[tauri::command]
fn daemon_status(state: State<'_, DaemonState>) -> DaemonStatus {
    status_from_state(&state)
}

#[tauri::command]
fn start_daemon(app: AppHandle, state: State<'_, DaemonState>) -> Result<DaemonStatus, String> {
    start_daemon_inner(&app, &state, false)
}

#[tauri::command]
fn stop_daemon(state: State<'_, DaemonState>) -> Result<(), String> {
    if let Some(mut child) = state.child.lock().map_err(|_| "Daemon state poisoned")?.take() {
        child.kill().map_err(|error| error.to_string())?;
        let _ = child.wait();
    }
    *state.token.lock().map_err(|_| "Token state poisoned")? = None;
    *state.write_token.lock().map_err(|_| "Write token state poisoned")? = None;
    Ok(())
}

#[tauri::command]
fn workspace_snapshot(state: State<'_, DaemonState>) -> Result<serde_json::Value, String> {
    let token = state
        .token
        .lock()
        .map_err(|_| "Token state poisoned")?
        .clone()
        .ok_or_else(|| "EVENTO daemon is not owned by this desktop session".to_string())?;
    daemon_get_json("/v1/workspaces", Some(&token))
}

#[tauri::command]
fn diagnostic_snapshot(state: State<'_, DaemonState>) -> Result<serde_json::Value, String> {
    let token = state
        .token
        .lock()
        .map_err(|_| "Token state poisoned")?
        .clone()
        .ok_or_else(|| "EVENTO daemon is not owned by this desktop session".to_string())?;
    daemon_get_json("/v1/diagnostics", Some(&token))
}





fn daemon_post_json(
    path: &str,
    token: &str,
    write_token: &str,
    payload: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let url = format!("{}{}", daemon_url(), path);
    let mut response = ureq::post(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("X-EVENTO-Write-Token", write_token)
        .config()
        .timeout_global(Some(Duration::from_secs(35)))
        .build()
        .send_json(payload)
        .map_err(|error| error.to_string())?;
    response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())
}

fn stop_owned_daemon(state: &DaemonState) -> Result<(), String> {
    if let Some(mut child) = state.child.lock().map_err(|_| "Daemon state poisoned")?.take() {
        child.kill().map_err(|error| error.to_string())?;
        let _ = child.wait();
    }
    *state.token.lock().map_err(|_| "Token state poisoned")? = None;
    *state.write_token.lock().map_err(|_| "Write token state poisoned")? = None;
    Ok(())
}

#[tauri::command]
fn set_operator_mode(
    app: AppHandle,
    state: State<'_, DaemonState>,
    enabled: bool,
) -> Result<DaemonStatus, String> {
    stop_owned_daemon(&state)?;
    start_daemon_inner(&app, &state, enabled)
}

fn clean_branch_suffix(value: &str) -> Result<String, String> {
    let mut out = String::new();
    for ch in value.trim().to_ascii_lowercase().chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' {
            out.push(ch);
        } else if !out.ends_with('-') {
            out.push('-');
        }
    }
    let cleaned = out.trim_matches('-').to_string();
    if cleaned.is_empty() || cleaned.len() > 48 {
        return Err("invalid branch suffix".to_string());
    }
    Ok(cleaned)
}

#[tauri::command]
fn project_action(
    state: State<'_, DaemonState>,
    action: String,
    project_id: String,
    value: Option<String>,
) -> Result<serde_json::Value, String> {
    let token = state
        .token
        .lock()
        .map_err(|_| "Token state poisoned")?
        .clone()
        .ok_or_else(|| "EVENTO daemon is offline".to_string())?;
    let write_token = state
        .write_token
        .lock()
        .map_err(|_| "Write token state poisoned")?
        .clone()
        .ok_or_else(|| "Operator mode is disabled".to_string())?;

    let payload = match action.as_str() {
        "open" => serde_json::json!({
            "action": "project-open-folder",
            "confirmation": "project-open-folder",
            "project_id": project_id,
        }),
        "worktree" => {
            let suffix = clean_branch_suffix(value.as_deref().unwrap_or("next"))?;
            serde_json::json!({
                "action": "project-create-worktree",
                "confirmation": "project-create-worktree",
                "project_id": project_id,
                "branch": format!("evento/{}/{}", project_id, suffix),
                "base_ref": "HEAD",
            })
        }
        "gate" => {
            if project_id != "aaa-empire" {
                return Err("No approved native gate is registered for this project".to_string());
            }
            serde_json::json!({
                "action": "python-run-approved",
                "confirmation": "python-run-approved",
                "script": "validate_evento_control_plane.py",
                "args": [],
            })
        }
        "blender" => serde_json::json!({
            "action": "blender-open-project",
            "confirmation": "blender-open-project",
            "project_id": project_id,
            "blend_file": value.unwrap_or_default(),
        }),
        "unity" => serde_json::json!({
            "action": "unity-open-project",
            "confirmation": "unity-open-project",
            "project_id": project_id,
            "unity_project": value.unwrap_or_else(|| ".".to_string()),
        }),
        "unity-test" => serde_json::json!({
            "action": "unity-run-editmode-tests",
            "confirmation": "unity-run-editmode-tests",
            "project_id": project_id,
            "unity_project": value.unwrap_or_else(|| ".".to_string()),
        }),
        "blender-export" => serde_json::json!({
            "action": "blender-export-glb",
            "confirmation": "blender-export-glb",
            "project_id": project_id,
            "blend_file": value.unwrap_or_default(),
        }),
        "adb-install" => {
            if project_id != "evento-mobile" {
                return Err("APK install is restricted to evento-mobile in v1".to_string());
            }
            serde_json::json!({
                "action": "android-install-apk",
                "confirmation": "android-install-apk",
                "project_id": project_id,
                "apk_path": value.unwrap_or_default(),
            })
        }
        _ => return Err("Native project action is not allowlisted".to_string()),
    };

    daemon_post_json("/v1/actions/run", &token, &write_token, payload)
}

const CREDENTIAL_SERVICE: &str = "ae.evento.control";

fn validate_credential_name(name: &str) -> Result<(), String> {
    const ALLOWED: &[&str] = &[
        "github",
        "supabase",
        "vercel",
        "openai",
        "anthropic",
        "google",
        "generic-llm",
    ];
    if ALLOWED.contains(&name) {
        Ok(())
    } else {
        Err("credential name is not allowlisted".to_string())
    }
}

#[tauri::command]
fn credential_status(name: String) -> Result<bool, String> {
    validate_credential_name(&name)?;
    let entry = keyring::v1::Entry::new(CREDENTIAL_SERVICE, &name)
        .map_err(|error| error.to_string())?;
    Ok(entry.get_password().is_ok())
}

#[tauri::command]
fn credential_set(name: String, secret: String) -> Result<(), String> {
    validate_credential_name(&name)?;
    if secret.trim().is_empty() || secret.len() > 16_384 {
        return Err("credential value is empty or too large".to_string());
    }
    let entry = keyring::v1::Entry::new(CREDENTIAL_SERVICE, &name)
        .map_err(|error| error.to_string())?;
    entry.set_password(&secret).map_err(|error| error.to_string())
}

#[tauri::command]
fn credential_delete(name: String) -> Result<(), String> {
    validate_credential_name(&name)?;
    let entry = keyring::v1::Entry::new(CREDENTIAL_SERVICE, &name)
        .map_err(|error| error.to_string())?;
    entry.delete_credential().map_err(|error| error.to_string())
}



#[derive(Serialize)]
struct ConnectorProbe {
    name: String,
    configured: bool,
    reachable: bool,
    summary: String,
}

fn credential_value(name: &str) -> Result<String, String> {
    validate_credential_name(name)?;
    let entry = keyring::v1::Entry::new(CREDENTIAL_SERVICE, name)
        .map_err(|error| error.to_string())?;
    entry.get_password().map_err(|_| "credential_not_configured".to_string())
}

fn probe_json(url: &str, auth_header: (&str, String)) -> Result<serde_json::Value, String> {
    let mut response = ureq::get(url)
        .header(auth_header.0, &auth_header.1)
        .header("Accept", "application/json")
        .config()
        .timeout_global(Some(Duration::from_secs(5)))
        .build()
        .call()
        .map_err(|error| error.to_string())?;
    response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn connector_probe(name: String) -> Result<ConnectorProbe, String> {
    let secret = match credential_value(&name) {
        Ok(secret) => secret,
        Err(_) => {
            return Ok(ConnectorProbe {
                name,
                configured: false,
                reachable: false,
                summary: "not configured".to_string(),
            })
        }
    };

    let result = match name.as_str() {
        "github" => probe_json(
            "https://api.github.com/user",
            ("Authorization", format!("Bearer {secret}")),
        ),
        "supabase" => probe_json(
            "https://api.supabase.com/v1/projects",
            ("Authorization", format!("Bearer {secret}")),
        ),
        "vercel" => probe_json(
            "https://api.vercel.com/v2/user",
            ("Authorization", format!("Bearer {secret}")),
        ),
        _ => {
            return Ok(ConnectorProbe {
                name,
                configured: true,
                reachable: false,
                summary: "stored; provider probe not enabled".to_string(),
            })
        }
    };

    match result {
        Ok(value) => {
            let summary = match name.as_str() {
                "github" => value
                    .get("login")
                    .and_then(|v| v.as_str())
                    .map(|login| format!("authenticated as {login}"))
                    .unwrap_or_else(|| "authenticated".to_string()),
                "supabase" => value
                    .as_array()
                    .map(|items| format!("{} projects visible", items.len()))
                    .unwrap_or_else(|| "authenticated".to_string()),
                "vercel" => value
                    .get("user")
                    .and_then(|v| v.get("username"))
                    .and_then(|v| v.as_str())
                    .map(|username| format!("authenticated as {username}"))
                    .unwrap_or_else(|| "authenticated".to_string()),
                _ => "authenticated".to_string(),
            };
            Ok(ConnectorProbe { name, configured: true, reachable: true, summary })
        }
        Err(error) => Ok(ConnectorProbe {
            name,
            configured: true,
            reachable: false,
            summary: format!("probe failed: {error}"),
        }),
    }
}

#[tauri::command]
fn autostart_status(app: AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|error| error.to_string())
}

#[tauri::command]
fn set_autostart(app: AppHandle, enabled: bool) -> Result<bool, String> {
    if enabled {
        app.autolaunch().enable().map_err(|error| error.to_string())?;
    } else {
        app.autolaunch().disable().map_err(|error| error.to_string())?;
    }
    app.autolaunch().is_enabled().map_err(|error| error.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .app_name("EVENTO")
                .build(),
        )
        .manage(DaemonState::default())
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "Open EVENTO", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit EVENTO", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("EVENTO icon").clone())
                .tooltip("EVENTO Control Plane")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            let handle = app.handle().clone();
            let state = app.state::<DaemonState>();
            if let Err(error) = start_daemon_inner(&handle, &state, false) {
                eprintln!("EVENTO local engine auto-start skipped: {error}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            daemon_status,
            start_daemon,
            stop_daemon,
            workspace_snapshot,
            diagnostic_snapshot,
            set_operator_mode,
            project_action,
            credential_status,
            credential_set,
            credential_delete,
            connector_probe,
            autostart_status,
            set_autostart
        ])
        .run(tauri::generate_context!())
        .expect("error while running EVENTO desktop");
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn branch_suffix_is_bounded_and_normalized() {
        assert_eq!(clean_branch_suffix("Feature One").unwrap(), "feature-one");
        assert!(clean_branch_suffix("").is_err());
        assert!(clean_branch_suffix(&"a".repeat(49)).is_err());
    }

    #[test]
    fn credential_names_are_allowlisted() {
        assert!(validate_credential_name("github").is_ok());
        assert!(validate_credential_name("supabase").is_ok());
        assert!(validate_credential_name("shell").is_err());
        assert!(validate_credential_name("../secret").is_err());
    }
}
