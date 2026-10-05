#!/usr/bin/env python3
"""EVENTO local control daemon.

v0.2 foundations:
- localhost only
- read-only diagnostics
- optional, separately authenticated bounded writes
- allowlisted workspace / Git worktree / Python-script adapters
- no arbitrary shell and no release authority
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

HOST = "127.0.0.1"
PORT = int(os.environ.get("EVENTO_DAEMON_PORT", "8765"))
TOKEN = os.environ.get("EVENTO_DAEMON_TOKEN", "")
WRITE_TOKEN = os.environ.get("EVENTO_DAEMON_WRITE_TOKEN", "")
WRITE_ENABLED = os.environ.get("EVENTO_ENABLE_WRITES", "").lower() == "true"

REPO_ROOT = Path(__file__).resolve().parents[3]
RESOURCE_ROOT = Path(os.environ.get("EVENTO_RESOURCE_ROOT", str(REPO_ROOT))).expanduser().resolve()
CONNECTOR_REGISTRY = RESOURCE_ROOT / "registry" / "evento-connectors.json"
LOCAL_ACTIONS = RESOURCE_ROOT / "registry" / "evento-local-actions.json"
LOCAL_WRITE_ACTIONS = RESOURCE_ROOT / "registry" / "evento-local-write-actions.json"
PROJECT_WORKSPACES = RESOURCE_ROOT / "registry" / "evento-project-workspaces.json"
PROJECT_TEST_GATES = RESOURCE_ROOT / "registry" / "evento-project-test-gates.json"

DEFAULT_WORKSPACE_ROOT = REPO_ROOT / ".evento-workspaces"
APPROVED_SCRIPT_ROOTS = (
    RESOURCE_ROOT / "scripts",
    REPO_ROOT / "scripts",
    REPO_ROOT / "tools",
    REPO_ROOT / "apps" / "evento-desktop" / "scripts",
)


def _csv_paths(value: str) -> tuple[Path, ...]:
    items = [Path(x.strip()).expanduser().resolve() for x in value.split(",") if x.strip()]
    return tuple(items)


def workspace_roots() -> tuple[Path, ...]:
    configured = _csv_paths(os.environ.get("EVENTO_WORKSPACE_ROOTS", ""))
    return configured or (DEFAULT_WORKSPACE_ROOT.resolve(),)


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_connectors() -> dict[str, Any]:
    return load_json(CONNECTOR_REGISTRY)


def load_local_actions() -> dict[str, Any]:
    return load_json(LOCAL_ACTIONS)


def load_local_write_actions() -> dict[str, Any]:
    return load_json(LOCAL_WRITE_ACTIONS)


def load_project_workspaces() -> dict[str, Any]:
    return load_json(PROJECT_WORKSPACES)


def load_project_test_gates() -> dict[str, Any]:
    return load_json(PROJECT_TEST_GATES)


def inspect_git_workspace(path: Path) -> dict[str, Any]:
    root = path.expanduser().resolve()
    result: dict[str, Any] = {
        "path": str(root),
        "exists": root.exists(),
        "is_git": False,
        "branch": None,
        "head": None,
        "dirty": None,
        "worktrees": [],
    }
    if not root.is_dir():
        return result
    git = shutil.which("git")
    if not git:
        return result
    probe = subprocess.run([git, "-C", str(root), "rev-parse", "--show-toplevel"], capture_output=True, text=True, timeout=8, check=False)
    if probe.returncode != 0:
        return result
    result["is_git"] = True
    branch = subprocess.run([git, "-C", str(root), "branch", "--show-current"], capture_output=True, text=True, timeout=8, check=False)
    head = subprocess.run([git, "-C", str(root), "rev-parse", "HEAD"], capture_output=True, text=True, timeout=8, check=False)
    status = subprocess.run([git, "-C", str(root), "status", "--porcelain"], capture_output=True, text=True, timeout=8, check=False)
    worktrees = subprocess.run([git, "-C", str(root), "worktree", "list", "--porcelain"], capture_output=True, text=True, timeout=8, check=False)
    result["branch"] = branch.stdout.strip() or None
    result["head"] = head.stdout.strip() or None
    result["dirty"] = bool(status.stdout.strip())
    result["worktrees"] = [line.split(" ", 1)[1] for line in worktrees.stdout.splitlines() if line.startswith("worktree ")]
    return result


def project_workspace_snapshot() -> dict[str, Any]:
    registry = load_project_workspaces()
    projects: list[dict[str, Any]] = []
    for item in registry["projects"]:
        configured = os.environ.get(item["local_path_env"], "").strip()
        entry = {
            "project_id": item["project_id"],
            "repository": item["repository"],
            "role": item["role"],
            "local_path_env": item["local_path_env"],
            "configured": bool(configured),
            "workspace": None,
        }
        if configured:
            entry["workspace"] = inspect_git_workspace(Path(configured))
        projects.append(entry)
    return {"version": registry["version"], "projects": projects}


def registered_project_path(project_id: str) -> Path:
    item = next((x for x in load_project_workspaces()["projects"] if x["project_id"] == project_id), None)
    if item is None:
        raise KeyError("unknown_project")
    configured = os.environ.get(item["local_path_env"], "").strip()
    if not configured:
        raise ValueError("project_unconfigured")
    path = Path(configured).expanduser().resolve()
    if not path.is_dir():
        raise ValueError("project_path_missing")
    return path


def safe_project_child(project_id: str, relative_path: str) -> Path:
    root = registered_project_path(project_id)
    target = (root / relative_path).resolve()
    if not _inside(target, (root,)):
        raise PermissionError("project_path_escape")
    return target


def project_create_worktree(project_id: str, branch: str, base_ref: str = "HEAD") -> dict[str, Any]:
    repo = registered_project_path(project_id)
    if not branch.startswith("evento/"):
        raise PermissionError("branch_prefix_required")
    slug = branch.replace("/", "-").replace("\\", "-")
    destination = safe_workspace_path(project_id + "/worktrees/" + slug)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise FileExistsError("destination_exists")
    completed = subprocess.run(
        ["git", "-C", str(repo), "worktree", "add", "-b", branch, str(destination), base_ref],
        capture_output=True, text=True, timeout=30, check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError((completed.stderr or completed.stdout).strip()[:2000])
    return {"action": "project-create-worktree", "project_id": project_id, "branch": branch, "destination": str(destination), "base_ref": base_ref}


def _configured_executable(env_name: str, fallbacks: tuple[str, ...]) -> str | None:
    configured = os.environ.get(env_name, "").strip()
    if configured:
        path = Path(configured).expanduser().resolve()
        if not path.is_file():
            raise ValueError(env_name.lower() + "_invalid")
        return str(path)
    for name in fallbacks:
        found = shutil.which(name)
        if found:
            return found
    return None


def _launch(command: list[str], cwd: Path) -> dict[str, Any]:
    kwargs: dict[str, Any] = {
        "cwd": cwd,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    if os.name == "nt":
        kwargs["creationflags"] = getattr(subprocess, "DETACHED_PROCESS", 0) | getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
    else:
        kwargs["start_new_session"] = True
    subprocess.Popen(command, **kwargs)
    return {"launched": True, "command": command[0]}


def project_open_folder(project_id: str) -> dict[str, Any]:
    path = registered_project_path(project_id)
    if os.name == "nt":
        command = ["explorer.exe", str(path)]
    elif shutil.which("open"):
        command = ["open", str(path)]
    elif shutil.which("xdg-open"):
        command = ["xdg-open", str(path)]
    else:
        raise RuntimeError("folder_opener_unavailable")
    result = _launch(command, path)
    return {"action": "project-open-folder", "project_id": project_id, "path": str(path), **result}


def blender_open_project(project_id: str, blend_file: str) -> dict[str, Any]:
    target = safe_project_child(project_id, blend_file)
    if target.suffix.lower() != ".blend" or not target.is_file():
        raise ValueError("blend_file_invalid")
    executable = _configured_executable("EVENTO_BLENDER_EXECUTABLE", ("blender",))
    if not executable:
        raise RuntimeError("blender_unavailable")
    result = _launch([executable, str(target)], registered_project_path(project_id))
    return {"action": "blender-open-project", "project_id": project_id, "file": str(target), **result}


def unity_open_project(project_id: str, unity_project: str = ".") -> dict[str, Any]:
    target = safe_project_child(project_id, unity_project)
    if not (target / "Assets").is_dir() or not (target / "ProjectSettings").is_dir():
        raise ValueError("unity_project_invalid")
    executable = _configured_executable("EVENTO_UNITY_EDITOR", ("Unity", "Unity.exe"))
    if not executable:
        raise RuntimeError("unity_unavailable")
    result = _launch([executable, "-projectPath", str(target)], target)
    return {"action": "unity-open-project", "project_id": project_id, "path": str(target), **result}




def android_install_apk(project_id: str, apk_path: str) -> dict[str, Any]:
    target = safe_project_child(project_id, apk_path)
    if target.suffix.lower() != ".apk" or not target.is_file():
        raise ValueError("apk_file_invalid")
    adb = _configured_executable("EVENTO_ADB_EXECUTABLE", ("adb", "adb.exe"))
    if not adb:
        raise RuntimeError("adb_unavailable")
    completed = subprocess.run(
        [adb, "install", "-r", str(target)],
        cwd=registered_project_path(project_id),
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    output = ((completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")).strip()
    if completed.returncode != 0:
        raise RuntimeError(output[:4000] or "adb_install_failed")
    return {"action": "android-install-apk", "project_id": project_id, "apk": str(target), "output": output[:4000]}


def unity_run_editmode_tests(project_id: str, unity_project: str = ".") -> dict[str, Any]:
    target = safe_project_child(project_id, unity_project)
    if not (target / "Assets").is_dir() or not (target / "ProjectSettings").is_dir():
        raise ValueError("unity_project_invalid")
    executable = _configured_executable("EVENTO_UNITY_EDITOR", ("Unity", "Unity.exe"))
    if not executable:
        raise RuntimeError("unity_unavailable")
    evidence_dir = safe_workspace_path(project_id + "/evidence/unity")
    evidence_dir.mkdir(parents=True, exist_ok=True)
    results = evidence_dir / "editmode-results.xml"
    log_file = evidence_dir / "editmode.log"
    completed = subprocess.run(
        [
            executable,
            "-batchmode",
            "-nographics",
            "-quit",
            "-projectPath",
            str(target),
            "-runTests",
            "-testPlatform",
            "editmode",
            "-testResults",
            str(results),
            "-logFile",
            str(log_file),
        ],
        cwd=target,
        capture_output=True,
        text=True,
        timeout=900,
        check=False,
    )
    if completed.returncode != 0:
        tail = ""
        if log_file.is_file():
            tail = log_file.read_text(encoding="utf-8", errors="replace")[-8000:]
        raise RuntimeError(tail or "unity_tests_failed")
    return {
        "action": "unity-run-editmode-tests",
        "project_id": project_id,
        "results": str(results),
        "log": str(log_file),
        "exit_code": completed.returncode,
    }


def blender_export_glb(project_id: str, blend_file: str) -> dict[str, Any]:
    target = safe_project_child(project_id, blend_file)
    if target.suffix.lower() != ".blend" or not target.is_file():
        raise ValueError("blend_file_invalid")
    executable = _configured_executable("EVENTO_BLENDER_EXECUTABLE", ("blender",))
    if not executable:
        raise RuntimeError("blender_unavailable")
    script = approved_script_path("blender_export_glb.py")
    export_dir = safe_workspace_path(project_id + "/artifacts/blender")
    export_dir.mkdir(parents=True, exist_ok=True)
    output = export_dir / (target.stem + ".glb")
    completed = subprocess.run(
        [
            executable,
            "--background",
            str(target),
            "--python",
            str(script),
            "--",
            "--output",
            str(output),
        ],
        cwd=registered_project_path(project_id),
        capture_output=True,
        text=True,
        timeout=900,
        check=False,
    )
    logs = ((completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")).strip()
    if completed.returncode != 0 or not output.is_file():
        raise RuntimeError(logs[-8000:] or "blender_export_failed")
    return {
        "action": "blender-export-glb",
        "project_id": project_id,
        "source": str(target),
        "output": str(output),
        "bytes": output.stat().st_size,
        "log": logs[-4000:],
    }

def _inside(path: Path, roots: tuple[Path, ...]) -> bool:
    resolved = path.resolve()
    return any(resolved == root or root in resolved.parents for root in roots)


def safe_workspace_path(relative_path: str, root: Path | None = None) -> Path:
    base = (root or workspace_roots()[0]).resolve()
    target = (base / relative_path).resolve()
    if not _inside(target, (base,)):
        raise PermissionError("workspace_path_escape")
    return target


def approved_script_path(script: str) -> Path:
    raw = Path(script)
    candidates = [raw.resolve()] if raw.is_absolute() else [(root / raw).resolve() for root in APPROVED_SCRIPT_ROOTS]
    approved_roots = tuple(root.resolve() for root in APPROVED_SCRIPT_ROOTS)
    for candidate in candidates:
        if candidate.suffix == ".py" and candidate.is_file() and _inside(candidate, approved_roots):
            return candidate
    raise PermissionError("script_not_approved")




def agent_plan(provider: str, project_id: str, prompt: str) -> dict[str, Any]:
    if provider not in {"codex", "claude-code"}:
        raise PermissionError("agent_provider_not_allowlisted")
    clean_prompt = prompt.strip()
    if not clean_prompt or len(clean_prompt) > 8000:
        raise ValueError("agent_prompt_invalid")

    project = registered_project_path(project_id)
    guardrail = (
        "EVENTO READ-ONLY PLANNING TASK. Do not modify files, commit, push, deploy, "
        "change credentials, or perform release actions. Inspect the repository and return "
        "a concrete plan, risks, tests, and evidence needed. Task: "
    )
    task = guardrail + clean_prompt

    if provider == "codex":
        executable = _configured_executable("EVENTO_CODEX_EXECUTABLE", ("codex", "codex.exe"))
        if not executable:
            raise RuntimeError("codex_unavailable")
        command = [executable, "exec", task]
    else:
        executable = _configured_executable("EVENTO_CLAUDE_EXECUTABLE", ("claude", "claude.exe"))
        if not executable:
            raise RuntimeError("claude_unavailable")
        command = [
            executable,
            "-p",
            task,
            "--permission-mode",
            "plan",
            "--output-format",
            "text",
            "--max-turns",
            "3",
        ]

    completed = subprocess.run(
        command,
        cwd=project,
        capture_output=True,
        text=True,
        timeout=300,
        check=False,
    )
    output = ((completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")).strip()
    if completed.returncode != 0:
        raise RuntimeError(output[-12000:] or "agent_plan_failed")
    return {
        "provider": provider,
        "project_id": project_id,
        "mode": "read-only-plan",
        "output": output[-20000:],
        "exit_code": completed.returncode,
    }

def run_diagnostic(action_id: str) -> dict[str, Any]:
    registry = load_local_actions()
    action = next((item for item in registry["actions"] if item["id"] == action_id), None)
    if action is None:
        raise KeyError(action_id)
    command = action["command"]
    executable = shutil.which(command[0])
    if executable is None:
        return {"action": action_id, "available": False, "exit_code": None, "output": ""}
    completed = subprocess.run([executable, *command[1:]], cwd=REPO_ROOT, capture_output=True, text=True, timeout=8, check=False)
    output = (completed.stdout or completed.stderr).strip()
    return {"action": action_id, "available": True, "exit_code": completed.returncode, "output": output[:4000]}


def workspace_write_text(relative_path: str, content: str) -> dict[str, Any]:
    target = safe_workspace_path(relative_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    encoded = content.encode("utf-8")
    if len(encoded) > 1_000_000:
        raise ValueError("content_too_large")
    target.write_bytes(encoded)
    return {"action": "workspace-write-text", "path": str(target.relative_to(workspace_roots()[0])), "bytes": len(encoded)}


def git_create_worktree(repository: str, branch: str, base_ref: str, destination: str) -> dict[str, Any]:
    repo = Path(repository).expanduser().resolve()
    if not repo.is_dir() or not (repo / ".git").exists():
        raise ValueError("repository_not_git")
    if not _inside(repo, workspace_roots()) and repo != REPO_ROOT.resolve():
        raise PermissionError("repository_not_allowlisted")
    if not branch.startswith("evento/"):
        raise PermissionError("branch_prefix_required")
    destination_path = safe_workspace_path(destination)
    destination_path.parent.mkdir(parents=True, exist_ok=True)
    if destination_path.exists():
        raise FileExistsError("destination_exists")
    completed = subprocess.run(
        ["git", "-C", str(repo), "worktree", "add", "-b", branch, str(destination_path), base_ref],
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError((completed.stderr or completed.stdout).strip()[:2000])
    return {"action": "git-create-worktree", "branch": branch, "destination": str(destination_path), "base_ref": base_ref}


def python_run_approved(script: str, args: list[str]) -> dict[str, Any]:
    script_path = approved_script_path(script)
    safe_args = [str(x) for x in args][:32]
    completed = subprocess.run(
        [os.environ.get("PYTHON", "python"), str(script_path), *safe_args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )
    output = ((completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")).strip()
    return {"action": "python-run-approved", "script": str(script_path.relative_to(REPO_ROOT)), "exit_code": completed.returncode, "output": output[:12000]}




def _git_capture(cwd: Path, args: list[str], timeout: int = 30) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(cwd), *args],
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )


def agent_build_worktree(project_id: str, issue_number: int, objective: str, provider: str) -> dict[str, Any]:
    if provider != "codex":
        raise PermissionError("remote_write_provider_not_enabled")
    if issue_number <= 0:
        raise ValueError("issue_number_invalid")
    clean_objective = objective.strip()
    if not clean_objective or len(clean_objective) > 4000:
        raise ValueError("agent_objective_invalid")

    repo = registered_project_path(project_id)
    probe = _git_capture(repo, ["rev-parse", "--show-toplevel"])
    if probe.returncode != 0:
        raise ValueError("repository_not_git")

    base = _git_capture(repo, ["rev-parse", "HEAD"])
    if base.returncode != 0:
        raise RuntimeError("base_sha_unavailable")
    base_sha = base.stdout.strip()

    branch = f"evento/remote-task-{issue_number}"
    destination = safe_workspace_path(f"{project_id}/remote-tasks/{issue_number}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise FileExistsError("remote_task_worktree_exists")

    created = subprocess.run(
        ["git", "-C", str(repo), "worktree", "add", "-b", branch, str(destination), base_sha],
        capture_output=True,
        text=True,
        timeout=45,
        check=False,
    )
    if created.returncode != 0:
        raise RuntimeError((created.stderr or created.stdout).strip()[:4000])

    executable = _configured_executable("EVENTO_CODEX_EXECUTABLE", ("codex", "codex.exe"))
    if not executable:
        raise RuntimeError("codex_unavailable")

    task = (
        "EVENTO APPROVED BUILD TASK. You may edit files only inside the current isolated worktree. "
        "Do not push, merge, deploy, release, modify credentials, access secrets, or change files outside "
        "this worktree. Do not run destructive Git commands. Implement the smallest correct change for: "
        + clean_objective
        + "\nWhen finished, summarize changed files and validation you performed."
    )
    completed = subprocess.run(
        [
            executable,
            "exec",
            "--sandbox",
            "workspace-write",
            "--ask-for-approval",
            "never",
            task,
        ],
        cwd=destination,
        capture_output=True,
        text=True,
        timeout=1800,
        check=False,
    )
    agent_output = ((completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")).strip()

    diff_check = _git_capture(destination, ["diff", "--check"], timeout=60)
    status = _git_capture(destination, ["status", "--short"], timeout=60)
    diff_stat = _git_capture(destination, ["diff", "--stat"], timeout=60)
    changed = _git_capture(destination, ["diff", "--name-only"], timeout=60)
    changed_files = [line.strip() for line in changed.stdout.splitlines() if line.strip()]

    evidence_dir = safe_workspace_path(f"{project_id}/evidence/remote-task-{issue_number}")
    evidence_dir.mkdir(parents=True, exist_ok=True)
    evidence_path = evidence_dir / "evidence.json"
    evidence = {
        "evento_evidence_version": 1,
        "issue_number": issue_number,
        "project_id": project_id,
        "provider": provider,
        "mode": "approved-build-worktree",
        "base_sha": base_sha,
        "branch": branch,
        "agent_exit_code": completed.returncode,
        "diff_check_exit_code": diff_check.returncode,
        "changed_files": changed_files,
        "status": status.stdout.strip(),
        "diff_stat": diff_stat.stdout.strip(),
        "release": False,
        "push": False,
        "merge": False,
        "deploy": False,
    }
    evidence_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")

    if completed.returncode != 0:
        raise RuntimeError(agent_output[-12000:] or "agent_build_failed")
    if diff_check.returncode != 0:
        raise RuntimeError((diff_check.stdout + diff_check.stderr)[-12000:] or "git_diff_check_failed")

    return {
        "action": "agent-build-worktree",
        "issue_number": issue_number,
        "project_id": project_id,
        "provider": provider,
        "branch": branch,
        "base_sha": base_sha,
        "changed_files": changed_files,
        "diff_stat": diff_stat.stdout.strip(),
        "status": status.stdout.strip(),
        "evidence": str(evidence_path),
        "agent_summary": agent_output[-12000:],
        "release": False,
        "push": False,
        "merge": False,
        "deploy": False,
    }



def remote_task_worktree(project_id: str, issue_number: int) -> Path:
    if issue_number <= 0:
        raise ValueError("issue_number_invalid")
    path = safe_workspace_path(f"{project_id}/remote-tasks/{issue_number}")
    if not path.is_dir():
        raise ValueError("remote_task_worktree_missing")
    probe = _git_capture(path, ["rev-parse", "--show-toplevel"])
    if probe.returncode != 0:
        raise ValueError("remote_task_worktree_not_git")
    return path


def remote_task_review(project_id: str, issue_number: int, objective: str) -> dict[str, Any]:
    worktree = remote_task_worktree(project_id, issue_number)
    executable = _configured_executable("EVENTO_CLAUDE_EXECUTABLE", ("claude", "claude.exe"))
    if not executable:
        raise RuntimeError("claude_unavailable")
    clean_objective = objective.strip()
    if not clean_objective or len(clean_objective) > 4000:
        raise ValueError("review_objective_invalid")

    prompt = (
        "EVENTO INDEPENDENT REVIEW. Read-only review only: do not edit files, commit, push, deploy, "
        "change credentials, or perform release actions. Review the current git diff against the task objective. "
        "First line MUST be exactly EVENTO_REVIEW=PASS if there are no blocking correctness/security/regression issues, "
        "otherwise EVENTO_REVIEW=FAIL. Then list findings with file/line references where possible. Objective: "
        + clean_objective
    )
    completed = subprocess.run(
        [
            executable,
            "-p",
            prompt,
            "--permission-mode",
            "plan",
            "--output-format",
            "text",
            "--max-turns",
            "4",
        ],
        cwd=worktree,
        capture_output=True,
        text=True,
        timeout=600,
        check=False,
    )
    output = ((completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")).strip()
    if completed.returncode != 0:
        raise RuntimeError(output[-12000:] or "claude_review_failed")

    verdict = "pass" if output.startswith("EVENTO_REVIEW=PASS") else "fail"
    evidence_dir = safe_workspace_path(f"{project_id}/evidence/remote-task-{issue_number}")
    evidence_dir.mkdir(parents=True, exist_ok=True)
    review_path = evidence_dir / "claude-review.txt"
    review_path.write_text(output, encoding="utf-8")
    return {
        "action": "remote-task-review",
        "project_id": project_id,
        "issue_number": issue_number,
        "provider": "claude-code",
        "verdict": verdict,
        "output": output[-20000:],
        "evidence": str(review_path),
        "release": False,
    }


def remote_task_test_gate(project_id: str, issue_number: int) -> dict[str, Any]:
    worktree = remote_task_worktree(project_id, issue_number)
    registry = load_project_test_gates()
    commands = registry.get("projects", {}).get(project_id)
    if not isinstance(commands, list) or not commands:
        raise PermissionError("project_test_gate_not_registered")

    evidence_dir = safe_workspace_path(f"{project_id}/evidence/remote-task-{issue_number}")
    evidence_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, Any]] = []
    all_passed = True

    for raw in commands:
        if not isinstance(raw, list) or not raw or not all(isinstance(x, str) for x in raw):
            raise ValueError("invalid_project_gate_command")
        executable = shutil.which(raw[0])
        if executable is None:
            results.append({
                "command": raw,
                "exit_code": None,
                "passed": False,
                "output": f"executable_not_found:{raw[0]}",
            })
            all_passed = False
            break
        completed = subprocess.run(
            [executable, *raw[1:]],
            cwd=worktree,
            capture_output=True,
            text=True,
            timeout=900,
            check=False,
        )
        output = ((completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")).strip()
        passed = completed.returncode == 0
        results.append({
            "command": raw,
            "exit_code": completed.returncode,
            "passed": passed,
            "output": output[-12000:],
        })
        if not passed:
            all_passed = False
            break

    payload = {
        "evento_gate_version": 1,
        "project_id": project_id,
        "issue_number": issue_number,
        "passed": all_passed,
        "results": results,
        "release": False,
    }
    gate_path = evidence_dir / "project-gate.json"
    gate_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return {**payload, "evidence": str(gate_path)}


def remote_task_ready_for_handoff(project_id: str, issue_number: int) -> dict[str, Any]:
    evidence_dir = safe_workspace_path(f"{project_id}/evidence/remote-task-{issue_number}")
    review_path = evidence_dir / "claude-review.txt"
    gate_path = evidence_dir / "project-gate.json"
    if not review_path.is_file() or not gate_path.is_file():
        return {"ready": False, "reason": "review_or_gate_missing"}

    review_text = review_path.read_text(encoding="utf-8", errors="replace")
    gate = json.loads(gate_path.read_text(encoding="utf-8"))
    if not review_text.startswith("EVENTO_REVIEW=PASS"):
        return {"ready": False, "reason": "independent_review_failed"}
    if gate.get("passed") is not True:
        return {"ready": False, "reason": "project_gate_failed"}

    worktree = remote_task_worktree(project_id, issue_number)
    diff_check = _git_capture(worktree, ["diff", "--check"], timeout=60)
    if diff_check.returncode != 0:
        return {"ready": False, "reason": "git_diff_check_failed"}
    status = _git_capture(worktree, ["status", "--short"], timeout=60)
    if not status.stdout.strip():
        return {"ready": False, "reason": "no_changes"}

    return {
        "ready": True,
        "reason": "review_and_gate_passed",
        "status": status.stdout.strip(),
        "release": False,
        "merge": False,
        "deploy": False,
    }



def remote_task_publish_branch(project_id: str, issue_number: int) -> dict[str, Any]:
    readiness = remote_task_ready_for_handoff(project_id, issue_number)
    if readiness.get("ready") is not True:
        raise PermissionError(str(readiness.get("reason", "handoff_not_ready")))

    worktree = remote_task_worktree(project_id, issue_number)
    branch_result = _git_capture(worktree, ["branch", "--show-current"], timeout=30)
    branch = branch_result.stdout.strip()
    if not branch.startswith("evento/remote-task-"):
        raise PermissionError("unexpected_remote_task_branch")

    add = _git_capture(worktree, ["add", "--all"], timeout=60)
    if add.returncode != 0:
        raise RuntimeError((add.stdout + add.stderr)[-8000:] or "git_add_failed")

    commit = subprocess.run(
        [
            "git",
            "-C",
            str(worktree),
            "-c",
            "user.name=EVENTO",
            "-c",
            "user.email=evento@local.invalid",
            "commit",
            "-m",
            f"feat(evento): remote task #{issue_number}",
        ],
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    if commit.returncode != 0:
        text = ((commit.stdout or "") + ("\n" + commit.stderr if commit.stderr else "")).strip()
        raise RuntimeError(text[-8000:] or "git_commit_failed")

    head = _git_capture(worktree, ["rev-parse", "HEAD"], timeout=30)
    if head.returncode != 0:
        raise RuntimeError("commit_sha_unavailable")

    push = subprocess.run(
        ["git", "-C", str(worktree), "push", "--set-upstream", "origin", branch],
        capture_output=True,
        text=True,
        timeout=300,
        check=False,
    )
    push_output = ((push.stdout or "") + ("\n" + push.stderr if push.stderr else "")).strip()
    if push.returncode != 0:
        raise RuntimeError(push_output[-12000:] or "git_push_failed")

    return {
        "action": "remote-task-publish-branch",
        "project_id": project_id,
        "issue_number": issue_number,
        "branch": branch,
        "commit_sha": head.stdout.strip(),
        "push_output": push_output[-4000:],
        "merge": False,
        "deploy": False,
        "release": False,
    }

def run_write_action(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    allowed = {item["id"] for item in load_local_write_actions()["actions"]}
    if action_id not in allowed:
        raise KeyError(action_id)
    if action_id == "workspace-write-text":
        return workspace_write_text(str(payload.get("relative_path", "")), str(payload.get("content", "")))
    if action_id == "git-create-worktree":
        return git_create_worktree(
            str(payload.get("repository", "")),
            str(payload.get("branch", "")),
            str(payload.get("base_ref", "HEAD")),
            str(payload.get("destination", "")),
        )
    if action_id == "python-run-approved":
        args = payload.get("args", [])
        if not isinstance(args, list):
            raise ValueError("args_must_be_array")
        return python_run_approved(str(payload.get("script", "")), args)
    if action_id == "project-create-worktree":
        return project_create_worktree(str(payload.get("project_id", "")), str(payload.get("branch", "")), str(payload.get("base_ref", "HEAD")))
    if action_id == "project-open-folder":
        return project_open_folder(str(payload.get("project_id", "")))
    if action_id == "blender-open-project":
        return blender_open_project(str(payload.get("project_id", "")), str(payload.get("blend_file", "")))
    if action_id == "unity-open-project":
        return unity_open_project(str(payload.get("project_id", "")), str(payload.get("unity_project", ".")))
    if action_id == "android-install-apk":
        return android_install_apk(str(payload.get("project_id", "")), str(payload.get("apk_path", "")))
    if action_id == "unity-run-editmode-tests":
        return unity_run_editmode_tests(str(payload.get("project_id", "")), str(payload.get("unity_project", ".")))
    if action_id == "blender-export-glb":
        return blender_export_glb(str(payload.get("project_id", "")), str(payload.get("blend_file", "")))
    if action_id == "agent-build-worktree":
        return agent_build_worktree(
            str(payload.get("project_id", "")),
            int(payload.get("issue_number", 0)),
            str(payload.get("objective", "")),
            str(payload.get("provider", "codex")),
        )
    if action_id == "remote-task-review":
        return remote_task_review(
            str(payload.get("project_id", "")),
            int(payload.get("issue_number", 0)),
            str(payload.get("objective", "")),
        )
    if action_id == "remote-task-test-gate":
        return remote_task_test_gate(
            str(payload.get("project_id", "")),
            int(payload.get("issue_number", 0)),
        )
    if action_id == "remote-task-ready-for-handoff":
        return remote_task_ready_for_handoff(
            str(payload.get("project_id", "")),
            int(payload.get("issue_number", 0)),
        )
    if action_id == "remote-task-publish-branch":
        return remote_task_publish_branch(
            str(payload.get("project_id", "")),
            int(payload.get("issue_number", 0)),
        )
    raise KeyError(action_id)


def capabilities() -> dict[str, Any]:
    registry = load_connectors()
    return {
        "daemon": {
            "version": "0.2.0",
            "host": HOST,
            "port": PORT,
            "write_execution": WRITE_ENABLED and bool(WRITE_TOKEN),
            "arbitrary_shell": False,
            "release": False,
            "workspace_roots": [str(x) for x in workspace_roots()],
        },
        "policy": registry["policy"],
        "connectors": [
            {"id": item["id"], "category": item["category"], "permissions": item["permissions"], "release": item["release"]}
            for item in registry["connectors"]
        ],
        "write_actions": [item["id"] for item in load_local_write_actions()["actions"]],
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "EVENTO-Local/0.2"

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self) -> bool:
        return bool(TOKEN) and self.headers.get("Authorization", "") == "Bearer " + TOKEN

    def _write_authorized(self) -> bool:
        return WRITE_ENABLED and bool(WRITE_TOKEN) and self.headers.get("X-EVENTO-Write-Token", "") == WRITE_TOKEN

    def _read_payload(self) -> dict[str, Any]:
        length = min(int(self.headers.get("Content-Length", "0")), 1_100_000)
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self) -> None:
        if self.path == "/health":
            self._json(200, {"status": "ok", "service": "evento-local-daemon", "version": "0.2.0"})
            return
        if not self._authorized():
            self._json(401, {"error": "unauthorized"})
            return
        if self.path == "/v1/capabilities":
            self._json(200, capabilities())
            return
        if self.path == "/v1/diagnostics":
            actions = load_local_actions()["actions"]
            self._json(200, {"results": [run_diagnostic(item["id"]) for item in actions]})
            return
        if self.path == "/v1/workspaces":
            self._json(200, project_workspace_snapshot())
            return
        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        if not self._authorized():
            self._json(401, {"error": "unauthorized"})
            return
        try:
            payload = self._read_payload()
            if self.path == "/v1/diagnostics/run":
                self._json(200, run_diagnostic(str(payload.get("action", ""))))
                return
            if self.path == "/v1/agent/plan":
                self._json(
                    200,
                    agent_plan(
                        str(payload.get("provider", "")),
                        str(payload.get("project_id", "")),
                        str(payload.get("prompt", "")),
                    ),
                )
                return
            if self.path == "/v1/actions/run":
                if not self._write_authorized():
                    self._json(403, {"error": "write_not_authorized"})
                    return
                action_id = str(payload.get("action", ""))
                confirmation = str(payload.get("confirmation", ""))
                if confirmation != action_id:
                    self._json(400, {"error": "confirmation_mismatch"})
                    return
                self._json(200, run_write_action(action_id, payload))
                return
            self._json(405, {"error": "write_execution_disabled"})
        except (KeyError, PermissionError) as error:
            self._json(403, {"error": str(error)})
        except (ValueError, FileExistsError) as error:
            self._json(400, {"error": str(error)})
        except Exception:
            self._json(500, {"error": "execution_failed"})

    def log_message(self, format: str, *args: object) -> None:
        print("%s - %s" % (self.address_string(), format % args))


def main() -> int:
    if not TOKEN:
        raise SystemExit("EVENTO_DAEMON_TOKEN is required")
    if WRITE_ENABLED and not WRITE_TOKEN:
        raise SystemExit("EVENTO_DAEMON_WRITE_TOKEN is required when writes are enabled")
    workspace_roots()[0].mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("EVENTO local daemon listening on http://%s:%s" % (HOST, PORT))
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
