# Mobile-First Operating Model

## Goal

Make projects practical to direct, inspect, preview, test, and approve from a phone while still using the native/cloud toolchains required for professional builds.

## Principle

The phone is the **operator console and primary feedback device**, not a fake replacement for every build tool. When Android Studio, Xcode/macOS signing, heavy game engines, GPU profiling, or specialized simulators are required, Empire routes that work to a cloud/remote build environment and returns an inspectable artifact to the phone.

## Default feedback ladder

Choose the fastest path that provides truthful evidence:

1. **Responsive web/PWA preview** with a secure preview URL.
2. **Physical-phone development client/internal build** for mobile apps.
3. **Cloud device streaming/device farm** for wider Android/iOS coverage.
4. **Remote emulator/simulator** for platform-specific behavior.
5. **Desktop/native IDE session** for tasks that require Android Studio/Xcode/engine tooling.

## Mobile app routing

### Cross-platform product apps

Evaluate React Native/Expo, Flutter, Kotlin Multiplatform, or other supported stacks based on requirements. Do not default to one stack.

Prefer a development workflow that can produce:
- fast QR/link-based device testing where supported;
- cloud builds for Android/iOS;
- internal distribution or development-client builds;
- reproducible CI builds;
- native module escape hatches when needed.

### Android-specific

Route platform-specific work to the Android lane when the product depends on Android-only APIs, widgets, services, performance behavior, device-management features, or store/platform constraints. Validate with Android Studio-compatible projects and representative physical devices/emulators.

### Apple-specific

Route platform-specific work to the Apple lane when the product depends on Apple-only frameworks, widgets, App Clips, extensions, background modes, entitlements, Metal/AR/spatial features, or platform-specific UX. Use Xcode/macOS signing infrastructure remotely when the operator is on a non-macOS phone/device.

## Web and backend from phone

For browser-based management, provide where appropriate:
- preview URLs per branch/PR;
- authentication protected previews;
- mobile-responsive admin/status pages;
- build/test links back to GitHub;
- logs/observability dashboards with least-privilege access;
- one-click rollback/redeploy paths only when authorization controls are adequate.

## Cloud development environments

Projects may use hosted development/build environments such as GitHub Codespaces, cloud CI runners, provider preview deployments, or project-specific remote environments. Selection is project-specific and must consider free-tier limits, sleeping/expiry behavior, secret handling, region, platform support, and cost before promising “free forever.”

## Phone-specific verification checklist

For applicable apps verify:
- compact and large phone breakpoints;
- safe areas/notches/dynamic islands/cutouts;
- portrait/landscape behavior where supported;
- touch target sizes and gesture conflicts;
- software keyboard/input focus and form scrolling;
- dark/light theme where product supports it;
- offline/poor-network/retry/reconnect behavior;
- cold/warm launch and lifecycle restoration;
- deep links and universal/app links if used;
- permissions denied/limited/revoked states;
- push notifications if used;
- battery, memory, CPU/GPU, and data impact for material flows;
- accessibility text scaling/screen-reader semantics;
- camera/media/file-picker behavior if used;
- at least one representative real device before release claims.

## Delivery evidence to phone

A completion report should provide the smallest useful set of:
- preview URL;
- install/development build link or QR when supported;
- screenshots/video of critical journeys;
- CI/test report link;
- known device limitations;
- rollback or previous stable build reference.
