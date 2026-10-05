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
    "apps/mobile-control-plane/data/evento-agent-capabilities.json",
    "apps/mobile-control-plane/data/evento-modernization-pilots.json",
    "tools/memory/build_context.py",
    "supabase/migrations/20261001190000_evento_memory_v1.sql",
    "registry/evento-release-contracts.json",
    "registry/evento-release-evidence.json",
    "docs/release/EVENTO_RELEASE_EVIDENCE_V1.md",
    "registry/evento-release-channels.json",
    "docs/architecture/EVENTO_RELEASE_CHANNEL_V1.md",
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

def validate_control_plane_mirrors(errors: list[str]) -> None:
    pairs = (
        ("registry/evento-agent-capabilities.json", "apps/mobile-control-plane/data/evento-agent-capabilities.json"),
        ("registry/evento-modernization-pilots.json", "apps/mobile-control-plane/data/evento-modernization-pilots.json"),
    )
    for source, mirror in pairs:
        if load(source) != load(mirror):
            fail(errors, f"control-plane mirror drift: {mirror} must match {source}")

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

def validate_release_evidence(errors: list[str]) -> None:
    contracts = load("registry/evento-release-contracts.json")
    evidence = load("registry/evento-release-evidence.json")

    policy = contracts.get("policy", {})
    if policy.get("default") != "deny":
        fail(errors, "release contracts must remain default-deny")
    if policy.get("release") is not False:
        fail(errors, "global release policy must remain disabled in this gate")
    if policy.get("require_signed_artifacts") is not True:
        fail(errors, "release policy must require signed artifacts")

    for name, contract in contracts.get("contracts", {}).items():
        if contract.get("release_enabled") is not False:
            fail(errors, f"release contract {name} unexpectedly enabled")

    for project_id, project in contracts.get("projects", {}).items():
        if project.get("release_enabled") is not False:
            fail(errors, f"{project_id}: release must remain disabled")
        if project.get("signing_evidence") is not False:
            fail(errors, f"{project_id}: signing evidence cannot be true without a signed release lane")
        if "signed_artifact_evidence" in project and project.get("signed_artifact_evidence") is not False:
            fail(errors, f"{project_id}: signed artifact evidence cannot be true for development artifacts")

    if evidence.get("classification") != "development-evidence":
        fail(errors, "release evidence must remain classified as development-evidence")
    if evidence.get("release_authority") is not False:
        fail(errors, "development evidence must not grant release authority")

    artifacts = evidence.get("artifacts", [])
    if len(artifacts) < 2:
        fail(errors, "release evidence must record baseline Windows and Android development artifacts")

    platforms = set()
    for artifact in artifacts:
        platforms.add(artifact.get("platform"))
        digest = artifact.get("sha256", "")
        if len(digest) != 64 or any(ch not in "0123456789abcdef" for ch in digest):
            fail(errors, f"{artifact.get('id')}: invalid sha256")
        if artifact.get("signed") is not False:
            fail(errors, f"{artifact.get('id')}: development artifact must not be marked signed")
        if artifact.get("release_evidence") is not False:
            fail(errors, f"{artifact.get('id')}: development artifact must not count as release evidence")
        if artifact.get("platform") == "android" and artifact.get("build_variant") != "debug":
            fail(errors, f"{artifact.get('id')}: current Android evidence must remain debug-only")

    if not {"windows", "android"} <= platforms:
        fail(errors, "release evidence must include Windows and Android development artifacts")


