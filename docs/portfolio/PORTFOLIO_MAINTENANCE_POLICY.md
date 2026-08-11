# EVENTo0 / EVENTO Portfolio Maintenance Policy

Status: owner-review candidate  
Effective baseline: 2026-08-11  
Scope: every current and future repository owned by `EVENTo0`

## Business truth

**EVENTO Project Development is the legal company, operating company and commercial parent.**

All commercial products, original ideas, reusable project packages and client projects are developed through EVENTO unless a project-specific legal/ownership contract says otherwise. GitHub repository ownership alone does not redefine commercial ownership.

The portfolio is intentionally split into five layers:

1. `company-core` — EVENTO public website, company mobile app, customer/order/delivery systems and company operations.
2. `internal-engineering-lab` — AAA Prompt, AAA+ Engineering Empire, Mobile Control Plane, OMNIFORM and future agent/skill/automation/R&D systems used to accelerate EVENTO work. These are internal production infrastructure, not products for sale by default.
3. `evento-venture` — EVENTO-created or EVENTO-managed products/IP that may be launched, licensed, subscribed to, packaged, sold or continuously operated for revenue.
4. `client-project` — customer-owned or customer-commissioned work. Client ownership, license, delivery and maintenance terms must be recorded explicitly before production handoff.
5. `portfolio-meta` — source-light umbrella/coordination repositories only; never duplicate product runtime source.

## Purpose

Keep every EVENTO project visible, development-ready, secure, reproducible and commercially actionable while using current engineering, AI-agent, automation, design, simulation and deployment methods without erasing project intent or allowing agents to silently mutate sibling repositories.

`AAA-prompt-empire` owns reusable engineering capability, portfolio metadata, evidence policy and routing. Each product repository remains authoritative for its source, migrations, assets, tests, releases and project decisions. EVENTO remains the business parent above those technical boundaries.

## Company-first priority model

Portfolio work is prioritized in this order unless the owner explicitly overrides it:

1. **P0 EVENTO revenue engine** — company website/PWA, company mobile app, service/request/order flow, project catalog, customer communications, payment/delivery/aftercare and owner control plane.
2. **P0 engineering leverage** — Empire/control-plane capabilities that materially shorten development, testing, preview, deployment, mobile review or maintenance across multiple projects.
3. **P1 near-production ventures** — projects that can reach verified beta/production/commercial status with bounded work and a credible revenue path.
4. **P1 strategic IP** — high-value games, health platforms, knowledge products and reusable design/software systems with staged validation.
5. **P2 recovery/incubation** — paused/stale projects that require continuity recovery, repository creation or major migration before feature work.

This prevents the internal R&D lab from consuming all effort while the company sales and delivery engine remains unfinished.

## Canonical project lifecycle

Every commercial project is mapped to one primary stage:

`idea -> discovery -> foundation -> mvp -> verified -> beta -> production -> commercial -> maintenance`

A project advances only when the evidence for its current gate exists. Documentation, generated source or screenshots alone do not count as runtime/release proof when runtime/release proof is applicable.

### Commercial gate after production

Production is not the final stage. Before a project is treated as commercially ready, define:
- target customer and problem;
- delivery model: subscription, license, sale, service, custom adaptation, usage-based or hybrid;
- price/margin hypothesis and infrastructure/AI/payment costs;
- customer onboarding and support path;
- legal/privacy/terms/store requirements;
- demo/preview/sales assets;
- analytics and conversion measurement;
- maintenance/update obligations;
- rollback, ownership and handoff terms if sold to a customer.

## Canonical operating roles

- `portfolio_operator`: reconcile repository inventory, project state, business layer, priorities, blockers, deployments and evidence.
- `technology_intelligence`: verify fast-moving models, frameworks, SDKs, stores, security advisories and platform capabilities from current primary sources.
- `continuity_analyst`: recover stale, interrupted, mixed-lineage or partially migrated projects before new feature work.
- `capability_curator`: turn proven recurring improvements into branch-only reusable skills/evals; never self-approve or write directly to product `main`.
- product/revenue specialists: product management, UX/design, pricing/monetization, sales enablement and customer-delivery planning are added when a project approaches beta/production/commercial gates.
- engineering specialists: mobile, web, backend/data, game studio, design, security, QA/performance, build/distribution and release agents are selected only when the project gate needs them.

