#!/usr/bin/env python3
"""Run disposable Empire Live Proof checks with machine-readable evidence."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "live-proof"
IMAGE = "python:3.12-alpine"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False, **kwargs)


def sandbox_proof() -> dict:
    if shutil.which("docker") is None:
        raise RuntimeError("docker is required for the live sandbox proof")

    inspect = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
    if inspect.returncode != 0:
        pull = run(["docker", "pull", IMAGE])
        if pull.returncode != 0:
            raise RuntimeError(f"failed to pull disposable sandbox image: {pull.stderr.strip()}")
        inspect = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
    image_id = inspect.stdout.strip()

    code = r'''
import json, os, pathlib, socket
r = {}
r["secret_absent"] = not any(k in os.environ for k in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GITHUB_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"))
try:
    pathlib.Path("/rootfs-proof").write_text("should-fail", encoding="utf-8")
    r["rootfs_read_only"] = False
except OSError:
    r["rootfs_read_only"] = True
try:
    socket.create_connection(("1.1.1.1", 53), timeout=0.5)
    r["network_denied"] = False
except OSError:
    r["network_denied"] = True
p = pathlib.Path("/tmp/empire-live-proof.txt")
p.write_text("ok", encoding="utf-8")
r["tmpfs_write_ok"] = p.read_text(encoding="utf-8") == "ok"
status = pathlib.Path("/proc/self/status").read_text(encoding="utf-8")
cap_eff = next((line.split(":", 1)[1].strip() for line in status.splitlines() if line.startswith("CapEff:")), "")
r["capabilities_dropped"] = cap_eff == "0000000000000000"
r["fixture_env_only"] = os.environ.get("EMPIRE_FIXTURE") == "live-proof"
print(json.dumps(r, separators=(",", ":")))
'''

    cmd = [
        "docker", "run", "--rm",
        "--network", "none",
        "--read-only",
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",
        "--tmpfs", "/tmp:rw,nosuid,nodev,noexec,size=16m",
        "-e", "EMPIRE_FIXTURE=live-proof",
        IMAGE,
        "python", "-c", code,
    ]
    result = run(cmd)
    if result.returncode != 0:
        raise RuntimeError(f"sandbox command failed: {result.stderr.strip()}")
    payload = json.loads(result.stdout.strip().splitlines()[-1])
    required = ["secret_absent", "rootfs_read_only", "network_denied", "tmpfs_write_ok", "capabilities_dropped", "fixture_env_only"]
    failures = [key for key in required if payload.get(key) is not True]
    if failures:
        raise RuntimeError(f"sandbox proof failed controls: {failures}")
    return {
        "status": "PASS",
        "checked_at": utc_now(),
        "image": IMAGE,
        "image_id": image_id,
        "controls": payload,
        "teardown": "container removed with --rm",
    }


def broker_request(proc: subprocess.Popen, request: dict) -> dict:
    assert proc.stdin is not None and proc.stdout is not None
    proc.stdin.write(json.dumps(request) + "\n")
    proc.stdin.flush()
    line = proc.stdout.readline()
    if not line:
        raise RuntimeError("broker fixture terminated unexpectedly")
    return json.loads(line)


def broker_proof() -> dict:
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "scripts" / "live_proof_broker_fixture.py")],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=ROOT,
        env={"PATH": os.environ.get("PATH", "")},
    )
    try:
        listed = broker_request(proc, {"id": 1, "method": "tools/list"})
        inspected = broker_request(proc, {"id": 2, "method": "tools/call", "params": {"name": "repo.inspect", "arguments": {}}})
        blocked = broker_request(proc, {"id": 3, "method": "tools/call", "params": {"name": "resource.delete", "arguments": {}}})
        approved = broker_request(proc, {"id": 4, "method": "tools/call", "params": {"name": "resource.delete", "arguments": {"approval_token": "OWNER_APPROVED_SIMULATION"}}})
        audit = broker_request(proc, {"id": 5, "method": "audit/export"})

        tools = {t["name"]: t for t in listed.get("result", {}).get("tools", [])}
        checks = {
            "read_tool_discovered": tools.get("repo.inspect", {}).get("access") == "read_only",
            "destructive_tool_marked": tools.get("resource.delete", {}).get("approval_required") is True,
            "read_invocation_no_mutation": inspected.get("result", {}).get("mutation_performed") is False,
            "destructive_without_approval_blocked": blocked.get("error", {}).get("code") == "APPROVAL_REQUIRED",
            "approved_path_is_simulation_only": approved.get("result", {}).get("simulated") is True and approved.get("result", {}).get("mutation_performed") is False,
            "audit_evidence_present": len(audit.get("result", {}).get("events", [])) >= 4,
        }
        failures = [key for key, value in checks.items() if value is not True]
        if failures:
            raise RuntimeError(f"broker proof failed controls: {failures}")
        return {"status": "PASS", "checked_at": utc_now(), "controls": checks, "audit": audit["result"]["events"]}
    finally:
        if proc.stdin:
            proc.stdin.close()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    evidence = {
        "schema_version": 1,
        "suite": "empire-live-proof-gate",
        "checked_at": utc_now(),
        "sandbox": None,
        "connector_broker": None,
        "provider_harness_parity": {
            "status": "NOT_RUN_CREDENTIAL_GATED",
            "reason": "Codex/Claude provider calls require separately configured credentials and explicit manual workflow_dispatch.",
        },
    }
    try:
        evidence["sandbox"] = sandbox_proof()
        evidence["connector_broker"] = broker_proof()
        evidence["status"] = "PASS_PARTIAL_PROVIDER_GATED"
    except Exception as exc:
        evidence["status"] = "FAIL"
        evidence["error"] = f"{type(exc).__name__}: {exc}"
        (OUT / "live-proof-evidence.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
        print(json.dumps(evidence, indent=2))
        return 1

    (OUT / "live-proof-evidence.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    print(json.dumps(evidence, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