def validate_release_channels(errors: list[str]) -> None:
    channels = load("registry/evento-release-channels.json")
    policy = channels.get("policy", {})

    if policy.get("default") != "deny":
        fail(errors, "release-channel policy must remain default-deny")
    if policy.get("external_release") is not False:
        fail(errors, "external release must remain disabled before final approval")
    if policy.get("handoff_only") is not True:
        fail(errors, "release-channel stage must be handoff-only")

    required_types = {"web-production", "android-store", "desktop-installer"}
    channel_types = channels.get("channel_types", {})
    if set(channel_types) != required_types:
        fail(errors, "release channel type set drifted")

    for name, channel in channel_types.items():
        if channel.get("enabled") is not False:
            fail(errors, f"{name}: channel type must remain disabled")
        if channel.get("execution_enabled") is not False:
            fail(errors, f"{name}: external execution must remain disabled")
        if channel.get("handoff_only") is not True:
            fail(errors, f"{name}: channel must remain handoff-only")
        fields = set(channel.get("required_binding_fields", []))
        if not {"channel_id", "binding_verified"} <= fields:
            fail(errors, f"{name}: missing binding readiness requirements")

    android = channel_types["android-store"]
    if not {"signed_apk", "signed_aab", "signature_verification"} <= set(android.get("required_evidence", [])):
        fail(errors, "android channel must require signed APK/AAB verification evidence")
    if set(android.get("signing_secrets", [])) != {
        "EVENTO_ANDROID_KEYSTORE_B64",
        "EVENTO_ANDROID_KEYSTORE_PASSWORD",
        "EVENTO_ANDROID_KEY_ALIAS",
        "EVENTO_ANDROID_KEY_PASSWORD",
    }:
        fail(errors, "android signing secret contract drifted")

    desktop = channel_types["desktop-installer"]
    if not {"signed_msi", "signed_nsis", "signature_verification"} <= set(desktop.get("required_evidence", [])):
        fail(errors, "desktop channel must require signed MSI/NSIS verification evidence")
    if set(desktop.get("signing_secrets", [])) != {
        "EVENTO_WINDOWS_PFX_B64",
        "EVENTO_WINDOWS_PFX_PASSWORD",
    }:
        fail(errors, "desktop signing secret contract drifted")

    projects = channels.get("projects", {})
    for project_id, project in projects.items():
        if project.get("enabled") is not False:
            fail(errors, f"{project_id}: project release channel must remain disabled")
        if project.get("binding_verified") is not False:
            fail(errors, f"{project_id}: binding cannot be verified without external evidence")
        channel_id = project.get("channel_id")
        descriptor = project.get("binding_descriptor", {})
        if channel_id is not None and not isinstance(channel_id, str):
            fail(errors, f"{project_id}: channel_id must be null or a string")
        if channel_id and not descriptor:
            fail(errors, f"{project_id}: configured channel_id requires a binding descriptor")

    known = {
        "evento-one": "prj_15JeGkRMsh6pvc2OAE902mkAB3Z6",
        "evento-admin-android": "ae.evento.admin",
        "aaa-empire": "EVENTo0/AAA-prompt-empire",
    }
    for project_id, expected_channel_id in known.items():
        if projects.get(project_id, {}).get("channel_id") != expected_channel_id:
            fail(errors, f"{project_id}: known release channel identifier drifted")

    android_gradle = (ROOT / "apps/evento-admin-android/app/build.gradle").read_text(encoding="utf-8")
    for secret in android.get("signing_secrets", []):
        if secret not in android_gradle and secret != "EVENTO_ANDROID_KEYSTORE_B64":
            fail(errors, f"android build does not consume signing input {secret}")

    android_workflow = (ROOT / ".github/workflows/evento-admin-android.yml").read_text(encoding="utf-8")
    for marker_text in (
        "signed_release_candidate",
        ":app:assembleRelease",
        ":app:bundleRelease",
        "apksigner",
        "jarsigner -verify",
        "evento-admin-android-signed-release-candidate",
    ):
        if marker_text not in android_workflow:
            fail(errors, f"android release-candidate lane missing marker: {marker_text}")

    desktop_workflow = (ROOT / ".github/workflows/evento-desktop-shell.yml").read_text(encoding="utf-8")
    for marker_text in (
        "signed_release_candidate",
        "signtool",
        "verify /pa",
        "evento-desktop-windows-signed-release-candidate",
    ):
        if marker_text not in desktop_workflow:
            fail(errors, f"desktop release-candidate lane missing marker: {marker_text}")

    forbidden_publish_markers = (
        "play.google.com",
        "googleapis.com/androidpublisher",
        "gh release create",
        "vercel --prod",
    )
    combined = android_workflow.lower() + "\n" + desktop_workflow.lower()
    for publish_marker in forbidden_publish_markers:
        if publish_marker in combined:
            fail(errors, f"release-candidate workflow contains external publish marker: {publish_marker}")


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
        validate_control_plane_mirrors(errors)
        validate_pilots(errors)
        validate_context_builder(errors)
        validate_release_evidence(errors)
        validate_release_channels(errors)
        validate_sql_guardrails(errors)

    if errors:
        print("EVENTO CONTROL PLANE GATE 1: FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("EVENTO CONTROL PLANE GATE 1: PASSED")
    print("Validated schemas, provider-neutral agent registry, pilot chain, release evidence boundaries, authoritative memory retrieval, and Supabase RLS guardrails.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
