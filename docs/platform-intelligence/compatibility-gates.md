# Platform Compatibility Gates

## Vercel modern-runtime gate
Before choosing runtime/config/storage/AI execution, verify current official guidance. Prefer current stable production primitives; reject stale defaults such as assuming Edge is required for streaming or assuming retired first-party storage products remain current. Evaluate Fluid Compute/default Node runtime, project configuration, AI Gateway, Sandbox, observability, WebSocket/realtime requirements and Marketplace storage against the project's actual needs. Preview/beta products remain opt-in behind an ADR and evidence.

## Apple/Xcode/iOS/Swift gate
Maintain a stable-production vs RC/beta scouting matrix. Agentic IDE/MCP/harness capabilities are evaluated through the neutral agent-harness adapter. Beta Xcode/iOS/Swift must not become an implicit production dependency. Require build, signing, simulator/device and App Store compatibility evidence before promotion.

## Android/Flutter gate
Production uses supported stable Android Studio/SDK/Gradle/Kotlin and Flutter/Dart combinations. RC/beta/canary channels run only compatibility/scouting jobs unless explicitly approved. Require device/emulator build evidence and phone acceptance separately from distribution readiness.

### Android Studio Quail 3 guard
- Android Studio Quail 3 (2026.1.3) supports AGP 7.1 through 9.3 according to the current Android Studio compatibility table.
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

## Hostinger Reach adapter gate
- Treat Hostinger Reach as an optional capability-broker adapter, not a standalone Empire Agent.
- Prefer the official Reach public API, Hostinger Connector, or official Hostinger API n8n Community Node. Keep discovery/read-only by default and route mutations/sends/deletes through scoped credentials and approval rules.
- Automated node/plugin installation or update is limited to allowlisted trusted sources.

## Core promotion gate
Empire compatibility evidence does not authorize AAA-prompt Core mutation. Provider Live Parity is still the final proof gate for provider/runtime claims; Core promotion remains blocked until that evidence passes and the owner separately approves promotion.

## Evidence output
Every gate emits PASS, FAIL, MIGRATION_REQUIRED or VERIFY_REQUIRED plus versions/channels, official-source timestamp, effective dates, tests, known limitations and rollback path.
