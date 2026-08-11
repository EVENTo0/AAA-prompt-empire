#!/usr/bin/env python3
"""Deterministic integration checks for Empire platform-intelligence contracts."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
EVAL_GLOB = "platform-intelligence-wave-*.json"

CASE_CONTROLS: dict[str, set[str]] = {
    "supabase-self-hosted-envoy": {"platform-upgrade"},
    "wordpress-7-1-rc": {"platform-upgrade"},
    "xcode-preview-channel": {"platform-upgrade"},
    "github-agent-discovery-security": {"capability-broker"},
    "freshness-conflict": {"evidence-freshness"},
    "model-routing-dimensions": {"model-lifecycle"},
    "claude-code-security-preflight": {"platform-upgrade", "secure-agent-execution"},
    "claude-platform-lifecycle": {"model-lifecycle"},
    "hostinger-repeatable-deployment": {"platform-upgrade"},
    "n8n-s3-upgrade-preflight": {"platform-upgrade"},
    "n8n-production-source-control": {"platform-upgrade"},
    "zapier-v19-cli": {"platform-upgrade"},
    "zapier-mcp-least-privilege": {"capability-broker"},
    "stripe-api-upgrade": {"platform-upgrade"},
    "tap-payment-proof": {"platform-upgrade"},
    "vercel-promotion-gate": {"platform-upgrade"},
    "supply-chain-provenance": {"supply-chain"},
    "codex-deprecated-model-pin": {"model-lifecycle"},
    "model-routing-runtime-fallback": {"model-lifecycle"},
    "secure-agent-untrusted-code": {"secure-agent-execution"},
    "harness-parity-codex-claude": {"agent-harness"},
    "mcp-capability-broker-write": {"capability-broker"},
    "runtime-evidence-expiry": {"evidence-freshness"},
}

CONTROL_IMPLEMENTATIONS = {
    "platform-upgrade": ("skill", "automation-platform-upgrade-audit"),
    "evidence-freshness": ("skill", "evidence-freshness-gate"),
    "supply-chain": ("skill", "supply-chain-provenance"),
    "model-lifecycle": ("runtime", "model-lifecycle"),
    "secure-agent-execution": ("runtime", "secure-agent-execution"),
    "agent-harness": ("runtime", "agent-harness-adapter"),
    "capability-broker": ("runtime", "capability-broker"),
}


def load(path: str | Path):
    p = ROOT / path if isinstance(path, str) else path
    return json.loads(p.read_text(encoding="utf-8"))


def validate_suites(failures: list[str]) -> set[str]:
    seen: set[str] = set()
    paths = sorted((ROOT / "evals").glob(EVAL_GLOB))
    if not paths:
        failures.append("no platform-intelligence eval suites found")
        return seen

    for path in paths:
        data = load(path)
        if data.get("schema_version") != 1:
            failures.append(f"{path.relative_to(ROOT)}: schema_version must be 1")
        if not data.get("suite"):
            failures.append(f"{path.relative_to(ROOT)}: suite is required")
        cases = data.get("cases")
        if not isinstance(cases, list) or not cases:
            failures.append(f"{path.relative_to(ROOT)}: non-empty cases array required")
            continue
        for case in cases:
            cid = case.get("id")
            if not isinstance(cid, str) or not cid:
                failures.append(f"{path.relative_to(ROOT)}: case id is required")
                continue
            if cid in seen:
                failures.append(f"duplicate platform-intelligence case id: {cid}")
            seen.add(cid)
            if not isinstance(case.get("input"), str) or not case["input"].strip():
                failures.append(f"{cid}: input is required")
            must = case.get("must")
            must_not = case.get("must_not")
            if not isinstance(must, list) or not must or not all(isinstance(x, str) and x.strip() for x in must):
                failures.append(f"{cid}: must must be a non-empty string list")
                must = []
            if not isinstance(must_not, list) or not must_not or not all(isinstance(x, str) and x.strip() for x in must_not):
                failures.append(f"{cid}: must_not must be a non-empty string list")
                must_not = []
            overlap = {x.strip().lower() for x in must} & {x.strip().lower() for x in must_not}
            if overlap:
                failures.append(f"{cid}: contradictory must/must_not entries: {sorted(overlap)}")

    missing_mapping = seen - set(CASE_CONTROLS)
    stale_mapping = set(CASE_CONTROLS) - seen
    if missing_mapping:
        failures.append(f"unmapped platform-intelligence cases: {sorted(missing_mapping)}")
    if stale_mapping:
        failures.append(f"case-control mapping references missing cases: {sorted(stale_mapping)}")
    return seen


def validate_control_implementations(failures: list[str]) -> None:
    skills = {x["id"]: x for x in load("registry/skills.json").get("skills", [])}
    runtime = load("registry/runtime-capabilities.json").get("capabilities", {})
    used_controls = set().union(*CASE_CONTROLS.values()) if CASE_CONTROLS else set()

    for control in sorted(used_controls):
        impl = CONTROL_IMPLEMENTATIONS.get(control)
        if not impl:
            failures.append(f"control {control!r} has no implementation mapping")
            continue
        kind, identifier = impl
        if kind == "skill":
            item = skills.get(identifier)
            if not item:
                failures.append(f"control {control!r} requires missing registered skill {identifier!r}")
                continue
            canonical = ROOT / item.get("canonical_path", "")
            if not canonical.exists():
                failures.append(f"control {control!r} canonical skill path missing: {canonical.relative_to(ROOT)}")
        elif kind == "runtime":
            if identifier not in runtime:
                failures.append(f"control {control!r} requires missing runtime capability {identifier!r}")
        else:
            failures.append(f"control {control!r} has invalid implementation kind {kind!r}")


def validate_runtime_contracts(failures: list[str]) -> None:
    data = load("registry/runtime-capabilities.json")
    caps = data.get("capabilities", {})

    model = caps.get("model-lifecycle", {})
    if set(model.get("routing_dimensions", [])) != {"quality", "latency", "cost", "availability"}:
        failures.append("model-lifecycle: routing dimensions must be quality/latency/cost/availability")
    if model.get("deprecated_pin_behavior") != "FAIL":
        failures.append("model-lifecycle: deprecated pins must fail")
    if model.get("unknown_sunset_behavior") != "VERIFY_REQUIRED":
        failures.append("model-lifecycle: unknown sunset must require verification")

    sandbox = caps.get("secure-agent-execution", {})
    if sandbox.get("network_default") != "deny" or sandbox.get("secrets_default") != "deny":
        failures.append("secure-agent-execution: network and secrets must default deny")
    if sandbox.get("destructive_write") != "approval_required":
        failures.append("secure-agent-execution: destructive writes require approval")
    required_evidence = {"command", "exit_code", "artifacts", "logs", "teardown"}
    if not required_evidence <= set(sandbox.get("required_evidence", [])):
        failures.append("secure-agent-execution: incomplete evidence contract")

    harness = caps.get("agent-harness-adapter", {})
    required_fields = {"plan", "tools", "permissions", "sandbox", "skills", "subagents", "evidence", "result"}
    if set(harness.get("core_fields", [])) != required_fields:
        failures.append("agent-harness-adapter: normalized core field contract drifted")
    if harness.get("cross_repository_mutation_default") != "deny":
        failures.append("agent-harness-adapter: cross-repository mutation must default deny")

    broker = caps.get("capability-broker", {})
    if broker.get("separate_discovery_install_invocation") is not True:
        failures.append("capability-broker: discovery/install/invocation separation required")
    if broker.get("default_access") != "read_only":
        failures.append("capability-broker: default access must be read_only")
    if broker.get("destructive_actions") != "owner_approval_required":
        failures.append("capability-broker: destructive actions require owner approval")
    if broker.get("arbitrary_auto_install") != "deny":
        failures.append("capability-broker: arbitrary auto-install must be denied")


def validate_model_lifecycle(failures: list[str]) -> int:
    data = load("registry/model-lifecycle.json")
    if set(data.get("routing_dimensions", [])) != {"quality", "latency", "cost", "availability"}:
        failures.append("model lifecycle registry routing dimensions drifted")

    for source in data.get("official_sources", []):
        host = urlparse(source).hostname or ""
        if host not in {"developers.openai.com", "platform.openai.com", "help.openai.com", "openai.com"}:
            failures.append(f"model lifecycle registry has non-official OpenAI source: {source}")

    models = data.get("models", [])
    by_id = {m.get("model"): m for m in models if m.get("model")}
    current = data.get("current_agentic_coding_model")
    if current not in by_id or by_id[current].get("status") != "available":
        failures.append("current_agentic_coding_model must resolve to an available model")
    general = data.get("general_frontier_model_family")
    if general not in by_id or by_id[general].get("status") != "available":
        failures.append("general_frontier_model_family must resolve to an available model")

    deprecated: set[str] = set()
    required_fields = {"provider", "surface", "model", "status", "sunset_date", "fallback", "allow_new_pin"}
    for model in models:
        mid = model.get("model", "<missing>")
        missing = required_fields - set(model)
        if missing:
            failures.append(f"{mid}: missing lifecycle fields {sorted(missing)}")
        status = model.get("status")
        fallback = model.get("fallback")
        if fallback and (fallback not in by_id or by_id[fallback].get("status") != "available"):
            failures.append(f"{mid}: fallback must resolve to an available registered model")
        if status == "deprecated":
            deprecated.add(mid)
            if model.get("allow_new_pin") is not False:
                failures.append(f"{mid}: deprecated model cannot allow new pins")
            if model.get("sunset_date") is None and model.get("sunset_state") != "VERIFY_REQUIRED":
                failures.append(f"{mid}: unknown sunset requires VERIFY_REQUIRED")

    codex_paths = [ROOT / ".codex" / "config.toml", *sorted((ROOT / ".codex" / "agents").glob("*.toml"))]
    for path in codex_paths:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for mid in deprecated:
            if mid and mid in text:
                failures.append(f"{path.relative_to(ROOT)}: deprecated Codex model pin/reference detected: {mid}")
    return len(models)


def main() -> int:
    failures: list[str] = []
    cases = validate_suites(failures)
    validate_control_implementations(failures)
    validate_runtime_contracts(failures)
    model_count = validate_model_lifecycle(failures)

    if failures:
        print("PLATFORM INTELLIGENCE EVALS: FAILED")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        "PLATFORM INTELLIGENCE EVALS: PASSED "
        f"({len(cases)} cases, {len(CONTROL_IMPLEMENTATIONS)} controls, {model_count} lifecycle models)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
