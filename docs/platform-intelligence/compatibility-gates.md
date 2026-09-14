# Platform Compatibility Gates

## Vercel modern-runtime gate
Before choosing runtime/config/storage/AI execution, verify current official guidance. Prefer current stable production primitives; reject stale defaults such as assuming Edge is required for streaming or assuming retired first-party storage products remain current. Evaluate Fluid Compute/default Node runtime, project configuration, AI Gateway, Sandbox, observability, WebSocket/realtime requirements and Marketplace storage against the project's actual needs. Preview/beta products remain opt-in behind an ADR and evidence.

## Apple/Xcode/iOS/Swift gate
Maintain a stable-production vs RC/beta scouting matrix. Agentic IDE/MCP/harness capabilities are evaluated through the neutral agent-harness adapter. Beta Xcode/iOS/Swift must not become an implicit production dependency. Require build, signing, simulator/device and App Store compatibility evidence before promotion.

### Xcode 27 state correction
- Xcode 27 (27A266a) entered the stable release channel on 2026-09-14. Earlier RC/beta classification is historical and must not be reported as current.
- Stable availability permits project-specific compatibility evaluation; it does not prove build, signing, device, plugin or App Store readiness for an existing project.

## Android/Flutter gate
Production uses supported stable Android Studio/SDK/Gradle/Kotlin and Flutter/Dart combinations. RC/beta/canary channels run only compatibility/scouting jobs unless explicitly approved. Require device/emulator build evidence and phone acceptance separately from distribution readiness.

### Android Studio Quail 4 correction
- Android Studio Quail 4 (2026.1.4) is the current stable channel. Quail 3 is a prior stable line and must not be reported as current.
- Newer Android Studio releases apply a time-based AGP compatibility policy: AGP versions older than roughly three years are no longer supported. Treat the version table and the age window as two independent checks.
- A project outside the supported AGP window is `MIGRATION_REQUIRED`; do not silently upgrade production without build/test/rollback evidence.

## WordPress/Gutenberg gate
Before a WordPress/Gutenberg major/minor upgrade, run staging compatibility for block themes/patterns, editor behavior, RTL/Arabic, forms, payment integrations, accessibility, responsive rendering, performance and rollback. Beta/RC releases are test targets, not production defaults.

### WordPress 7.1 iframe compatibility guard
- WordPress 7.1 always uses the iframe post editor regardless of a block's `apiVersion`; the WordPress 7.0 non-iframe fallback is not a future compatibility strategy.
- Blocks using Block API v2 or lower must be explicitly tested inside the iframe editor. Any dependency on parent-page `document`/`window`, legacy asset placement or non-iframe styling assumptions is a compatibility failure until corrected.
- Prefer migration to Block API v3 after successful iframe testing. Do not mark v2-or-lower blocks PASS merely because they worked under the WordPress 7.0 fallback.

## GitHub platform lifecycle gate
- GitHub Spark on github.com is retired for new adoption: it stopped accepting new users/new apps on 2026-08-04 and existing-user editing access ended 2026-08-31. Do not select Spark for a new project, prototype platform or template.
- Existing deployed Spark apps may continue to run, but continued maintenance requires exported code and replacement of retired `llm()`/GitHub Models dependencies where applicable.
- GitHub removes SHA-1 from HTTPS/TLS on 2026-09-15. Release-critical Git/API/CI clients must prove modern TLS compatibility before the deadline.
- Use `cache-mode` with least privilege at workflow/job scope. Do not grant cache writes to low-trust code paths.
- Where plan support exists, require secret-scanning alerts introduced by a PR to be resolved before merge through a repository ruleset. Workflow text alone cannot prove this external setting.
- Treat CodeQL 2.27.0 as the currently verified 2026-09-09 lifecycle point, not a permanent pin. Reverify github.com automatic rollout versus GHES/manual CLI upgrade state at each review.

## Experimental agent runtime backends
- OpenAI Agents API and the Vercel Agent Stack runtime are experimental backends behind the provider-neutral agent-harness adapter.
- They are not Core dependencies, do not authorize a new Agent or Skill, and do not bypass Provider Live Parity.
- Record channel, auth, environment/sandbox, tools, approvals, region/data residency, failover, cost and teardown evidence before any production proposal.

## Hostinger Reach adapter gate
- Treat Hostinger Reach as an optional capability-broker adapter, not a standalone Empire Agent.
- Prefer the official Reach public API, Hostinger Connector, or official Hostinger API n8n Community Node. Keep discovery/read-only by default and route mutations/sends/deletes through scoped credentials and approval rules.
- Automated node/plugin installation or update is limited to allowlisted trusted sources.

## Core promotion gate
Empire compatibility evidence does not authorize AAA-prompt Core mutation. Provider Live Parity is still the final proof gate for provider/runtime claims; Core promotion remains blocked until that evidence passes and the owner separately approves promotion.

## Evidence output
Every gate emits PASS, FAIL, MIGRATION_REQUIRED or VERIFY_REQUIRED plus versions/channels, official-source timestamp, effective dates, tests, known limitations and rollback path.
