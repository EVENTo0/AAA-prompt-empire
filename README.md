# AAA+ Engineering Empire v2.2

**Repository-first, mobile-first, evaluated multi-agent engineering control plane for Codex + Claude Code.**

Status: **v2.2 evaluated-governance candidate**  
Owner: **EVENTo0**  
Default branch: `main`

## What Empire is

Empire coordinates complex software, web, mobile/native, backend/data, AI, game/XR, automation, and release work through canonical skills, executable specialist agents, evidence gates, and a phone-accessible control plane.

It is intentionally broader than `EVENTo0/AAA-prompt` Core. Proven broadly useful improvements may later be backported to Core; specialist behavior stays in Empire.

## v2.2 control plane

- `AGENTS.md` — evaluated, registry-governed operating contract.
- `.agents/skills/` — 15 canonical Agent Skills.
- `.codex/agents/` — 14 Codex specialist agents.
- `.claude/agents/` — 14 Claude Code specialist agents.
- `.claude/skills/` — Claude adapters to canonical skills.
- `registry/skills.json` — skill identity, dependency, platform and permission contracts.
- `registry/agents.json` — executable agent posture, skill and permission contracts.
- `registry/routing.json` — deterministic baseline routing contracts.
- `evals/contract-routing.json` — routing/permission regression cases.
- `scripts/validate_empire.py` — Empire Guard v2 structural/governance validation.
- `scripts/run_empire_evals.py` — deterministic routing/permission eval harness.
- `.github/workflows/empire-guard.yml` — CI gate for governance and evals.
- `.github/CODEOWNERS` — protected ownership for control-plane assets.

## Mobile Control Plane

`apps/mobile-control-plane` is the phone-first operator PWA. It aggregates allowlisted GitHub repositories/PRs/Actions, Vercel deployments/previews, Supabase project health, EVENTO catalog data, and controlled build/retry actions.

Security defaults:
- provider credentials remain server-side;
- repository/workflow scopes are allowlisted;
- write actions are disabled by default;
- authenticated API state is never cached by the service worker;
- production should add a stronger upstream identity boundary before broad exposure.

## Operating lifecycle

1. audit real repository state;
2. define measurable outcome and acceptance evidence;
3. route the smallest qualified skill/agent set;
4. build a coherent vertical slice;
5. verify independently by risk;
6. return a source-linked preview/build/test path;
7. update docs, registries/evals and evidence when behavior changes;
8. release only what current evidence supports;
9. turn repeated defects/improvements into regression cases before changing Empire behavior.

## Evaluation model

Empire v2.2 adds machine-readable contracts and deterministic regressions for:
- skill and agent registry parity;
- Claude adapter drift from canonical skills;
- dependency graph validity and cycle detection;
- read-only/write/deploy permission boundaries;
- no agent self-approval;
- routing references and specialist coverage;
- fail-closed behavior for unknown task tags;
- basic secret hygiene.

These controls validate the operating system. They do not replace project-specific behavioral, device, security, performance, deployment, or AI evaluations.

See `docs/architecture/EVALUATED_AGENT_SYSTEM.md`.

## Repository protection

Routine work belongs on focused branches and PRs. `main` should require owner review and `Empire Guard / governance-and-skills`, with force-push/deletion blocked and production operations protected separately.

Repository visibility and rulesets are GitHub settings and cannot be enforced by repository files alone. See `docs/security/REPOSITORY_LOCKDOWN.md`.

## Technology policy

Empire does not freeze “latest” models/frameworks/SDKs into permanent instructions. Verify fast-moving choices from current primary documentation and add version pins only where reproducibility/security needs them.

See `docs/architecture/TECHNOLOGY_RADAR.md`.

## Definition of done

A compile, screenshot, mock, generated codebase, or agent claim is not completion. Applicable acceptance, tests/evals, security/privacy, accessibility, performance/reliability, device/browser, AI, deployment/recovery, documentation, and evidence gates must pass or be explicitly reported as blocked/unverified.

## Version

`AAA+ Engineering Empire v2.2 — Evaluated, Governed & Self-Improving Agent System — 2026.08`
