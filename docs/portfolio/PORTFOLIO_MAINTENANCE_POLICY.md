# EVENTo0 Portfolio Maintenance Policy

Status: owner-review candidate  
Effective baseline: 2026-08-11  
Scope: every current and future repository owned by `EVENTo0`

## Purpose

Keep every project visible, development-ready, secure, reproducible and aligned with current supported tooling without erasing project intent or allowing agents to silently mutate sibling repositories.

The portfolio is operated as a federation of independent product repositories. `AAA-prompt-empire` owns reusable engineering capability, portfolio metadata, evidence policy and routing. Each product repository remains authoritative for its own source, migrations, assets, tests, releases and project decisions.

## Canonical operating roles

- `portfolio_operator`: reconcile repository inventory, project state, priorities, blockers, deployments and evidence.
- `technology_intelligence`: verify fast-moving models, frameworks, SDKs, stores, security advisories and platform capabilities from current primary sources.
- `continuity_analyst`: recover stale, interrupted, mixed-lineage or partially migrated projects before new feature work.
- `capability_curator`: turn proven recurring improvements into branch-only reusable skills/evals; never self-approve or write directly to product `main`.
- project specialists: mobile, web, backend/data, game studio, design, security, QA/performance, build/distribution and release agents are selected only when the project gate needs them.

## Weekly portfolio cycle

Every weekly run MUST:

1. Reconcile GitHub inventory against `apps/mobile-control-plane/data/project-registry.json`. New, renamed, archived or missing repositories are findings, not silent assumptions.
2. Inspect recent commits, open PRs/issues and available CI evidence for every active P0/P1 project and any repository changed since the prior report.
3. Detect mixed product lineages, empty/placeholder repositories, stale branches, duplicated control planes and initiatives without a repository.
4. Run an evidence-freshness review for fast-moving dependencies: security patches, supported release lines, breaking changes, store/toolchain requirements, model lifecycle, SDK/API changes and deprecations.
5. Classify each proposed upgrade as `security-hotfix`, `compatible-maintenance`, `major-migration`, `experimental-scout` or `no-change`.
6. Recommend the smallest qualified agent/skill set for the next project gate. More agents are not automatically better.
7. Record missing acceptance evidence: tests, runtime/device evidence, RLS/migration verification, accessibility, security, performance, build artifacts, preview URLs, provenance/SBOM, rollback and owner approval as applicable.
8. Publish one portfolio report with per-project status, changes, risks, recommended upgrades, blockers, next action and evidence level.

## Upgrade rules

### Security hotfix

Prepare a focused branch/PR promptly. Run the smallest complete regression suite and rollback check. Do not bundle unrelated redesigns.

### Compatible maintenance

Upgrade only when the supported target is verified from a primary source and project tests/builds can demonstrate compatibility.

### Major migration

Never bulk-upgrade across repositories. Use a project-local branch, migration guide, dependency diff, acceptance matrix, regression evidence and explicit rollback. Preserve project behavior unless the owner has approved a product change.

### Experimental scout

Beta, RC, preview and experimental agent/tool capabilities stay isolated. They may inform designs or evals, but are not a production default until representative evidence is collected.

## Agent-write and approval boundary

- Agents may read broadly when authorized, but product writes are project-local and branch/PR-first.
- No agent may self-approve, silently merge, publish to stores, mutate production data or broaden credentials because a newer capability exists.
- Auto-commit loops to protected/default branches are prohibited. Existing automation with that behavior is a remediation target.
- Cross-repository updates require an explicit portfolio plan and separate product PRs; Empire never treats its registry as permission to mutate products.
- Owner review remains the final gate for sensitive governance, production release and Core promotion.

## Project technology rules

- Flutter/Dart: stable-first; verify package/plugin compatibility and native build files before SDK upgrades. Produce Android/iOS or hosted evidence appropriate to the gate.
- Expo/React Native: keep the Expo SDK, React Native, React and minimum Node version as one compatibility tuple; use EAS/native upgrade evidence rather than independent version bumps.
- Next.js: security-supported release lines take priority over feature work. Major upgrades require build/typecheck/test and deployment verification.
- Supabase: use publishable client keys, RLS on exposed tables, least-privilege grants, migration tests and cross-tenant/role negative tests. Official Supabase Agent Skills may be installed project-locally after review; they do not bypass repository policy.
- Unreal/Unity: engine version claims require a real editor/build host. Source scaffolds and generated manifests are not runtime evidence. Experimental editor-agent/MCP features remain scouting-only until isolated validation passes.
- Payments: API/SDK upgrades require webhook, idempotency, test-mode and fulfillment-ledger regression evidence.

## Portfolio structure rules

- One product/source-of-truth per repository unless an explicitly documented workspace isolation contract exists.
- Mixed unrelated product histories must be separated before feature merges continue.
- Placeholder repositories should be archived or converted to a documented meta/umbrella role; do not duplicate product source.
- Initiatives without an implementation repository stay `UNLINKED`/paused and cannot be reported as implemented.
- Aggregates such as EVEX may exist in the registry, but the child repositories remain independently authoritative.

## Weekly report minimum fields

For every tracked project include:
- evidence status: VERIFIED / PARTIALLY VERIFIED / UNVERIFIED / UNLINKED;
- current phase and authoritative repo/branch/PR;
- changes since prior report;
- dependency/security/toolchain status;
- agent/skill recommendation;
- blocker or next evidence gate;
- whether a branch/issue/PR was prepared;
- owner decision required, if any.

## Promotion to AAA-prompt Core

Only capabilities that are proven across representative projects, broadly reusable, low-cost, non-provider-fragile and protected by regression evals may be proposed for Core. Provider-specific or experimental capabilities remain in Empire.
