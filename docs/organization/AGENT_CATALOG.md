# AAA+ Engineering Empire — Executable Agent Catalog

This catalog distinguishes **operating roles** from **actual agent definitions**.

- Codex project subagents: `.codex/agents/*.toml`
- Claude Code project subagents: `.claude/agents/*.md`
- Cross-agent reusable skills for Codex: `.agents/skills/*/SKILL.md`
- Claude project skill mirrors: `.claude/skills/*/SKILL.md`
- Machine-readable contracts: `registry/agents.json`, `registry/skills.json`, `registry/routing.json`

## Executable agent set

| Agent | Primary responsibility | Default posture |
|---|---|---|
| `code_mapper` | Trace repository/runtime paths and gather evidence before editing | read-only |
| `solution_architect` | Architecture, interfaces, ADR-worthy decisions, stack constraints | read-only |
| `product_ux` | Requirements, user journeys, acceptance criteria, accessibility/i18n risks | read-only |
| `web_builder` | Web/PWA/frontend vertical slices and browser validation | implementation |
| `mobile_builder` | Cross-platform mobile, device lifecycle, phone-specific UX and build path | implementation |
| `build_distribution` | Cloud mobile builds, APK/AAB/IPA artifacts, prerelease distribution, signing boundaries and phone-install evidence | operations |
| `native_platform` | Android/iOS native integration, signing/toolchain/platform-specific constraints | implementation |
| `backend_data` | APIs, databases, auth, storage, queues, migrations, integrations | implementation |
| `ai_engineer` | Agent/model/tool design, evaluations, retrieval, safety, cost/latency | implementation |
| `game_simulation` | Game/3D/XR runtime systems, simulation, content and performance constraints | implementation |
| `creative_director` | Original game narrative/worldbuilding, design direction, prototypes and implementation handoff | read-only |
| `portfolio_operator` | Multi-project status, priorities, dependencies, stale evidence, sale readiness and safe parallel work | read-only |
| `security_reviewer` | Trust boundaries, authz, secrets, supply chain, privacy and abuse risks | read-only |
| `qa_verifier` | Reproduce behavior, test acceptance criteria, regression and release evidence | verification |
| `performance_reliability` | Profiling, resilience, latency/memory/battery/network budgets | verification |
| `release_engineer` | CI/CD, previews, builds, deployment, rollback, monitoring and handoff | operations |
| `red_team_reviewer` | Challenge completion claims and identify missing evidence/failure modes | read-only |

## Routing rule

Do not activate every agent for every task. Use the smallest specialist set that covers material risk. Parallelize only independent work and retain one integration owner.

Important distinctions introduced in v2.3:

- app implementation (`mobile_builder`) is separate from build/distribution operations (`build_distribution`);
- game runtime implementation (`game_simulation`) is separate from story/world/design production (`creative_director`);
- portfolio status coordination (`portfolio_operator`) must not rewrite project-local implementation;
- production release remains a separately protected `release_engineer` concern.

## Model rule

Do not permanently pin agent models merely to chase “latest.” Inherit the supported parent/default model unless evaluation evidence justifies an override for a specific agent. Re-evaluate overrides after major model or workload changes.

## Safety rule

Read-only agents must not be given a write-capable sandbox/tool surface merely for convenience. Implementation/operations agents must work on reviewable branches, respect environment gates, and may not weaken checks or permissions that govern their own change. No agent may self-approve.
