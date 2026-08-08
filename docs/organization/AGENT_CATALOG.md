# AAA+ Engineering Empire — Executable Agent Catalog

This catalog distinguishes **operating roles** from **actual agent definitions**.

- Codex project subagents: `.codex/agents/*.toml`
- Claude Code project subagents: `.claude/agents/*.md`
- Cross-agent reusable skills for Codex: `.agents/skills/*/SKILL.md`
- Claude project skill mirrors: `.claude/skills/*/SKILL.md`

## Core agent set

| Agent | Primary responsibility | Default posture |
|---|---|---|
| `code_mapper` | Trace repository/runtime paths and gather evidence before editing | read-only |
| `solution_architect` | Architecture, interfaces, ADR-worthy decisions, stack constraints | read-only |
| `product_ux` | Requirements, user journeys, acceptance criteria, accessibility/i18n risks | read-only |
| `web_builder` | Web/PWA/frontend vertical slices and browser validation | implementation |
| `mobile_builder` | Cross-platform mobile, device lifecycle, phone-specific UX and build path | implementation |
| `native_platform` | Android/iOS native integration, signing/toolchain/platform-specific constraints | implementation |
| `backend_data` | APIs, databases, auth, storage, queues, migrations, integrations | implementation |
| `ai_engineer` | Agent/model/tool design, evaluations, retrieval, safety, cost/latency | implementation |
| `game_simulation` | Game/3D/XR runtime systems, simulation, content and performance constraints | implementation |
| `security_reviewer` | Trust boundaries, authz, secrets, supply chain, privacy and abuse risks | read-only |
| `qa_verifier` | Reproduce behavior, test acceptance criteria, regression and release evidence | verification |
| `performance_reliability` | Profiling, resilience, latency/memory/battery/network budgets | verification |
| `release_engineer` | CI/CD, previews, builds, deployment, rollback, monitoring and handoff | implementation |
| `red_team_reviewer` | Challenge completion claims and identify missing evidence/failure modes | read-only |

## Routing rule

Do not activate every agent for every task. Use the smallest specialist set that covers material risk. Parallelize only independent work and retain one integration owner.

## Model rule

Do not permanently pin agent models merely to chase “latest.” Inherit the supported parent/default model unless evaluation evidence justifies an override for a specific agent. Re-evaluate overrides after major model or workload changes.

## Safety rule

Read-only agents must not be given a write-capable sandbox/tool surface merely for convenience. Implementation agents must work on reviewable branches and may not weaken the checks or permissions that govern their own change.
