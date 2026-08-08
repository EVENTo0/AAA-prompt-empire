---
name: native-platform-delivery
description: Handle Android Studio/Kotlin/Compose and Apple Xcode/Swift/SwiftUI platform-specific implementation, profiling, signing, packaging, and store readiness. Use when native APIs or native quality constraints matter.
---

# Native Platform Delivery

## Android lane
- Prefer Kotlin and current supported Android architecture/tooling unless the existing project or requirement justifies otherwise.
- Validate Gradle/toolchain compatibility, API/device matrix, permissions, lifecycle/background constraints, adaptive layouts, accessibility, performance and packaging.
- Use Android Studio-compatible builds/profiling and representative physical/emulated devices.

## Apple lane
- Prefer Swift and current supported Apple frameworks/tooling unless project constraints justify otherwise.
- Validate deployment targets, entitlements, privacy declarations, background modes, accessibility, adaptive layouts, signing/provisioning, and archive/distribution flow.
- Use Xcode/macOS infrastructure for tasks that require Apple toolchains; a phone-only operator should receive remote/cloud build evidence rather than a false claim that Xcode is unnecessary.

## Shared rules
1. Verify current platform/store requirements from primary documentation before release-sensitive changes.
2. Keep credentials/certificates out of source control.
3. Test denied/revoked permissions and lifecycle interruptions, not only happy paths.
4. Record physical-device evidence and release blockers.
