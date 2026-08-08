# AAA+ Engineering Empire v2.2 — Evaluated Agent Operating Contract

**Mode:** repository-first, multi-agent, evidence-driven, mobile-first, registry-governed.

This repository is the engineering control plane for building, upgrading, verifying, previewing, deploying, and operating software, websites, mobile/native apps, games, AI systems, automations, data platforms, and XR experiences.

## 1. Prime directive

Build the smallest complete production-grade increment that advances the approved user outcome. Optimize for verified value, maintainability, security, portability, and fast feedback — not activity, file count, framework fashion, agent count, or persuasive claims.

Never convert confidence, compile success, screenshots, mocks, generated scaffolding, or green unit tests alone into a completion claim.

## 2. Mandatory startup

Before material changes:

1. Inspect repository state, current branch, manifests/lockfiles, tests, CI/CD, deployments, docs, and recent changes.
2. Read this file and any nearer `AGENTS.md`.
3. Read relevant product, architecture, ADR, security, testing, deployment, mobile, AI, and verification evidence.
4. Identify users, measurable outcome, acceptance criteria, target platforms/devices, non-goals, dependencies, privacy/security needs, cost constraints, risks, and proof required.
5. Detect and preserve proven project patterns before introducing a new framework/service.
6. Verify fast-moving SDK/API/platform/store/model assumptions from current primary documentation before release-sensitive decisions.
7. Select only the skills and specialist agents needed for the task.

## 3. Canonical control plane

- `AGENTS.md` — governing repository contract.
- `CLAUDE.md` — Claude Code bridge.
- `.agents/skills/*/SKILL.md` — canonical reusable Agent Skills.
- `.claude/skills/*/SKILL.md` — Claude adapters that must reference canonical skills.
- `.codex/agents/*.toml` — Codex project agents.
- `.claude/agents/*.md` — Claude Code project agents.
- `.codex/config.toml` — bounded multi-agent configuration.
- `registry/skills.json` — skill identities, dependencies, platforms, permission ceilings, eval suite.
- `registry/agents.json` — executable agents, posture, skills, permissions, self-approval policy.
- `registry/routing.json` — deterministic baseline routing contracts.
- `evals/` — regression/evaluation cases.
- `scripts/validate_empire.py` — Empire Guard v2 structural/governance validator.
- `scripts/run_empire_evals.py` — routing/permission contract evaluator.

No executable skill or agent may exist outside its registry. Registry changes are governance changes.

## 4. Compatibility and drift

Empire is agent-neutral and repository-first.

- Codex follows this contract and canonical `.agents/skills/`.
- Claude Code follows `CLAUDE.md`; its skill adapters must retain the canonical description and canonical path reference.
- Other capable agents follow the same repository evidence and permission principles where supported.
- Never assume one agent platform supports another platform's capability; detect and degrade gracefully.
- Do not maintain divergent duplicate skill logic across adapters.

## 5. Registry and permission invariants

1. Skill dependencies must reference registered skills and remain acyclic.
2. Read-only agents must have read-only permissions.
3. Agents may never self-approve.
4. Implementation agents work on reviewable branches/PRs.
5. Release/deploy authority is separate from implementation authority where risk is material.
6. Unknown routing tags fail closed; do not silently select an unrelated specialist.
7. Route definitions may reference only registered skills/agents.
8. A routing contract is valid only when its selected agents cover all required skills through their declared skills and dependency closure.
9. Never weaken a guard, rule, permission, test, or approval gate merely to make the current change pass.

See `docs/architecture/EVALUATED_AGENT_SYSTEM.md`.

## 6. Empire specialist structure

Use the smallest qualified set; parallelize only independent work and retain one integration owner.

Core specialist responsibilities include:
- orchestration and repository mapping;
- product/UX and architecture;
- web/PWA;
- cross-platform mobile;
- Android/iOS native delivery;
- backend/data/cloud;
- AI/agent engineering;
- games/XR/simulation;
- security/privacy;
- QA/release verification;
- performance/reliability/accessibility;
- release/operations;
- red-team review.

Role names do not prove work occurred. Evidence must exist in code, tests, logs, builds, previews, reviews, or verification records.

## 7. Stack-routing doctrine

Do not use one stack for every project. Evaluate target platforms/stores, native APIs, graphics/performance, offline/realtime/background behavior, security/privacy/compliance, data ownership, operator workflow, phone-preview feasibility, CI/build/signing constraints, portability, lifecycle, maintenance burden, and total cost.

Prefer the current proven stack unless a measurable requirement justifies migration. Record material or hard-to-reverse choices as ADRs.

## 8. Mobile-first operator doctrine

For applicable projects, return the fastest safe feedback loop usable from a phone:

1. protected browser preview/PWA;
2. development/internal mobile build;
3. cloud device farm or streaming;
4. remote simulator/emulator;
5. local/native desktop tooling where genuinely required.

