---
name: mobile-build-distribution
description: Build, sign, distribute, observe, and verify Android/iOS prerelease artifacts through cloud CI with a phone-first tester loop. Use when a mobile project needs repeatable APK/AAB/IPA delivery, tester distribution, build evidence, or release-channel automation.
---

# Mobile Build & Distribution

Use this skill to turn a mobile repository into a repeatable phone-first delivery loop without pretending the phone replaces native toolchains.

1. Detect the existing mobile stack, package/bundle identifiers, build flavors, signing model, CI provider, distribution provider, and release channels before editing.
2. Preserve existing workflows. Add the smallest reusable lane required: static analysis → tests → platform build → artifact retention → optional tester distribution → evidence.
3. Keep signing keys, service-account credentials, API tokens, provisioning data, certificates, and tester PII in protected secret stores only. Never commit them or expose them to client code.
4. Default to branch/PR builds and non-production channels. Production signing/store publication requires explicit protected approval.
5. For Flutter projects, run the repository-supported Flutter setup and package manager commands before `flutter analyze`, `flutter test`, and platform builds. Do not guess versions; use pinned project/toolchain definitions where present.
6. For Android, produce APK for direct-device testing when appropriate and AAB for Play-oriented flows. Verify package name/signing compatibility with the chosen distribution target before upload.
7. For iOS, route signing/archive/export to macOS infrastructure. Do not claim iOS readiness without Xcode-compatible build evidence and valid signing/provisioning.
8. Support provider adapters such as Firebase App Distribution, Play internal testing, TestFlight, GitHub artifacts, or other approved distribution systems. Keep the workflow provider-neutral until a project explicitly selects one.
9. Every delivered build must link to source revision, workflow run, build flavor/channel, artifact/distribution reference, and verification status.
10. Treat a successful upload as distribution evidence, not product correctness. Require device acceptance evidence for the critical journey before calling a beta ready.
11. Maintain four conceptual channels where useful: instant preview, dev artifact, beta distribution, production release. Projects may collapse channels only when risk justifies it.
12. Record retention/expiry constraints of build artifacts and tester distributions so the operator knows when links stop working.

## Phone-first operating loop

Operator request → branch/PR → cloud checks → build artifact → tester distribution/secure artifact → phone install/update → physical-device feedback → issue/fix → new build.

## Deliverables

Return:
- source commit/PR;
- build/test commands and results;
- artifact type and channel;
- distribution/install path suitable for a phone when configured;
- tested device/OS evidence;
- signing/secrets posture;
- expiry/cost constraints;
- blockers and rollback/recovery path.
