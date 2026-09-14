# Baseline Catch-up Audit — Wave 3 Runtime Integration

Date: 2026-08-12
Scope: runtime/eval integration inside `AAA-prompt-empire` only. No sibling repository mutation.

## OpenAI / Codex model lifecycle
Status: PASS for current API model-catalog guard; product-surface defaults remain freshness-gated.

Verified official evidence:
- OpenAI's current model guidance presents GPT-5.6 as the general frontier family.
- The official model catalog presents `gpt-5.3-codex` as the current agentic coding model.
- The same catalog marks older Codex-family entries including `gpt-5.2-codex`, `gpt-5.1-codex`, `gpt-5.1-codex-max`, `gpt-5.1-codex-mini`, `gpt-5-codex`, and `codex-mini-latest` as deprecated.
- The current official pages inspected do not provide a reliable sunset date for every deprecated Codex model, so the registry records unknown sunset as `VERIFY_REQUIRED` rather than inventing dates.

Official sources:
- https://developers.openai.com/api/docs/models/all
- https://developers.openai.com/api/docs/models/gpt-5.3-codex
- https://developers.openai.com/api/docs/guides/latest-model

Repository action:
- added `registry/model-lifecycle.json`;
- fail new deprecated Codex pins/references in `.codex/config.toml` or `.codex/agents/*.toml`;
- retain quality + latency + cost + availability routing dimensions;
- preserve provider/surface-aware fallbacks and evidence freshness.

## Runtime capability contracts
Status: PASS as deterministic governance contracts; live provider execution benchmarks remain a later evidence layer.

Added `registry/runtime-capabilities.json` for:
- model lifecycle;
- secure agent execution;
- agent harness adapter;
- MCP/connector capability broker.

Key enforced defaults:
- untrusted/generated code -> sandbox;
- network and secrets -> deny by default;
- destructive writes -> approval required;
- harness output -> normalized plan/tools/permissions/sandbox/skills/subagents/evidence/result;
- discovery, installation and invocation -> separate stages;
- arbitrary capability auto-install -> denied;
- cross-repository mutation -> denied by default.

## Platform intelligence eval integration
Status: IMPLEMENTED.

`run_platform_intelligence_evals.py` now loads every `evals/platform-intelligence-wave-*.json` suite and verifies:
- schema and unique cases;
- no contradictory MUST/MUST_NOT contract;
- every case is mapped to an implemented registered Skill or runtime capability;
- runtime security/governance invariants;
- model lifecycle/fallback consistency;
- deprecated Codex model references do not enter active Codex config/agent files.

## GitHub Actions runtime correction
Status: UPGRADED / CI verification required.

Official GitHub release APIs show current stable releases:
- `actions/checkout` v7.0.1;
- `actions/setup-python` v7.0.0.

Empire Guard is updated from checkout v4 / setup-python v5 to major v7 and now executes the platform-intelligence eval runner as a required job step. This addresses the Node 20 deprecation warning observed in prior Guard logs and moves the workflow to the current action runtime generation.

Official sources:
- https://api.github.com/repos/actions/checkout/releases/latest
- https://api.github.com/repos/actions/setup-python/releases/latest

## Wave 3 remaining evidence
Before promotion to Core:
1. Empire Guard must pass with the new runtime/eval step.
2. Representative Codex/Claude harness comparison should produce normalized evidence; no provider should bypass permissions.
3. A sandbox implementation should be selected per execution environment and validated with a harmless untrusted-code fixture.
4. Capability-broker integration should be tested against at least one read-only MCP/connector and one simulated destructive action requiring owner approval.
5. Promotion Candidate Report must distinguish low-cost provider-neutral controls from Empire-only experimental runtime integrations.
