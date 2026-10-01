#!/usr/bin/env python3
"""Deterministic Gate 1 checks for EVENTO Memory + Agent Contract + One-Click control plane."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "docs/architecture/EVENTO_MEMORY_V1.md",
    "docs/architecture/EVENTO_AGENT_CONTRACT_V1.md",
    "docs/architecture/EVENTO_ONE_CLICK_CONTROL_PLANE_V1.md",
    "docs/portfolio/EVENTO_MODERNIZATION_ROLLOUT_V1.md",
    "memory/memory.schema.json",
    "memory/context-pack.schema.json",
    "schemas/evento-task.schema.json",
    "schemas/evento-evidence-pack.schema.json",
    "registry/evento-agent-capabilities.json",
    "registry/evento-modernization-pilots.json",
    "tools/memory/build_context.py",
    "supabase/migrations/20261001190000_evento_memory_v1.sql",
]

MEMORY_TYPES = {"fact","decision","lesson","pattern","anti_pattern","rule","source_claim","asset_knowledge"}
MEMORY_STATES = {"observed","proposed","supported","verified","active","deprecated","superseded"}
MEMORY_SCOPES = {"task","project","domain","evento_shared"}
TASK_MODES = {"plan","build","verify","preview","release","learn"}
TASK_RISKS = {"low","medium","high","critical"}
TASK_STATUSES = {"queued","planning","active","blocked","verifying","preview","awaiting_approval","done","cancelled"}

def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))

def fail(errors: list[str], message: str) -> None:
    errors.append(message)

def enum_values(schema: dict, prop: str) -> set[str]:
    return set(schema["properties"][prop]["enum"])

def validate_schema_contracts(errors: list[str]) -> None:
    memory = load("memory/memory.schema.json")
    if enum_values(memory, "memory_type") != MEMORY_TYPES:
        fail(errors, "memory schema memory_type enum drift")
    if enum_values(memory, "validation_state") != MEMORY_STATES:
        fail(errors, "memory schema validation_state enum drift")
    if enum_values(memory, "scope") != MEMORY_SCOPES:
        fail(errors, "memory schema scope enum drift")
    for req in ("id","title","memory_type","domain","summary","validation_state","scope"):
        if req not in memory.get("required", []):
            fail(errors, f"memory schema missing required field {req}")

    context = load("memory/context-pack.schema.json")
    for req in ("task","facts","decisions","rules","lessons","anti_patterns"):
        if req not in context.get("required", []):
            fail(errors, f"context pack schema missing required field {req}")

    task = load("schemas/evento-task.schema.json")
    if enum_values(task, "mode") != TASK_MODES:
        fail(errors, "task schema mode enum drift")
    if enum_values(task, "risk") != TASK_RISKS:
        fail(errors, "task schema risk enum drift")
    if enum_values(task, "status") != TASK_STATUSES:
        fail(errors, "task schema status enum drift")
    for req in ("task_id","project_id","objective","acceptance_criteria","risk","mode"):
        if req not in task.get("required", []):
            fail(errors, f"task schema missing required field {req}")

    evidence = load("schemas/evento-evidence-pack.schema.json")
    for req in ("task_id","project_id","status","evidence"):
        if req not in evidence.get("required", []):
            fail(errors, f"evidence schema missing required field {req}")

def validate_capabilities(errors: list[str]) -> None:
    data = load("registry/evento-agent-capabilities.json")
    policy = data.get("policy", {})
    if policy.get("provider_neutral") is not True:
        fail(errors, "agent registry must remain provider neutral")
    if policy.get("self_approval") is not False:
        fail(errors, "agent registry must prohibit self approval")
    if policy.get("unknown_route") != "fail_closed":
        fail(errors, "unknown agent routes must fail closed")
    ids: set[str] = set()
    for agent in data.get("agents", []):
        aid = agent.get("id")
        if not aid or aid in ids:
            fail(errors, f"duplicate or missing agent id: {aid!r}")
        ids.add(aid)
        modes = set(agent.get("modes", []))
        if not modes <= TASK_MODES:
            fail(errors, f"{aid}: invalid modes {sorted(modes-TASK_MODES)}")
        if agent.get("can_release") is not False:
            fail(errors, f"{aid}: generic agent must not have release authority")
    expected = {"codex","claude-code","antigravity","openhands","cline"}
    if not expected <= ids:
        fail(errors, f"agent registry missing baseline adapters: {sorted(expected-ids)}")

def validate_pilots(errors: list[str]) -> None:
    data = load("registry/evento-modernization-pilots.json")
    policy = data.get("policy", {})
    if policy.get("max_active") != 3 or policy.get("max_supporting") != 5:
        fail(errors, "portfolio focus limits must remain 3 Active / 5 Supporting")
    repos = [p.get("repository") for p in data.get("pilots", [])]
    expected = [
        "EVENTo0/Evento-project-development-v1",
        "EVENTo0/Evento-One",
        "EVENTo0/evento-mobile",
    ]
    if repos != expected:
        fail(errors, "pilot authority-chain repository order drifted")
    for pilot in data.get("pilots", []):
        lanes = set(pilot.get("required_lanes", []))
        if not {"agent-contract","memory","evidence"} <= lanes:
            fail(errors, f'{pilot.get("project_id")}: missing control-plane lanes')

def write_item(root: Path, item: dict) -> None:
    root.mkdir(parents=True, exist_ok=True)
    (root / f'{item["id"]}.json').write_text(json.dumps(item), encoding="utf-8")

def validate_context_builder(errors: list[str]) -> None:
    with tempfile.TemporaryDirectory() as td:
        base = Path(td)
        mem = base / "items"
        common = {
            "title": "x", "memory_type": "rule", "summary": "x",
            "scope": "domain", "confidence": 1, "applies_to": [],
            "evidence": [], "superseded_by": None,
            "created_at": None, "last_verified_at": None, "project_id": None,
            "rule": "x", "trigger": None
        }
        items = [
            dict(common, id="verified-unity-rule", domain="unity", validation_state="verified",
                 title="Android Unity build", summary="Unity Android API build rule"),
            dict(common, id="active-shared-rule", domain="engineering-governance", validation_state="active",
                 scope="evento_shared", title="Shared build evidence", summary="build evidence rule"),
            dict(common, id="proposed-unity-rule", domain="unity", validation_state="proposed",
                 title="Proposed Android Unity idea", summary="must not be authoritative"),
            dict(common, id="verified-blender-rule", domain="blender", validation_state="verified",
                 title="Blender humanoid GLB export", summary="humanoid GLB armature export"),
        ]
        for item in items:
            write_item(mem, item)

        out = base / "context.json"
        cmd = [
            sys.executable, str(ROOT / "tools/memory/build_context.py"),
            "Build Android Unity preview", "--memory-dir", str(mem),
            "--domain", "unity", "--out", str(out)
        ]
        proc = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
        if proc.returncode != 0:
            fail(errors, "context builder failed: " + proc.stderr.strip())
            return
        pack = json.loads(out.read_text(encoding="utf-8"))
        ids = {x["id"] for bucket in ("facts","decisions","rules","lessons","patterns","anti_patterns")
               for x in pack.get(bucket, [])}
        if "verified-unity-rule" not in ids:
            fail(errors, "context builder omitted verified domain rule")
        if "proposed-unity-rule" in ids:
            fail(errors, "context builder leaked non-authoritative proposed memory")

        out2 = base / "context2.json"
        cmd2 = [
            sys.executable, str(ROOT / "tools/memory/build_context.py"),
            "Fix Blender export for humanoid GLB", "--memory-dir", str(mem),
            "--domain", "blender", "--out", str(out2)
        ]
        proc2 = subprocess.run(cmd2, cwd=ROOT, text=True, capture_output=True)
        if proc2.returncode != 0:
            fail(errors, "context builder blender case failed: " + proc2.stderr.strip())
            return
        pack2 = json.loads(out2.read_text(encoding="utf-8"))
        rules = pack2.get("rules", [])
        if not rules or rules[0].get("id") != "verified-blender-rule":
            fail(errors, "context builder did not rank exact-domain Blender memory first")

def validate_sql_guardrails(errors: list[str]) -> None:
    sql = (ROOT / "supabase/migrations/20261001190000_evento_memory_v1.sql").read_text(encoding="utf-8").lower()
    for table in ("evento_memory_items","evento_memory_evidence"):
        if f"alter table public.{table} enable row level security" not in sql:
            fail(errors, f"{table}: RLS must be enabled")
    forbidden = ("grant all", "to anon", "to authenticated")
    for marker in forbidden:
        if marker in sql:
            fail(errors, f"memory migration contains broad client grant marker: {marker}")

def main() -> int:
    errors = [f"missing required file: {p}" for p in REQUIRED if not (ROOT / p).exists()]
    if not errors:
        validate_schema_contracts(errors)
        validate_capabilities(errors)
        validate_pilots(errors)
        validate_context_builder(errors)
        validate_sql_guardrails(errors)

    if errors:
        print("EVENTO CONTROL PLANE GATE 1: FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("EVENTO CONTROL PLANE GATE 1: PASSED")
    print("Validated schemas, provider-neutral agent registry, 3-project pilot chain, authoritative-only memory retrieval, domain ranking, and Supabase RLS guardrails.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
