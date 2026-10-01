#!/usr/bin/env python3
"""EVENTO local control daemon foundation.

Read-only v1:
- binds to localhost only
- exposes health and connector capability metadata
- never returns secret values
- does not execute arbitrary shell commands
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
REPO_ROOT = Path(__file__).resolve().parents[3]
CONNECTOR_REGISTRY = REPO_ROOT / "registry" / "evento-connectors.json"
LOCAL_ACTIONS = REPO_ROOT / "registry" / "evento-local-actions.json"


def load_connectors() -> dict[str, Any]:
    with CONNECTOR_REGISTRY.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_local_actions() -> dict[str, Any]:
    with LOCAL_ACTIONS.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def run_diagnostic(action_id: str) -> dict[str, Any]:
    registry = load_local_actions()
    action = next((item for item in registry["actions"] if item["id"] == action_id), None)
    if action is None:
        raise KeyError(action_id)
    command = action["command"]
    executable = shutil.which(command[0])
    if executable is None:
        return {"action": action_id, "available": False, "exit_code": None, "output": ""}
    completed = subprocess.run(
        [executable, *command[1:]],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=8,
        check=False,
    )
    output = (completed.stdout or completed.stderr).strip()
    return {
        "action": action_id,
        "available": True,
        "exit_code": completed.returncode,
        "output": output[:4000],
    }


def capabilities() -> dict[str, Any]:
    registry = load_connectors()
    return {
        "daemon": {
            "version": "0.1.0",
            "host": HOST,
            "port": PORT,
            "write_execution": False,
            "arbitrary_shell": False,
        },
        "policy": registry["policy"],
        "connectors": [
            {
                "id": item["id"],
                "category": item["category"],
                "permissions": item["permissions"],
                "release": item["release"],
            }
            for item in registry["connectors"]
        ],
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "EVENTO-Local/0.1"

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self) -> bool:
        if not TOKEN:
            return False
        supplied = self.headers.get("Authorization", "")
        return supplied == "Bearer " + TOKEN

    def do_GET(self) -> None:
        if self.path == "/health":
            self._json(200, {"status": "ok", "service": "evento-local-daemon", "version": "0.1.0"})
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

        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        # v1 remains mutation-free. POST only invokes an explicit diagnostic
        # action from the committed allowlist; arbitrary shell is never accepted.
        if not self._authorized():
            self._json(401, {"error": "unauthorized"})
            return
        if self.path != "/v1/diagnostics/run":
            self._json(405, {"error": "write_execution_disabled"})
            return
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 4096)
            payload = json.loads(self.rfile.read(length) or b"{}")
            action_id = str(payload.get("action", ""))
            self._json(200, run_diagnostic(action_id))
        except KeyError:
            self._json(403, {"error": "action_not_allowlisted"})
        except Exception:
            self._json(400, {"error": "invalid_request"})

    def log_message(self, format: str, *args: object) -> None:
        # Avoid leaking Authorization headers or request content into logs.
        print("%s - %s" % (self.address_string(), format % args))


def main() -> int:
    if not TOKEN:
        raise SystemExit("EVENTO_DAEMON_TOKEN is required")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("EVENTO local daemon listening on http://%s:%s" % (HOST, PORT))
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
