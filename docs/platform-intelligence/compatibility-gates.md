# Platform Compatibility Gates

## Vercel modern-runtime gate
Before choosing runtime/config/storage/AI execution, verify current official guidance. Prefer current stable production primitives; reject stale defaults such as assuming Edge is required for streaming or assuming retired first-party storage products remain current. Evaluate Fluid Compute/default Node runtime, project configuration, AI Gateway, Sandbox, observability, WebSocket/realtime requirements and Marketplace storage against the project's actual needs. Preview/beta products remain opt-in behind an ADR and evidence.

## Apple/Xcode/iOS/Swift gate
Maintain a stable-production vs RC/beta scouting matrix. Agentic IDE/MCP/harness capabilities are evaluated through the neutral agent-harness adapter. Beta Xcode/iOS/Swift must not become an implicit production dependency. Require build, signing, simulator/device and App Store compatibility evidence before promotion.

## Android/Flutter gate
Production uses supported stable Android Studio/SDK/Gradle/Kotlin and Flutter/Dart combinations. RC/beta/canary channels run only compatibility/scouting jobs unless explicitly approved. Require device/emulator build evidence and phone acceptance separately from distribution readiness.

## WordPress/Gutenberg gate
Before a WordPress/Gutenberg major/minor upgrade, run staging compatibility for block themes/patterns, editor behavior, RTL/Arabic, forms, payment integrations, accessibility, responsive rendering, performance and rollback. Beta/RC releases are test targets, not production defaults.

## Evidence output
Every gate emits PASS, FAIL or VERIFY_REQUIRED plus versions/channels, official-source timestamp, tests, known limitations and rollback path.