A phone-first workflow does not remove requirements for Xcode, Android Studio, native signing, profilers, or heavy game/3D tooling. Route those tasks to suitable remote/cloud/native infrastructure and return source-linked evidence to the phone.

## 9. Execution lifecycle

1. **Discover** — verify current state, mocks/placeholders, failures, risks, unknowns.
2. **Define** — outcome, acceptance criteria, non-goals, evidence, target devices.
3. **Route** — choose architecture, stack, skills, agents, environments, permissions, and preview path.
4. **Design** — define boundaries, contracts, trust/data flow, failure behavior, migration, observability, rollback.
5. **Build** — implement the smallest coherent end-to-end vertical slice.
6. **Verify** — run risk-based static, unit, integration, E2E, security, accessibility, performance, device/browser, migration, and AI evaluation checks as applicable.
7. **Preview** — produce an inspectable source-linked URL/build/simulation where feasible.
8. **Review** — use independent QA/security/red-team review for material releases.
9. **Document** — update source-of-truth docs, ADRs, registries/evals when behavior changes, and verification evidence.
10. **Release** — validate build/deploy/signing, migrations, monitoring, rollback/recovery, ownership, and release notes.
11. **Learn** — convert repeated verified defects or improvements into regression cases and then skill/policy changes.

## 10. Quality gates

No change is complete until applicable gates pass:

- Product/acceptance criteria.
- Architecture/interface consistency.
- Maintainable implementation.
- Tests including relevant failure/recovery states.
- Security, privacy, authorization, secrets, and least privilege.
- Accessibility/localization.
- Performance/reliability budgets where material.
- Representative browser/device behavior.
- AI evaluations/safety where AI is material.
- Deployment/migration/rollback/monitoring.
- Documentation/ADR.
- Registry/evaluation consistency for agent-system changes.
- Current evidence.

## 11. Evidence language

Use only:

- `VERIFIED` — directly confirmed with current evidence.
- `PARTIALLY VERIFIED` — some checks passed; remainder named.
- `UNVERIFIED` — not exercised or evidence unavailable.
- `BLOCKED` — cannot proceed; cause, impact, owner/next action named.

Never claim secure, deployed, production-ready, store-ready, or complete without current evidence.

## 12. Repository and security discipline

- Routine substantive work uses focused branches and pull requests, not direct `main`.
- Preserve unrelated work.
- Keep dependencies justified and lockfiles consistent.
- Never commit credentials, tokens, private keys, certificates, provisioning profiles, `.env` secrets, personal data, production secrets, or reusable approval codes.
- Prefer short-lived credentials/OIDC and protected environment/repository secrets.
- Use feature flags/staged rollout for high-risk changes.
- Production deployment, signing, destructive migrations, secret rotation, or irreversible operations require protected approval/gating and rollback/recovery planning.
- Governance/skills/agents/registry/evals/CI/security changes require Empire Guard v2 and owner review.

## 13. Testing and evaluations

Choose tests by risk. Contract tests and registries validate the agent operating system, but they do not replace project-specific behavioral evidence.

For agent-system changes:
- add/update registry metadata;
- add/update deterministic contract evals;
- verify permission/routing invariants;
- test project-level behavior when runtime/model/tool behavior changes;
- record regressions before changing a skill when possible.

For AI features, treat prompts, models, tools, retrieval, memory, datasets, evaluations, safety boundaries, latency, and cost as versioned engineering assets. Keep tools least-privilege, defend against prompt injection/untrusted retrieval, validate structured outputs, and define fallbacks/timeouts/escalation.

## 14. Evergreen technology rule

Do not freeze “latest” into permanent policy. Before adopting/upgrading a fast-moving SDK, model, framework, IDE, OS/store target, cloud service, or API:

1. verify current primary documentation;
2. identify stable/recommended channels and deprecations;
3. review migration/security notes;
4. prefer supported stable/LTS choices unless preview features have bounded value and rollback;
5. pin versions when reproducibility/security requires it;
6. record upgrade triggers/owners for material dependencies.

## 15. Core vs Empire learning rule

Empire is the specialist proving ground. A recurring workflow or defect should first be proven in a real project, then captured as a regression/eval and refined in Empire. Backport to `AAA-prompt` Core only when broadly useful and low-overhead.

## 16. Definition of done

A task is done only when applicable working change, passing checks, tests/evals, documentation/ADR, verification evidence, preview/build/deployment evidence, known limitations, and rollback/recovery or handoff are present.

Report:
- **Outcome**
- **Changed**
- **Preview / Test path**
- **Verified**
- **Risks / limitations**
- **Rollback / handoff**
- **Next action**

## 17. Authority hierarchy

When instructions conflict:

1. law, safety, privacy, platform policy, and repository security controls;
2. explicit current user requirements;
3. nearest repository-local `AGENTS.md`;
4. this root contract;
5. accepted ADRs/source-of-truth docs;
6. established repository conventions;
7. agent preference.

**Governing principle:** build deeply, route deliberately, verify independently, learn through regressions, and ship only what the evidence supports.
