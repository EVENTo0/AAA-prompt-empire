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
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

HOST = "127.0.0.1"
PORT = int(os.environ.get("EVENTO_DAEMON_PORT", "8765"))
TOKEN = os.environ.get("EVENTO_DAEMON_TOKEN", "")
REPO_ROOT = Path(__file__).resolve().parents[3]
CONNECTOR_REGISTRY = REPO_ROOT / "registry" / "evento-connectors.json"


def load_connectors() -> dict[str, Any]:
    with CONNECTOR_REGISTRY.open("r", encoding="utf-8") as handle:
        return json.load(handle)


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

        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        # v1 is deliberately read-only. Execution endpoints are added only
        # behind explicit capability contracts and regression coverage.
        if not self._authorized():
            self._json(401, {"error": "unauthorized"})
            return
        self._json(405, {"error": "write_execution_disabled"})

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
