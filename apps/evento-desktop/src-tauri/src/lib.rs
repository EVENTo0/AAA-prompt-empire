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







fn daemon_post_read_json(
    path: &str,
    token: &str,
    payload: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let url = format!("{}{}", daemon_url(), path);
    let mut response = ureq::post(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .config()
        .timeout_global(Some(Duration::from_secs(310)))
        .build()
        .send_json(payload)
        .map_err(|error| error.to_string())?;
    response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn agent_plan(
    state: State<'_, DaemonState>,
    provider: String,
    project_id: String,
    prompt: String,
) -> Result<serde_json::Value, String> {
    if provider != "codex" && provider != "claude-code" {
        return Err("Agent provider is not allowlisted".to_string());
    }
    if prompt.trim().is_empty() || prompt.len() > 8000 {
        return Err("Agent prompt is empty or too large".to_string());
    }
    let token = state
        .token
        .lock()
        .map_err(|_| "Token state poisoned")?
        .clone()
        .ok_or_else(|| "EVENTO daemon is offline".to_string())?;

    daemon_post_read_json(
        "/v1/agent/plan",
        &token,
        serde_json::json!({
            "provider": provider,
            "project_id": project_id,
            "prompt": prompt,
        }),
    )
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
struct RemoteTask {
    number: u64,
    title: String,
    state: String,
    url: String,
    repository: String,
    project_id: String,
    objective: String,
    mode: String,
    preferred_agent: String,
    approved_at: String,
}

fn remote_task_state_from_title(title: &str) -> Option<&'static str> {
    if title.starts_with("[EVENTO TASK][PRODUCTION-HANDOFF-APPROVED]") {
        Some("production-handoff-approved")
    } else if title.starts_with("[EVENTO TASK][PREVIEW-ACCEPTED]") {
        Some("preview-accepted")
    } else if title.starts_with("[EVENTO TASK][PREVIEW-VERIFIED]") {
        Some("preview-verified")
    } else if title.starts_with("[EVENTO TASK][MERGED-VERIFIED]") {
        Some("merged-verified")
    } else if title.starts_with("[EVENTO TASK][MERGED]") {
        Some("merged")
    } else if title.starts_with("[EVENTO TASK][MERGE-HANDOFF-APPROVED]") {
        Some("merge-handoff-approved")
    } else if title.starts_with("[EVENTO TASK][REVISION-REQUESTED]") {
        Some("revision-requested")
    } else if title.starts_with("[EVENTO TASK][PR-OPEN]") {
        Some("pr-open")
    } else if title.starts_with("[EVENTO TASK][LOCAL-BUILT]") {
        Some("local-built")
    } else if title.starts_with("[EVENTO TASK][APPROVED]") {
        Some("approved")
    } else {
        None
    }
}

fn task_repository() -> String {
    std::env::var("EVENTO_TASK_REPOSITORY")
        .unwrap_or_else(|_| "EVENTo0/AAA-prompt-empire".to_string())
}

#[tauri::command]
fn remote_tasks() -> Result<Vec<RemoteTask>, String> {
    let token = credential_value("github")?;
    let repo = task_repository();
    let url = format!(
        "https://api.github.com/repos/{}/issues?state=open&per_page=50",
        repo
    );
    let mut response = ureq::get(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .config()
        .timeout_global(Some(Duration::from_secs(8)))
        .build()
        .call()
        .map_err(|error| error.to_string())?;
    let issues = response
        .body_mut()
        .read_json::<Vec<serde_json::Value>>()
        .map_err(|error| error.to_string())?;

    let mut tasks = Vec::new();
    for issue in issues {
        let title = issue.get("title").and_then(|v| v.as_str()).unwrap_or("");
        let Some(task_state) = remote_task_state_from_title(title) else {
            continue;
        };
        let body = issue.get("body").and_then(|v| v.as_str()).unwrap_or("");
        let envelope: serde_json::Value = match serde_json::from_str(body) {
            Ok(value) => value,
            Err(_) => continue,
        };
        if envelope.get("evento_task_version").and_then(|v| v.as_u64()) != Some(1)
            || envelope.get("state").and_then(|v| v.as_str()) != Some("approved")
            || envelope.get("release").and_then(|v| v.as_bool()) != Some(false)
        {
            continue;
        }
        let Some(project_id) = envelope.get("project_id").and_then(|v| v.as_str()) else { continue };
        let Some(repository) = envelope.get("repository").and_then(|v| v.as_str()) else { continue };
        let Some(objective) = envelope.get("objective").and_then(|v| v.as_str()) else { continue };
        let mode = envelope.get("mode").and_then(|v| v.as_str()).unwrap_or("build");
        if !matches!(mode, "build" | "verify" | "preview") {
            continue;
        }
        let preferred_agent = envelope
            .get("preferred_agent")
            .and_then(|v| v.as_str())
            .unwrap_or("auto");
        if !matches!(preferred_agent, "auto" | "codex" | "claude-code") {
            continue;
        }

        tasks.push(RemoteTask {
            number: issue.get("number").and_then(|v| v.as_u64()).unwrap_or(0),
            title: title.to_string(),
            state: task_state.to_string(),
            url: issue.get("html_url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            repository: repository.to_string(),
            project_id: project_id.to_string(),
            objective: objective.to_string(),
            mode: mode.to_string(),
            preferred_agent: preferred_agent.to_string(),
            approved_at: envelope
                .get("approved_at")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        });
    }
    Ok(tasks)
}




fn github_task_mark_local_built(issue_number: u64) -> Result<(), String> {
    let token = credential_value("github")?;
    let repo = task_repository();
    let url = format!("https://api.github.com/repos/{}/issues/{}", repo, issue_number);
    let mut response = ureq::get(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .call()
        .map_err(|error| error.to_string())?;
    let issue = response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())?;
    let title = issue.get("title").and_then(|v| v.as_str()).unwrap_or("");
    if !title.starts_with("[EVENTO TASK][APPROVED]") {
        return Ok(());
    }
    let next_title = title.replacen("[EVENTO TASK][APPROVED]", "[EVENTO TASK][LOCAL-BUILT]", 1);
    let response = ureq::patch(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({ "title": next_title }))
        .map_err(|error| error.to_string())?;
    if response.status().as_u16() >= 300 {
        return Err(format!("GitHub task status update failed: {}", response.status()));
    }
    Ok(())
}

fn github_task_comment(issue_number: u64, result: &serde_json::Value) -> Result<(), String> {
    let token = credential_value("github")?;
    let repo = task_repository();
    let changed = result
        .get("changed_files")
        .and_then(|v| v.as_array())
        .map(|items| {
            items.iter()
                .filter_map(|v| v.as_str())
                .map(|s| format!("- {s}"))
                .collect::<Vec<_>>()
                .join("\n")
        })
        .unwrap_or_default();
    let branch = result.get("branch").and_then(|v| v.as_str()).unwrap_or("");
    let base = result.get("base_sha").and_then(|v| v.as_str()).unwrap_or("");
    let diff_stat = result.get("diff_stat").and_then(|v| v.as_str()).unwrap_or("");
    let body = format!(
        "## EVENTO execution evidence\n\nStatus: implemented in local isolated worktree\n\nProvider: codex\nBranch: {branch}\nBase: {base}\nRelease: false\nPush/Merge/Deploy: false\n\n### Changed files\n{changed}\n\n### Diff stat\n{diff_stat}\n\nThe worktree remains local until a separate reviewed Git handoff is approved."
    );
    let url = format!(
        "https://api.github.com/repos/{}/issues/{}/comments",
        repo, issue_number
    );
    let response = ureq::post(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({ "body": body }))
        .map_err(|error| error.to_string())?;
    if response.status().as_u16() >= 300 {
        return Err(format!("GitHub evidence comment failed: {}", response.status()));
    }
    Ok(())
}

#[tauri::command]
fn remote_task_execute(
    state: State<'_, DaemonState>,
    issue_number: u64,
    project_id: String,
    objective: String,
    preferred_agent: String,
) -> Result<serde_json::Value, String> {
    if issue_number == 0 {
        return Err("Invalid remote task number".to_string());
    }
    if objective.trim().is_empty() || objective.len() > 4000 {
        return Err("Invalid task objective".to_string());
    }
    if preferred_agent == "claude-code" {
        return Err("Claude remote write is not enabled in v1; use Plan Task or Auto/Codex.".to_string());
    }

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
        .ok_or_else(|| "Operator Mode must be enabled before executing an approved build".to_string())?;

    let result = daemon_post_json(
        "/v1/actions/run",
        &token,
        &write_token,
        serde_json::json!({
            "action": "agent-build-worktree",
            "confirmation": "agent-build-worktree",
            "project_id": project_id,
            "issue_number": issue_number,
            "objective": objective,
            "provider": "codex",
        }),
    )?;

    github_task_comment(issue_number, &result)?;
    let _ = github_task_mark_local_built(issue_number);
    Ok(result)
}



#[tauri::command]
fn remote_task_review_gate(
    state: State<'_, DaemonState>,
    issue_number: u64,
    project_id: String,
    objective: String,
) -> Result<serde_json::Value, String> {
    if issue_number == 0 {
        return Err("Invalid remote task number".to_string());
    }
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
        .ok_or_else(|| "Operator Mode must be enabled before review/test gate".to_string())?;

    let review = daemon_post_json(
        "/v1/actions/run",
        &token,
        &write_token,
        serde_json::json!({
            "action": "remote-task-review",
            "confirmation": "remote-task-review",
            "project_id": project_id,
            "issue_number": issue_number,
            "objective": objective,
        }),
    )?;
    if review.get("verdict").and_then(|v| v.as_str()) != Some("pass") {
        return Ok(serde_json::json!({
            "ready": false,
            "stage": "review",
            "review": review,
        }));
    }

    let gate = daemon_post_json(
        "/v1/actions/run",
        &token,
        &write_token,
        serde_json::json!({
            "action": "remote-task-test-gate",
            "confirmation": "remote-task-test-gate",
            "project_id": project_id,
            "issue_number": issue_number,
        }),
    )?;
    if gate.get("passed").and_then(|v| v.as_bool()) != Some(true) {
        return Ok(serde_json::json!({
            "ready": false,
            "stage": "test-gate",
            "review": review,
            "gate": gate,
        }));
    }

    let readiness = daemon_post_json(
        "/v1/actions/run",
        &token,
        &write_token,
        serde_json::json!({
            "action": "remote-task-ready-for-handoff",
            "confirmation": "remote-task-ready-for-handoff",
            "project_id": project_id,
            "issue_number": issue_number,
        }),
    )?;

    Ok(serde_json::json!({
        "ready": readiness.get("ready").and_then(|v| v.as_bool()).unwrap_or(false),
        "stage": "complete",
        "review": review,
        "gate": gate,
        "readiness": readiness,
    }))
}


fn github_task_handoff_comment(
    issue_number: u64,
    pr_url: &str,
    branch: &str,
    commit_sha: &str,
) -> Result<(), String> {
    let token = credential_value("github")?;
    let repo = task_repository();
    let url = format!(
        "https://api.github.com/repos/{}/issues/{}/comments",
        repo, issue_number
    );
    let body = format!(
        "## EVENTO PR handoff\n\nDraft PR: {pr_url}\nBranch: {branch}\nCommit: {commit_sha}\n\nMerge: false\nDeploy: false\nRelease: false\n\nHuman/operator review is still required before any merge or release action."
    );
    let response = ureq::post(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({ "body": body }))
        .map_err(|error| error.to_string())?;
    if response.status().as_u16() >= 300 {
        return Err(format!("GitHub handoff comment failed: {}", response.status()));
    }
    Ok(())
}

fn github_default_branch(repository: &str, token: &str) -> Result<String, String> {
    let url = format!("https://api.github.com/repos/{repository}");
    let mut response = ureq::get(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .call()
        .map_err(|error| error.to_string())?;
    let payload = response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())?;
    payload
        .get("default_branch")
        .and_then(|v| v.as_str())
        .map(str::to_string)
        .ok_or_else(|| "GitHub default branch unavailable".to_string())
}

fn create_draft_pr(
    repository: &str,
    token: &str,
    branch: &str,
    issue_number: u64,
    objective: &str,
) -> Result<serde_json::Value, String> {
    let base = github_default_branch(repository, token)?;
    let url = format!("https://api.github.com/repos/{repository}/pulls");
    let body = format!(
        "EVENTO remote task #{issue_number}\n\nObjective:\n{objective}\n\nThis handoff passed independent Claude review and the registered project test gate.\n\nRelease: false\nMerge: manual review required\nDeploy: false"
    );
    let mut response = ureq::post(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({
            "title": format!("[EVENTO] Remote task #{issue_number}: {}", objective.chars().take(80).collect::<String>()),
            "head": branch,
            "base": base,
            "body": body,
            "draft": true
        }))
        .map_err(|error| error.to_string())?;
    response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn remote_task_publish_pr(
    state: State<'_, DaemonState>,
    issue_number: u64,
    project_id: String,
    repository: String,
    objective: String,
) -> Result<serde_json::Value, String> {
    if issue_number == 0 || repository.trim().is_empty() {
        return Err("Invalid handoff request".to_string());
    }
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
        .ok_or_else(|| "Operator Mode must be enabled before PR handoff".to_string())?;

    let readiness = daemon_post_json(
        "/v1/actions/run",
        &token,
        &write_token,
        serde_json::json!({
            "action": "remote-task-ready-for-handoff",
            "confirmation": "remote-task-ready-for-handoff",
            "project_id": project_id,
            "issue_number": issue_number,
        }),
    )?;
    if readiness.get("ready").and_then(|v| v.as_bool()) != Some(true) {
        return Err(format!(
            "Task is not ready for PR handoff: {}",
            readiness.get("reason").and_then(|v| v.as_str()).unwrap_or("unknown")
        ));
    }

    let published = daemon_post_json(
        "/v1/actions/run",
        &token,
        &write_token,
        serde_json::json!({
            "action": "remote-task-publish-branch",
            "confirmation": "remote-task-publish-branch",
            "project_id": project_id,
            "issue_number": issue_number,
        }),
    )?;

    let github_token = credential_value("github")?;
    let branch = published
        .get("branch")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Published branch missing".to_string())?;
    let pr = create_draft_pr(&repository, &github_token, branch, issue_number, &objective)?;
    let pr_url = pr.get("html_url").and_then(|v| v.as_str()).unwrap_or("");
    let commit_sha = published.get("commit_sha").and_then(|v| v.as_str()).unwrap_or("");
    if !pr_url.is_empty() {
        let _ = github_task_handoff_comment(issue_number, pr_url, branch, commit_sha);
    }

    let task_repo = task_repository();
    let task_url = format!(
        "https://api.github.com/repos/{}/issues/{}",
        task_repo, issue_number
    );
    let mut issue_response = ureq::get(&task_url)
        .header("Authorization", &format!("Bearer {github_token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .call()
        .map_err(|error| error.to_string())?;
    let issue = issue_response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())?;
    let title = issue.get("title").and_then(|v| v.as_str()).unwrap_or("");
    if title.starts_with("[EVENTO TASK]") {
        let suffix = title.splitn(3, ']').skip(2).collect::<Vec<_>>().join("]").trim().to_string();
        let _ = ureq::patch(&task_url)
            .header("Authorization", &format!("Bearer {github_token}"))
            .header("Accept", "application/vnd.github+json")
            .header("X-GitHub-Api-Version", "2026-03-10")
            .send_json(serde_json::json!({
                "title": format!("[EVENTO TASK][PR-OPEN] {}", suffix)
            }));
    }

    Ok(serde_json::json!({
        "ok": true,
        "branch": branch,
        "commit_sha": published.get("commit_sha"),
        "pr_number": pr.get("number"),
        "pr_url": pr.get("html_url"),
        "draft": true,
        "merge": false,
        "deploy": false,
        "release": false
    }))
}



#[tauri::command]
fn remote_task_safe_pipeline(
    state: State<'_, DaemonState>,
    issue_number: u64,
    project_id: String,
    repository: String,
    objective: String,
    preferred_agent: String,
) -> Result<serde_json::Value, String> {
    if preferred_agent == "claude-code" {
        return Err("Claude is reviewer-only in safe pipeline v1; choose Auto or Codex for the writer.".to_string());
    }

    let build = remote_task_execute(
        state.clone(),
        issue_number,
        project_id.clone(),
        objective.clone(),
        preferred_agent,
    )?;

    let review_gate = remote_task_review_gate(
        state.clone(),
        issue_number,
        project_id.clone(),
        objective.clone(),
    )?;
    if review_gate.get("ready").and_then(|v| v.as_bool()) != Some(true) {
        return Ok(serde_json::json!({
            "ok": false,
            "stage": "review-gate",
            "build": build,
            "review_gate": review_gate,
            "draft_pr": null,
            "merge": false,
            "deploy": false,
            "release": false
        }));
    }

    let handoff = remote_task_publish_pr(
        state,
        issue_number,
        project_id,
        repository,
        objective,
    )?;

    Ok(serde_json::json!({
        "ok": true,
        "stage": "draft-pr-open",
        "build": build,
        "review_gate": review_gate,
        "handoff": handoff,
        "merge": false,
        "deploy": false,
        "release": false
    }))
}



fn github_get_json(url: &str, token: &str) -> Result<serde_json::Value, String> {
    let mut response = ureq::get(url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .config()
        .timeout_global(Some(Duration::from_secs(12)))
        .build()
        .call()
        .map_err(|error| error.to_string())?;
    response.body_mut().read_json::<serde_json::Value>().map_err(|error| error.to_string())
}

fn task_pr_url(issue_number: u64, token: &str) -> Result<String, String> {
    let repo = task_repository();
    let url = format!(
        "https://api.github.com/repos/{}/issues/{}/comments?per_page=100",
        repo, issue_number
    );
    let comments = github_get_json(&url, token)?;
    let Some(items) = comments.as_array() else {
        return Err("Task comments unavailable".to_string());
    };
    for comment in items.iter().rev() {
        let body = comment.get("body").and_then(|v| v.as_str()).unwrap_or("");
        if !body.contains("EVENTO PR handoff") {
            continue;
        }
        if let Some(start) = body.find("https://github.com/") {
            let tail = &body[start..];
            let end = tail.find(char::is_whitespace).unwrap_or(tail.len());
            let candidate = tail[..end].trim_end_matches([')', ',', '.']);
            if candidate.contains("/pull/") {
                return Ok(candidate.to_string());
            }
        }
    }
    Err("Draft PR URL not found in task audit trail".to_string())
}

fn parse_pr_number(pr_url: &str) -> Result<u64, String> {
    pr_url
        .split("/pull/")
        .nth(1)
        .and_then(|value| value.split('/').next())
        .and_then(|value| value.parse::<u64>().ok())
        .ok_or_else(|| "Invalid PR URL".to_string())
}

fn github_task_state(issue_number: u64, token: &str) -> Result<String, String> {
    let repo = task_repository();
    let url = format!("https://api.github.com/repos/{}/issues/{}", repo, issue_number);
    let issue = github_get_json(&url, token)?;
    let title = issue.get("title").and_then(|v| v.as_str()).unwrap_or("");
    remote_task_state_from_title(title)
        .map(str::to_string)
        .ok_or_else(|| "Task state is not recognized".to_string())
}

fn latest_review_states(reviews: &[serde_json::Value]) -> std::collections::HashMap<String, String> {
    let mut latest = std::collections::HashMap::new();
    for review in reviews {
        let user = review.get("user").and_then(|v| v.get("login")).and_then(|v| v.as_str()).unwrap_or("");
        let state = review.get("state").and_then(|v| v.as_str()).unwrap_or("");
        if !user.is_empty() && !state.is_empty() {
            latest.insert(user.to_string(), state.to_string());
        }
    }
    latest
}

#[tauri::command]
fn remote_task_merge_readiness(
    issue_number: u64,
    repository: String,
) -> Result<serde_json::Value, String> {
    if issue_number == 0 || repository.trim().is_empty() {
        return Err("Invalid merge readiness request".to_string());
    }

    let token = credential_value("github")?;
    let task_state = github_task_state(issue_number, &token)?;
    let pr_url = task_pr_url(issue_number, &token)?;
    let pr_number = parse_pr_number(&pr_url)?;

    let pr_api = format!("https://api.github.com/repos/{}/pulls/{}", repository, pr_number);
    let pr = github_get_json(&pr_api, &token)?;

    let mut blockers: Vec<String> = Vec::new();
    if task_state != "merge-handoff-approved" {
        blockers.push("merge_handoff_not_approved".to_string());
    }

    let pr_state = pr.get("state").and_then(|v| v.as_str()).unwrap_or("");
    if pr_state != "open" {
        blockers.push("pr_not_open".to_string());
    }
    if pr.get("draft").and_then(|v| v.as_bool()).unwrap_or(true) {
        blockers.push("pr_is_draft".to_string());
    }
    if pr.get("mergeable").and_then(|v| v.as_bool()) != Some(true) {
        blockers.push("pr_not_mergeable".to_string());
    }

    let mergeable_state = pr.get("mergeable_state").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
    if mergeable_state != "clean" {
        blockers.push(format!("mergeable_state_{mergeable_state}"));
    }

    let head_sha = pr.get("head").and_then(|v| v.get("sha")).and_then(|v| v.as_str())
        .ok_or_else(|| "PR head SHA unavailable".to_string())?.to_string();
    let head_ref = pr.get("head").and_then(|v| v.get("ref")).and_then(|v| v.as_str()).unwrap_or("").to_string();
    let base_ref = pr.get("base").and_then(|v| v.get("ref")).and_then(|v| v.as_str()).unwrap_or("").to_string();

    let compare_url = format!("https://api.github.com/repos/{}/compare/{}...{}", repository, base_ref, head_ref);
    let compare = github_get_json(&compare_url, &token)?;
    let behind_by = compare.get("behind_by").and_then(|v| v.as_i64()).unwrap_or(0);
    if behind_by > 0 {
        blockers.push(format!("branch_behind_by_{behind_by}"));
    }

    let checks_url = format!("https://api.github.com/repos/{}/commits/{}/check-runs?per_page=100", repository, head_sha);
    let checks = github_get_json(&checks_url, &token)?;
    let check_runs = checks.get("check_runs").and_then(|v| v.as_array()).cloned().unwrap_or_default();

    let status_url = format!("https://api.github.com/repos/{}/commits/{}/status", repository, head_sha);
    let combined_status = github_get_json(&status_url, &token)?;
    let status_state = combined_status.get("state").and_then(|v| v.as_str()).unwrap_or("pending").to_string();
    let status_contexts = combined_status.get("statuses").and_then(|v| v.as_array()).map(|v| v.len()).unwrap_or(0);

    if check_runs.is_empty() && status_contexts == 0 {
        blockers.push("no_ci_evidence".to_string());
    }

    let mut checks_pending = 0usize;
    let mut checks_failed = 0usize;
    for check in &check_runs {
        let status = check.get("status").and_then(|v| v.as_str()).unwrap_or("");
        let conclusion = check.get("conclusion").and_then(|v| v.as_str()).unwrap_or("");
        if status != "completed" {
            checks_pending += 1;
        } else if !matches!(conclusion, "success" | "neutral" | "skipped") {
            checks_failed += 1;
        }
    }
    if checks_pending > 0 {
        blockers.push(format!("checks_pending_{checks_pending}"));
    }
    if checks_failed > 0 {
        blockers.push(format!("checks_failed_{checks_failed}"));
    }
    if status_contexts > 0 && status_state != "success" {
        blockers.push(format!("commit_status_{status_state}"));
    }

    let reviews_url = format!("https://api.github.com/repos/{}/pulls/{}/reviews?per_page=100", repository, pr_number);
    let reviews_payload = github_get_json(&reviews_url, &token)?;
    let reviews = reviews_payload.as_array().cloned().unwrap_or_default();
    let latest_reviews = latest_review_states(&reviews);
    let changes_requested = latest_reviews.values().filter(|state| state.as_str() == "CHANGES_REQUESTED").count();
    if changes_requested > 0 {
        blockers.push(format!("changes_requested_{changes_requested}"));
    }

    let requested_reviewers = pr.get("requested_reviewers").and_then(|v| v.as_array()).map(|v| v.len()).unwrap_or(0)
        + pr.get("requested_teams").and_then(|v| v.as_array()).map(|v| v.len()).unwrap_or(0);
    if requested_reviewers > 0 {
        blockers.push(format!("requested_reviews_pending_{requested_reviewers}"));
    }

    let ready = blockers.is_empty();
    let result = serde_json::json!({
        "evento_merge_readiness_version": 1,
        "issue_number": issue_number,
        "repository": repository,
        "pr_number": pr_number,
        "pr_url": pr_url,
        "task_state": task_state,
        "ready": ready,
        "status": if ready { "READY TO MERGE" } else { "BLOCKED" },
        "blockers": blockers,
        "pr": {
            "state": pr_state,
            "draft": pr.get("draft"),
            "mergeable": pr.get("mergeable"),
            "mergeable_state": mergeable_state,
            "base_ref": base_ref,
            "head_ref": head_ref,
            "head_sha": head_sha,
            "behind_by": behind_by
        },
        "ci": {
            "check_runs": check_runs.len(),
            "checks_pending": checks_pending,
            "checks_failed": checks_failed,
            "status_contexts": status_contexts,
            "combined_status": status_state
        },
        "reviews": {
            "changes_requested": changes_requested,
            "requested_reviewers": requested_reviewers
        },
        "merge": false,
        "deploy": false,
        "release": false
    });

    let task_repo = task_repository();
    let comment_url = format!("https://api.github.com/repos/{}/issues/{}/comments", task_repo, issue_number);
    let result_json = serde_json::to_string(&result).map_err(|error| error.to_string())?;
    let comment_body = format!(
        "## EVENTO merge readiness\n\nStatus: **{}**\n\nEVENTO_MERGE_READINESS_JSON={}\n\nMerge: **false**\nDeploy: **false**\nRelease: **false**",
        if ready { "READY TO MERGE" } else { "BLOCKED" },
        result_json
    );
    let response = ureq::post(&comment_url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({ "body": comment_body }))
        .map_err(|error| error.to_string())?;
    if response.status().as_u16() >= 300 {
        return Err(format!("Merge readiness audit comment failed: {}", response.status()));
    }

    Ok(result)
}



fn expected_merge_confirmation(issue_number: u64) -> String {
    format!("MERGE #{issue_number}")
}

fn mark_task_merged(issue_number: u64, merge_sha: &str, pr_url: &str) -> Result<(), String> {
    let token = credential_value("github")?;
    let repo = task_repository();
    let issue_url = format!("https://api.github.com/repos/{}/issues/{}", repo, issue_number);
    let issue = github_get_json(&issue_url, &token)?;
    let title = issue.get("title").and_then(|v| v.as_str()).unwrap_or("");
    let suffix = title
        .splitn(3, ']')
        .skip(2)
        .collect::<Vec<_>>()
        .join("]")
        .trim()
        .to_string();

    let response = ureq::patch(&issue_url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({
            "title": format!("[EVENTO TASK][MERGED] {}", suffix)
        }))
        .map_err(|error| error.to_string())?;
    if response.status().as_u16() >= 300 {
        return Err(format!("Task merge-state update failed: {}", response.status()));
    }

    let comment_url = format!(
        "https://api.github.com/repos/{}/issues/{}/comments",
        repo, issue_number
    );
    let body = format!(
        "## EVENTO protected merge\n\nStatus: **MERGED**\nPR: {pr_url}\nMerge SHA: {merge_sha}\nMethod: squash\n\nDeploy: **false**\nRelease: **false**\n\nThis merge does not authorize deployment or production release."
    );
    let response = ureq::post(&comment_url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({ "body": body }))
        .map_err(|error| error.to_string())?;
    if response.status().as_u16() >= 300 {
        return Err(format!("Task merge audit comment failed: {}", response.status()));
    }
    Ok(())
}

#[tauri::command]
fn remote_task_protected_merge(
    issue_number: u64,
    repository: String,
    confirmation: String,
) -> Result<serde_json::Value, String> {
    if confirmation != expected_merge_confirmation(issue_number) {
        return Err(format!(
            "Explicit confirmation required: {}",
            expected_merge_confirmation(issue_number)
        ));
    }

    let readiness = remote_task_merge_readiness(issue_number, repository.clone())?;
    if readiness.get("ready").and_then(|v| v.as_bool()) != Some(true) {
        return Err(format!(
            "Merge readiness blocked: {}",
            readiness
                .get("blockers")
                .map(|v| v.to_string())
                .unwrap_or_else(|| "unknown".to_string())
        ));
    }

    let token = credential_value("github")?;
    let pr_number = readiness
        .get("pr_number")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| "PR number missing from readiness".to_string())?;
    let head_sha = readiness
        .get("pr")
        .and_then(|v| v.get("head_sha"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "PR head SHA missing from readiness".to_string())?;
    let pr_url = readiness
        .get("pr_url")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let merge_url = format!(
        "https://api.github.com/repos/{}/pulls/{}/merge",
        repository, pr_number
    );
    let mut response = ureq::put(&merge_url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({
            "sha": head_sha,
            "merge_method": "squash",
            "commit_title": format!("EVENTO remote task #{}", issue_number)
        }))
        .map_err(|error| error.to_string())?;

    let payload = response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())?;
    if payload.get("merged").and_then(|v| v.as_bool()) != Some(true) {
        return Err(format!(
            "GitHub did not merge the PR: {}",
            payload.get("message").and_then(|v| v.as_str()).unwrap_or("unknown")
        ));
    }

    let merge_sha = payload
        .get("sha")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    mark_task_merged(issue_number, merge_sha, pr_url)?;
    spawn_post_merge_watch(issue_number, repository.clone(), merge_sha.to_string());

    Ok(serde_json::json!({
        "ok": true,
        "issue_number": issue_number,
        "repository": repository,
        "pr_number": pr_number,
        "pr_url": pr_url,
        "merge_sha": merge_sha,
        "method": "squash",
        "state": "merged",
        "deploy": false,
        "release": false
    }))
}



fn task_comments(issue_number: u64, token: &str) -> Result<Vec<serde_json::Value>, String> {
    let repo = task_repository();
    let url = format!(
        "https://api.github.com/repos/{}/issues/{}/comments?per_page=100",
        repo, issue_number
    );
    let payload = github_get_json(&url, token)?;
    Ok(payload.as_array().cloned().unwrap_or_default())
}

fn task_merge_sha(issue_number: u64, token: &str) -> Result<String, String> {
    for comment in task_comments(issue_number, token)?.iter().rev() {
        let body = comment.get("body").and_then(|v| v.as_str()).unwrap_or("");
        if !body.contains("EVENTO protected merge") {
            continue;
        }
        for line in body.lines() {
            if let Some(value) = line.strip_prefix("Merge SHA: ") {
                let sha = value.trim();
                if sha.len() >= 7 && sha.chars().all(|c| c.is_ascii_hexdigit()) {
                    return Ok(sha.to_string());
                }
            }
        }
    }
    Err("Merge SHA not found in task audit trail".to_string())
}

fn evaluate_post_merge_ci(repository: &str, merge_sha: &str) -> Result<serde_json::Value, String> {
    let token = credential_value("github")?;
    let default_branch = github_default_branch(repository, &token)?;

    let compare_url = format!(
        "https://api.github.com/repos/{}/compare/{}...{}",
        repository, merge_sha, default_branch
    );
    let compare = github_get_json(&compare_url, &token)?;
    let compare_status = compare.get("status").and_then(|v| v.as_str()).unwrap_or("unknown");
    let in_default_history = matches!(compare_status, "ahead" | "identical");

    let runs_url = format!(
        "https://api.github.com/repos/{}/actions/runs?branch={}&head_sha={}&per_page=100",
        repository, default_branch, merge_sha
    );
    let runs_payload = github_get_json(&runs_url, &token)?;
    let runs = runs_payload
        .get("workflow_runs")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let checks_url = format!(
        "https://api.github.com/repos/{}/commits/{}/check-runs?per_page=100",
        repository, merge_sha
    );
    let checks_payload = github_get_json(&checks_url, &token)?;
    let checks = checks_payload
        .get("check_runs")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let status_url = format!(
        "https://api.github.com/repos/{}/commits/{}/status",
        repository, merge_sha
    );
    let status_payload = github_get_json(&status_url, &token)?;
    let statuses = status_payload
        .get("statuses")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let combined_status = status_payload
        .get("state")
        .and_then(|v| v.as_str())
        .unwrap_or("pending");

    let mut pending = 0usize;
    let mut failed = 0usize;
    let mut successful = 0usize;

    for run in &runs {
        let status = run.get("status").and_then(|v| v.as_str()).unwrap_or("");
        let conclusion = run.get("conclusion").and_then(|v| v.as_str()).unwrap_or("");
        if status != "completed" {
            pending += 1;
        } else if matches!(conclusion, "success" | "neutral" | "skipped") {
            successful += 1;
        } else {
            failed += 1;
        }
    }

    for check in &checks {
        let status = check.get("status").and_then(|v| v.as_str()).unwrap_or("");
        let conclusion = check.get("conclusion").and_then(|v| v.as_str()).unwrap_or("");
        if status != "completed" {
            pending += 1;
        } else if matches!(conclusion, "success" | "neutral" | "skipped") {
            successful += 1;
        } else {
            failed += 1;
        }
    }

    if !statuses.is_empty() {
        match combined_status {
            "success" => successful += statuses.len(),
            "failure" | "error" => failed += statuses.len(),
            _ => pending += statuses.len(),
        }
    }

    let evidence_count = runs.len() + checks.len() + statuses.len();
    let verified = in_default_history && evidence_count > 0 && pending == 0 && failed == 0;
    let terminal_failure = !in_default_history || failed > 0;

    Ok(serde_json::json!({
        "evento_post_merge_version": 1,
        "repository": repository,
        "merge_sha": merge_sha,
        "default_branch": default_branch,
        "in_default_history": in_default_history,
        "compare_status": compare_status,
        "workflow_runs": runs.len(),
        "check_runs": checks.len(),
        "status_contexts": statuses.len(),
        "successful": successful,
        "pending": pending,
        "failed": failed,
        "evidence_count": evidence_count,
        "verified": verified,
        "terminal_failure": terminal_failure,
        "deploy": false,
        "release": false
    }))
}

fn post_task_audit(issue_number: u64, heading: &str, marker: &str, payload: &serde_json::Value) -> Result<(), String> {
    let token = credential_value("github")?;
    let repo = task_repository();
    let url = format!(
        "https://api.github.com/repos/{}/issues/{}/comments",
        repo, issue_number
    );
    let body = format!(
        "## {heading}\n\n{marker}={}\n\nDeploy: **false**\nRelease: **false**",
        serde_json::to_string(payload).map_err(|error| error.to_string())?
    );
    let response = ureq::post(&url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({ "body": body }))
        .map_err(|error| error.to_string())?;
    if response.status().as_u16() >= 300 {
        return Err(format!("Task audit comment failed: {}", response.status()));
    }
    Ok(())
}

fn set_task_state(issue_number: u64, state_label: &str) -> Result<(), String> {
    let token = credential_value("github")?;
    let repo = task_repository();
    let issue_url = format!("https://api.github.com/repos/{}/issues/{}", repo, issue_number);
    let issue = github_get_json(&issue_url, &token)?;
    let title = issue.get("title").and_then(|v| v.as_str()).unwrap_or("");
    let suffix = title
        .splitn(3, ']')
        .skip(2)
        .collect::<Vec<_>>()
        .join("]")
        .trim()
        .to_string();
    let response = ureq::patch(&issue_url)
        .header("Authorization", &format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2026-03-10")
        .send_json(serde_json::json!({
            "title": format!("[EVENTO TASK][{}] {}", state_label, suffix)
        }))
        .map_err(|error| error.to_string())?;
    if response.status().as_u16() >= 300 {
        return Err(format!("Task state update failed: {}", response.status()));
    }
    Ok(())
}

fn evaluate_and_record_post_merge(
    issue_number: u64,
    repository: &str,
    merge_sha: &str,
) -> Result<serde_json::Value, String> {
    let result = evaluate_post_merge_ci(repository, merge_sha)?;
    if result.get("verified").and_then(|v| v.as_bool()) == Some(true) {
        set_task_state(issue_number, "MERGED-VERIFIED")?;
    }
    post_task_audit(
        issue_number,
        "EVENTO post-merge verification",
        "EVENTO_POST_MERGE_JSON",
        &result,
    )?;
    Ok(result)
}

fn spawn_post_merge_watch(issue_number: u64, repository: String, merge_sha: String) {
    std::thread::spawn(move || {
        for attempt in 0..50u32 {
            if attempt > 0 {
                std::thread::sleep(Duration::from_secs(12));
            }
            if let Ok(result) = evaluate_post_merge_ci(&repository, &merge_sha) {
                if result.get("verified").and_then(|v| v.as_bool()) == Some(true) {
                    let _ = set_task_state(issue_number, "MERGED-VERIFIED");
                    let _ = post_task_audit(
                        issue_number,
                        "EVENTO post-merge verification",
                        "EVENTO_POST_MERGE_JSON",
                        &result,
                    );
                    break;
                }
                if result.get("terminal_failure").and_then(|v| v.as_bool()) == Some(true) {
                    let _ = post_task_audit(
                        issue_number,
                        "EVENTO post-merge verification",
                        "EVENTO_POST_MERGE_JSON",
                        &result,
                    );
                    break;
                }
            }
        }
    });
}

#[tauri::command]
fn remote_task_post_merge_verify(
    issue_number: u64,
    repository: String,
) -> Result<serde_json::Value, String> {
    let token = credential_value("github")?;
    let task_state = github_task_state(issue_number, &token)?;
    if !matches!(task_state.as_str(), "merged" | "merged-verified") {
        return Err("Post-merge verification requires a merged task".to_string());
    }
    let merge_sha = task_merge_sha(issue_number, &token)?;
    evaluate_and_record_post_merge(issue_number, &repository, &merge_sha)
}

fn deploy_registry() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("../../../../registry/evento-deploy-targets.json"))
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn remote_task_deploy_readiness(
    issue_number: u64,
    project_id: String,
) -> Result<serde_json::Value, String> {
    let token = credential_value("github")?;
    let task_state = github_task_state(issue_number, &token)?;
    let mut blockers: Vec<String> = Vec::new();
    if task_state != "merged-verified" {
        blockers.push("post_merge_not_verified".to_string());
    }

    let registry = deploy_registry()?;
    let project = registry
        .get("projects")
        .and_then(|v| v.get(&project_id))
        .cloned();

    let Some(project) = project else {
        blockers.push("deploy_target_not_registered".to_string());
        let result = serde_json::json!({
            "evento_deploy_readiness_version": 1,
            "issue_number": issue_number,
            "project_id": project_id,
            "task_state": task_state,
            "ready": false,
            "status": "NOT DEPLOYABLE",
            "blockers": blockers,
            "deploy": false,
            "production": false,
            "release": false
        });
        post_task_audit(
            issue_number,
            "EVENTO deploy readiness",
            "EVENTO_DEPLOY_READINESS_JSON",
            &result,
        )?;
        return Ok(result);
    };

    let preview_supported = project
        .get("preview_supported")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let binding_verified = project
        .get("binding_verified")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let target = project.get("deploy_target").and_then(|v| v.as_str()).unwrap_or("");

    if !preview_supported {
        blockers.push("preview_not_supported".to_string());
    }
    if target.is_empty() {
        blockers.push("no_deploy_target_registered".to_string());
    }
    if !binding_verified {
        blockers.push("deploy_binding_not_verified".to_string());
    }

    if target == "vercel-preview" {
        match credential_value("vercel") {
            Ok(secret) => {
                if probe_json(
                    "https://api.vercel.com/v2/user",
                    ("Authorization", format!("Bearer {secret}")),
                ).is_err() {
                    blockers.push("vercel_auth_failed".to_string());
                }
            }
            Err(_) => blockers.push("vercel_credential_missing".to_string()),
        }
    }

    let ready = blockers.is_empty();
    let result = serde_json::json!({
        "evento_deploy_readiness_version": 1,
        "issue_number": issue_number,
        "project_id": project_id,
        "task_state": task_state,
        "target": target,
        "preview_supported": preview_supported,
        "binding_verified": binding_verified,
        "ready": ready,
        "status": if ready { "READY FOR PREVIEW DEPLOY" } else { "NOT DEPLOYABLE" },
        "blockers": blockers,
        "deploy": false,
        "production": false,
        "release": false
    });
    post_task_audit(
        issue_number,
        "EVENTO deploy readiness",
        "EVENTO_DEPLOY_READINESS_JSON",
        &result,
    )?;
    Ok(result)
}



fn split_github_repository(repository: &str) -> Result<(&str, &str), String> {
    let mut parts = repository.split('/');
    let owner = parts.next().unwrap_or("");
    let name = parts.next().unwrap_or("");
    if owner.is_empty() || name.is_empty() || parts.next().is_some() {
        return Err("Repository must be owner/name".to_string());
    }
    Ok((owner, name))
}

fn vercel_api_json(
    method: &str,
    url: &str,
    token: &str,
    body: Option<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let mut response = match method {
        "GET" => ureq::get(url)
            .header("Authorization", &format!("Bearer {token}"))
            .header("Accept", "application/json")
            .call()
            .map_err(|error| error.to_string())?,
        "POST" => ureq::post(url)
            .header("Authorization", &format!("Bearer {token}"))
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .send_json(body.ok_or_else(|| "Vercel POST body missing".to_string())?)
            .map_err(|error| error.to_string())?,
        _ => return Err("Unsupported Vercel API method".to_string()),
    };

    response
        .body_mut()
        .read_json::<serde_json::Value>()
        .map_err(|error| error.to_string())
}

fn smoke_preview_url(url: &str, paths: &[String]) -> Vec<serde_json::Value> {
    let base = if url.starts_with("https://") {
        url.trim_end_matches('/').to_string()
    } else {
        format!("https://{}", url.trim_end_matches('/'))
    };
    let mut results = Vec::new();

    for path in paths {
        let normalized = if path.starts_with('/') {
            path.clone()
        } else {
            format!("/{path}")
        };
        let target = format!("{base}{normalized}");
        let outcome = ureq::get(&target)
            .config()
            .timeout_global(Some(Duration::from_secs(12)))
            .build()
            .call();

        match outcome {
            Ok(response) => {
                let status = response.status().as_u16();
                results.push(serde_json::json!({
                    "path": normalized,
                    "url": target,
                    "status": status,
                    "ok": (200..400).contains(&status)
                }));
            }
            Err(error) => {
                results.push(serde_json::json!({
                    "path": normalized,
                    "url": target,
                    "status": null,
                    "ok": false,
                    "error": error.to_string()
                }));
            }
        }
    }

    results
}

fn preview_deploy_project_config(project_id: &str) -> Result<serde_json::Value, String> {
    deploy_registry()?
        .get("projects")
        .and_then(|v| v.get(project_id))
        .cloned()
        .ok_or_else(|| "Deploy target is not registered".to_string())
}

#[tauri::command]
fn remote_task_preview_deploy(
    issue_number: u64,
    project_id: String,
    repository: String,
) -> Result<serde_json::Value, String> {
    let readiness = remote_task_deploy_readiness(issue_number, project_id.clone())?;
    if readiness.get("ready").and_then(|v| v.as_bool()) != Some(true) {
        return Err(format!(
            "Preview deploy readiness blocked: {}",
            readiness
                .get("blockers")
                .map(|v| v.to_string())
                .unwrap_or_else(|| "unknown".to_string())
        ));
    }

    let project = preview_deploy_project_config(&project_id)?;
    if project.get("deploy_target").and_then(|v| v.as_str()) != Some("vercel-preview") {
        return Err("Only vercel-preview is enabled in preview deploy v1".to_string());
    }
    if project.get("binding_verified").and_then(|v| v.as_bool()) != Some(true) {
        return Err("Deploy binding is not verified".to_string());
    }

    let configured_repo = project.get("repository").and_then(|v| v.as_str()).unwrap_or("");
    if configured_repo != repository {
        return Err("Task repository does not match the verified deploy binding".to_string());
    }

    let team_id = project
        .get("vercel_team_id")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .ok_or_else(|| "Vercel team binding missing".to_string())?;
    let project_id_vercel = project
        .get("vercel_project_id")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .ok_or_else(|| "Vercel project ID missing".to_string())?;
    let project_name = project
        .get("vercel_project_name")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .ok_or_else(|| "Vercel project name missing".to_string())?;

    let token = credential_value("github")?;
    let task_state = github_task_state(issue_number, &token)?;
    if task_state != "merged-verified" {
        return Err("Preview deploy requires MERGED-VERIFIED task state".to_string());
    }
    let merge_sha = task_merge_sha(issue_number, &token)?;

    let (org, repo_name) = split_github_repository(&repository)?;
    let vercel_token = credential_value("vercel")?;
    let create_url = format!(
        "https://api.vercel.com/v13/deployments?teamId={}",
        team_id
    );

    let created = vercel_api_json(
        "POST",
        &create_url,
        &vercel_token,
        Some(serde_json::json!({
            "name": project_name,
            "project": project_id_vercel,
            "gitSource": {
                "type": "github",
                "org": org,
                "repo": repo_name,
                "ref": merge_sha
            },
            "gitMetadata": {
                "commitSha": merge_sha,
                "dirty": "false",
                "ci": "true",
                "ciType": "evento-desktop"
            }
        })),
    )?;

    let deployment_id = created
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Vercel deployment ID missing".to_string())?
        .to_string();

    let mut deployment = created;
    for _ in 0..60 {
        let state = deployment
            .get("readyState")
            .or_else(|| deployment.get("status"))
            .and_then(|v| v.as_str())
            .unwrap_or("");
        if matches!(state, "READY" | "ERROR" | "CANCELED") {
            break;
        }
        std::thread::sleep(Duration::from_secs(5));
        let inspect_url = format!(
            "https://api.vercel.com/v13/deployments/{}?teamId={}",
            deployment_id, team_id
        );
        deployment = vercel_api_json("GET", &inspect_url, &vercel_token, None)?;
    }

    let ready_state = deployment
        .get("readyState")
        .or_else(|| deployment.get("status"))
        .and_then(|v| v.as_str())
        .unwrap_or("UNKNOWN")
        .to_string();
    let deployment_url = deployment
        .get("url")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let smoke_paths = project
        .get("smoke_paths")
        .and_then(|v| v.as_array())
        .map(|items| {
            items.iter()
                .filter_map(|v| v.as_str())
                .map(str::to_string)
                .collect::<Vec<_>>()
        })
        .unwrap_or_else(|| vec!["/".to_string()]);

    let smoke = if ready_state == "READY" && !deployment_url.is_empty() {
        smoke_preview_url(&deployment_url, &smoke_paths)
    } else {
        Vec::new()
    };
    let smoke_passed = !smoke.is_empty()
        && smoke
            .iter()
            .all(|item| item.get("ok").and_then(|v| v.as_bool()) == Some(true));
    let verified = ready_state == "READY" && smoke_passed;

    let result = serde_json::json!({
        "evento_preview_deploy_version": 1,
        "issue_number": issue_number,
        "project_id": project_id,
        "repository": repository,
        "merge_sha": merge_sha,
        "provider": "vercel",
        "environment": "preview",
        "deployment_id": deployment_id,
        "deployment_url": deployment_url,
        "ready_state": ready_state,
        "smoke_mode": project.get("smoke_mode"),
        "smoke": smoke,
        "verified": verified,
        "production": false,
        "release": false
    });

    post_task_audit(
        issue_number,
        "EVENTO preview deploy",
        "EVENTO_PREVIEW_DEPLOY_JSON",
        &result,
    )?;

    if verified {
        set_task_state(issue_number, "PREVIEW-VERIFIED")?;
    }

    Ok(result)
}



#[tauri::command]
fn remote_task_production_readiness(
    issue_number: u64,
    project_id: String,
) -> Result<serde_json::Value, String> {
    let token = credential_value("github")?;
    let task_state = github_task_state(issue_number, &token)?;
    let mut blockers: Vec<String> = Vec::new();

    if task_state != "preview-accepted" {
        blockers.push("preview_not_accepted".to_string());
    }

    let registry = deploy_registry()?;
    let production_policy = registry
        .get("policy")
        .and_then(|v| v.get("production_deploy"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    if !production_policy {
        blockers.push("production_deploy_policy_disabled".to_string());
    }

    let project = registry
        .get("projects")
        .and_then(|v| v.get(&project_id))
        .cloned();

    let Some(project) = project else {
        blockers.push("deploy_target_not_registered".to_string());
        let result = serde_json::json!({
            "evento_production_readiness_version": 1,
            "issue_number": issue_number,
            "project_id": project_id,
            "task_state": task_state,
            "ready": false,
            "status": "PRODUCTION BLOCKED",
            "blockers": blockers,
            "deploy": false,
            "production": false,
            "release": false
        });
        post_task_audit(
            issue_number,
            "EVENTO production readiness",
            "EVENTO_PRODUCTION_READINESS_JSON",
            &result,
        )?;
        return Ok(result);
    };

    let binding_verified = project
        .get("binding_verified")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let production_supported = project
        .get("production_supported")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let release_enabled = project
        .get("release")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let provider = project.get("provider").and_then(|v| v.as_str()).unwrap_or("");
    let target = project.get("deploy_target").and_then(|v| v.as_str()).unwrap_or("");

    if !binding_verified {
        blockers.push("deploy_binding_not_verified".to_string());
    }
    if !production_supported {
        blockers.push("production_not_supported".to_string());
    }
    if release_enabled {
        blockers.push("release_flag_must_remain_false_in_readiness".to_string());
    }

    if provider == "vercel" {
        match credential_value("vercel") {
            Ok(secret) => {
                if probe_json(
                    "https://api.vercel.com/v2/user",
                    ("Authorization", format!("Bearer {secret}")),
                ).is_err() {
                    blockers.push("vercel_auth_failed".to_string());
                }
            }
            Err(_) => blockers.push("vercel_credential_missing".to_string()),
        }
    } else if !provider.is_empty() {
        blockers.push("production_provider_not_allowlisted".to_string());
    } else {
        blockers.push("production_provider_missing".to_string());
    }

    let ready = blockers.is_empty();
    let result = serde_json::json!({
        "evento_production_readiness_version": 1,
        "issue_number": issue_number,
        "project_id": project_id,
        "task_state": task_state,
        "provider": provider,
        "target": target,
        "binding_verified": binding_verified,
        "production_supported": production_supported,
        "production_policy": production_policy,
        "ready": ready,
        "status": if ready { "READY FOR PRODUCTION HANDOFF" } else { "PRODUCTION BLOCKED" },
        "blockers": blockers,
        "deploy": false,
        "production": false,
        "release": false
    });

    post_task_audit(
        issue_number,
        "EVENTO production readiness",
        "EVENTO_PRODUCTION_READINESS_JSON",
        &result,
    )?;
    Ok(result)
}



#[tauri::command]
fn remote_task_rollback_readiness(
    issue_number: u64,
    project_id: String,
) -> Result<serde_json::Value, String> {
    let token = credential_value("github")?;
    let task_state = github_task_state(issue_number, &token)?;
    let mut blockers: Vec<String> = Vec::new();

    if task_state != "production-handoff-approved" {
        blockers.push("production_handoff_not_approved".to_string());
    }

    let registry = deploy_registry()?;
    let project = registry
        .get("projects")
        .and_then(|v| v.get(&project_id))
        .cloned();

    let Some(project) = project else {
        blockers.push("deploy_target_not_registered".to_string());
        let result = serde_json::json!({
            "evento_rollback_readiness_version": 1,
            "issue_number": issue_number,
            "project_id": project_id,
            "task_state": task_state,
            "ready": false,
            "status": "ROLLBACK BLOCKED",
            "blockers": blockers,
            "rollback": false,
            "deploy": false,
            "release": false
        });
        post_task_audit(
            issue_number,
            "EVENTO rollback readiness",
            "EVENTO_ROLLBACK_READINESS_JSON",
            &result,
        )?;
        return Ok(result);
    };

    let binding_verified = project
        .get("binding_verified")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let production_supported = project
        .get("production_supported")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let provider = project.get("provider").and_then(|v| v.as_str()).unwrap_or("");

    if !binding_verified {
        blockers.push("deploy_binding_not_verified".to_string());
    }
    if !production_supported {
        blockers.push("production_not_supported".to_string());
    }

    let mut rollback_candidates: Vec<serde_json::Value> = Vec::new();

    if provider == "vercel" {
        let team_id = project
            .get("vercel_team_id")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let project_id_vercel = project
            .get("vercel_project_id")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        if team_id.is_empty() || project_id_vercel.is_empty() {
            blockers.push("vercel_binding_incomplete".to_string());
        } else {
            match credential_value("vercel") {
                Ok(secret) => {
                    let url = format!(
                        "https://api.vercel.com/v7/deployments?teamId={}&projectId={}&target=production&state=READY&rollbackCandidate=true&limit=10",
                        team_id, project_id_vercel
                    );
                    match vercel_api_json("GET", &url, &secret, None) {
                        Ok(payload) => {
                            rollback_candidates = payload
                                .get("deployments")
                                .and_then(|v| v.as_array())
                                .cloned()
                                .unwrap_or_default()
                                .into_iter()
                                .map(|item| serde_json::json!({
                                    "id": item.get("uid").or_else(|| item.get("id")).cloned(),
                                    "url": item.get("url").cloned(),
                                    "created": item.get("created").or_else(|| item.get("createdAt")).cloned(),
                                    "state": item.get("state").or_else(|| item.get("readyState")).cloned()
                                }))
                                .collect();

                            if rollback_candidates.is_empty() {
                                blockers.push("no_verified_rollback_candidate".to_string());
                            }
                        }
                        Err(_) => blockers.push("vercel_rollback_query_failed".to_string()),
                    }
                }
                Err(_) => blockers.push("vercel_credential_missing".to_string()),
            }
        }
    } else if !provider.is_empty() {
        blockers.push("rollback_provider_not_allowlisted".to_string());
    } else {
        blockers.push("rollback_provider_missing".to_string());
    }

    let ready = blockers.is_empty();
    let result = serde_json::json!({
        "evento_rollback_readiness_version": 1,
        "issue_number": issue_number,
        "project_id": project_id,
        "task_state": task_state,
        "provider": provider,
        "binding_verified": binding_verified,
        "production_supported": production_supported,
        "rollback_candidates": rollback_candidates,
        "ready": ready,
        "status": if ready { "ROLLBACK READY" } else { "ROLLBACK BLOCKED" },
        "blockers": blockers,
        "rollback": false,
        "deploy": false,
        "release": false
    });

    post_task_audit(
        issue_number,
        "EVENTO rollback readiness",
        "EVENTO_ROLLBACK_READINESS_JSON",
        &result,
    )?;

    Ok(result)
}

fn expected_production_confirmation(issue_number: u64) -> String {
    format!("PRODUCTION #{issue_number}")
}

#[tauri::command]
fn remote_task_plan(
    state: State<'_, DaemonState>,
    project_id: String,
    objective: String,
    preferred_agent: String,
) -> Result<serde_json::Value, String> {
    let provider = if preferred_agent == "claude-code" {
        "claude-code"
    } else {
        "codex"
    };
    agent_plan(state, provider.to_string(), project_id, objective)
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
            agent_plan,
            set_operator_mode,
            project_action,
            credential_status,
            credential_set,
            credential_delete,
            connector_probe,
            remote_tasks,
            remote_task_plan,
            remote_task_execute,
            remote_task_review_gate,
            remote_task_publish_pr,
            remote_task_safe_pipeline,
            remote_task_merge_readiness,
            remote_task_protected_merge,
            remote_task_post_merge_verify,
            remote_task_deploy_readiness,
            remote_task_preview_deploy,
            remote_task_production_readiness,
            remote_task_rollback_readiness,
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

    #[test]
    fn merge_readiness_title_state_requires_handoff() {
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][MERGE-HANDOFF-APPROVED] x"), Some("merge-handoff-approved"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][MERGED] x"), Some("merged"));
        assert_ne!(remote_task_state_from_title("[EVENTO TASK][PR-OPEN] x"), Some("merge-handoff-approved"));
    }

    #[test]
    fn post_merge_state_is_separate_from_release() {
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][MERGED-VERIFIED] x"), Some("merged-verified"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][MERGED] x"), Some("merged"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][RELEASED] x"), None);
    }

    #[test]
    fn preview_verified_state_is_not_release() {
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][PREVIEW-VERIFIED] x"), Some("preview-verified"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][RELEASED] x"), None);
    }

    #[test]
    fn deploy_registry_is_default_deny() {
        let registry = deploy_registry().expect("deploy registry");
        assert_eq!(registry["policy"]["default"], "deny");
        assert_eq!(registry["policy"]["production_deploy"], false);
        assert_eq!(registry["policy"]["release"], false);
        assert_eq!(registry["projects"]["evento-one"]["deploy_target"], "vercel-preview");
        assert_eq!(registry["projects"]["evento-one"]["binding_verified"], true);
        assert_eq!(registry["projects"]["evento-one"]["production_supported"], false);
        assert_eq!(registry["projects"]["evento-acquisition"]["binding_verified"], false);
    }

    #[test]
    fn github_repository_binding_is_strict() {
        assert_eq!(split_github_repository("EVENTo0/Evento-One").unwrap(), ("EVENTo0", "Evento-One"));
        assert!(split_github_repository("Evento-One").is_err());
        assert!(split_github_repository("EVENTo0/Evento-One/extra").is_err());
    }

    #[test]
    fn preview_acceptance_state_is_not_release() {
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][PREVIEW-ACCEPTED] x"), Some("preview-accepted"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][RELEASED] x"), None);
    }

    #[test]
    fn production_confirmation_is_distinct_from_merge() {
        assert_eq!(expected_production_confirmation(42), "PRODUCTION #42");
        assert_ne!(expected_production_confirmation(42), expected_merge_confirmation(42));
    }

    #[test]
    fn protected_merge_requires_exact_confirmation() {
        assert_eq!(expected_merge_confirmation(42), "MERGE #42");
        assert_ne!(expected_merge_confirmation(42), "MERGE 42");
    }

    #[test]
    fn remote_task_title_states_are_bounded() {
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][APPROVED] x"), Some("approved"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][LOCAL-BUILT] x"), Some("local-built"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][PR-OPEN] x"), Some("pr-open"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][REVISION-REQUESTED] x"), Some("revision-requested"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][MERGE-HANDOFF-APPROVED] x"), Some("merge-handoff-approved"));
        assert_eq!(remote_task_state_from_title("[EVENTO TASK][RELEASED] x"), None);
        assert_eq!(remote_task_state_from_title("ordinary issue"), None);
    }
}
