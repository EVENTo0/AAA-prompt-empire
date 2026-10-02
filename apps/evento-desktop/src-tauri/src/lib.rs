use rand::{distr::Alphanumeric, Rng};
use serde::Serialize;
use std::{
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    time::Duration,
};
use tauri::{AppHandle, Manager, State};

const DAEMON_PORT: u16 = 8765;

#[derive(Default)]
struct DaemonState {
    child: Mutex<Option<Child>>,
    token: Mutex<Option<String>>,
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

fn bundled_daemon(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .resource_dir()
        .ok()
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

fn status_from_state(state: &DaemonState) -> DaemonStatus {
    let health = health_request().ok();
    DaemonStatus {
        running: health.is_some(),
        url: daemon_url(),
        version: health
            .as_ref()
            .and_then(|value| value.get("version"))
            .and_then(|value| value.as_str())
            .map(str::to_string),
        writes_enabled: false,
    }
}

fn start_daemon_inner(app: &AppHandle, state: &DaemonState) -> Result<DaemonStatus, String> {
    if state.token.lock().map_err(|_| "Token state poisoned")?.is_some() {
        return Ok(status_from_state(state));
    }

    if health_request().is_ok() {
        return Err("Port 8765 already has a local service. EVENTO will not adopt an unauthenticated daemon.".to_string());
    }

    let token = random_token();
    let script = daemon_script(app)?;
    let mut command = Command::new(python_executable());
    command
        .arg(script)
        .env("EVENTO_DAEMON_TOKEN", &token)
        .env("EVENTO_ENABLE_WRITES", "false")
        .env("EVENTO_DAEMON_PORT", DAEMON_PORT.to_string())
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
    start_daemon_inner(&app, &state)
}

#[tauri::command]
fn stop_daemon(state: State<'_, DaemonState>) -> Result<(), String> {
    if let Some(mut child) = state.child.lock().map_err(|_| "Daemon state poisoned")?.take() {
        child.kill().map_err(|error| error.to_string())?;
        let _ = child.wait();
    }
    *state.token.lock().map_err(|_| "Token state poisoned")? = None;
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

pub fn run() {
    tauri::Builder::default()
        .manage(DaemonState::default())
        .setup(|app| {
            let handle = app.handle().clone();
            let state = app.state::<DaemonState>();
            if let Err(error) = start_daemon_inner(&handle, &state) {
                eprintln!("EVENTO local engine auto-start skipped: {error}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            daemon_status,
            start_daemon,
            stop_daemon,
            workspace_snapshot,
            diagnostic_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running EVENTO desktop");
}