## Weekly portfolio cycle

Every weekly run MUST:

1. Reconcile GitHub inventory against `apps/mobile-control-plane/data/project-registry.json`. New, renamed, archived or missing repositories are findings, not silent assumptions.
2. Preserve the EVENTO hierarchy: company-core, internal engineering lab, EVENTO ventures, client projects and meta repositories must not be conflated.
3. Inspect recent commits, open PRs/issues and available CI evidence for every active P0/P1 project and any repository changed since the prior report.
4. Detect mixed product lineages, empty/placeholder repositories, stale branches, duplicated control planes and initiatives without a repository.
5. Run an evidence-freshness review for fast-moving dependencies: security patches, supported release lines, breaking changes, store/toolchain requirements, model lifecycle, SDK/API changes and deprecations.
6. Classify each proposed upgrade as `security-hotfix`, `compatible-maintenance`, `major-migration`, `experimental-scout` or `no-change`.
7. Recommend the smallest qualified agent/skill set for the next project gate. More agents are not automatically better.
8. For ventures approaching beta/production, add a commercial-readiness review: value proposition, packaging, pricing, margin, demo/sales assets, analytics, support and legal/privacy readiness.
9. Record missing acceptance evidence: tests, runtime/device evidence, RLS/migration verification, accessibility, security, performance, build artifacts, preview URLs, provenance/SBOM, rollback and owner approval as applicable.
10. Publish one portfolio report with per-project status, changes, risks, recommended upgrades, blockers, next action, commercial path and evidence level.

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
- Client-project writes must additionally respect the client's agreed scope, ownership, environments and delivery contract.
- Owner review remains the final gate for sensitive governance, production release, commercial launch and Core promotion.

## Project technology rules

- Flutter/Dart: stable-first; verify package/plugin compatibility and native build files before SDK upgrades. Produce Android/iOS or hosted evidence appropriate to the gate.
- Expo/React Native: keep the Expo SDK, React Native, React and minimum Node version as one compatibility tuple; use EAS/native upgrade evidence rather than independent version bumps.
- Next.js: security-supported release lines take priority over feature work. Major upgrades require build/typecheck/test and deployment verification.
- Supabase: use publishable client keys, RLS on exposed tables, least-privilege grants, migration tests and cross-tenant/role negative tests. Official Supabase Agent Skills may be installed project-locally after review; they do not bypass repository policy.
- Unreal/Unity: engine version claims require a real editor/build host. Source scaffolds and generated manifests are not runtime evidence. Experimental editor-agent/MCP features remain scouting-only until isolated validation passes.
- Payments: API/SDK upgrades require webhook, idempotency, test-mode and fulfillment-ledger regression evidence.

## Portfolio structure rules

- EVENTO Project Development remains the legal/business parent regardless of repository layout.
- One product/source-of-truth per repository unless an explicitly documented workspace isolation contract exists.
- Mixed unrelated product histories must be separated before feature merges continue.
- Placeholder repositories should be archived or converted to a documented meta/umbrella role; do not duplicate product source.
- Initiatives without an implementation repository stay `UNLINKED`/paused and cannot be reported as implemented.
- Aggregates such as EVEX may exist in the registry, but child repositories remain independently authoritative for implementation.
- A new customer project should receive a dedicated repository or explicit isolated workspace, plus ownership/delivery metadata, rather than being mixed into EVENTO company source.

## Weekly report minimum fields

For every tracked project include:
- portfolio layer and EVENTO parent relationship;
- evidence status: VERIFIED / PARTIALLY VERIFIED / UNVERIFIED / UNLINKED;
- lifecycle stage and authoritative repo/branch/PR;
- changes since prior report;
- dependency/security/toolchain status;
- agent/skill recommendation;
- blocker or next evidence gate;
- commercial/revenue path when applicable;
- whether a branch/issue/PR was prepared;
- owner decision required, if any.

## Promotion to AAA-prompt Core

Only capabilities that are proven across representative EVENTO projects, broadly reusable, low-cost, non-provider-fragile and protected by regression evals may be proposed for Core. Provider-specific or experimental capabilities remain in Empire.
