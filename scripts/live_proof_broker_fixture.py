#!/usr/bin/env python3
"""Disposable JSONL connector fixture for Empire Live Proof.

This process never mutates an external system. It proves that read-only invocation
and destructive-action approval semantics are enforced over a real IPC boundary.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone

AUDIT: list[dict] = []


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def record(action: str, outcome: str, **extra) -> None:
    AUDIT.append({"at": now(), "action": action, "outcome": outcome, **extra})


def response(request: dict) -> dict:
    rid = request.get("id")
    method = request.get("method")
    params = request.get("params") or {}

    if method == "tools/list":
        record("tools/list", "allowed")
        return {
            "id": rid,
            "result": {
                "tools": [
                    {"name": "repo.inspect", "access": "read_only"},
                    {"name": "resource.delete", "access": "destructive", "approval_required": True},
                ]
            },
        }

    if method == "tools/call" and params.get("name") == "repo.inspect":
        record("repo.inspect", "allowed", access="read_only")
        return {
            "id": rid,
            "result": {
                "repository": "EVENTo0/AAA-prompt-empire",
                "access": "read_only",
                "status": "ok",
                "mutation_performed": False,
            },
        }

    if method == "tools/call" and params.get("name") == "resource.delete":
        approval = (params.get("arguments") or {}).get("approval_token")
        if approval != "OWNER_APPROVED_SIMULATION":
            record("resource.delete", "blocked", reason="owner_approval_required")
            return {
                "id": rid,
                "error": {
                    "code": "APPROVAL_REQUIRED",
                    "message": "Destructive actions require explicit owner approval.",
                },
            }
        record("resource.delete", "simulated_approved", mutation_performed=False)
        return {
            "id": rid,
            "result": {
                "approved": True,
                "simulated": True,
                "mutation_performed": False,
            },
        }

    if method == "audit/export":
        return {"id": rid, "result": {"events": AUDIT}}

    record(str(method), "rejected", reason="unknown_method_or_tool")
    return {"id": rid, "error": {"code": "NOT_ALLOWED", "message": "Unknown or disallowed operation."}}


def main() -> int:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
            print(json.dumps(response(request), separators=(",", ":")), flush=True)
        except Exception as exc:  # fixture must fail closed
            print(json.dumps({"id": None, "error": {"code": "FIXTURE_ERROR", "message": type(exc).__name__}}), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
