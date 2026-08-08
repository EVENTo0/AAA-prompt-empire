# AAA+ Mobile Development Loop

Status: v2.3 reusable operating capability  
Owner: AAA+ Engineering Empire  
Primary operator model: phone-first

## Objective

Make a phone the normal command, review, install, and QA surface while cloud/native infrastructure performs build tasks that genuinely require desktop or hosted toolchains.

The reusable loop is:

`phone request → agent/Codex/Claude → GitHub branch/PR → CI/tests → build → artifact/distribution → physical phone test → evidence/feedback → next slice`

## Four channels

### 1. Instant Preview
Use a secure branch/PR web or PWA preview when the product exposes a browser surface. This is the fastest UI/product feedback channel but is not proof of native behavior.

### 2. Dev Artifact
Build a branch/PR APK or equivalent artifact for engineering testing. Link the artifact to its source SHA and retain it long enough to reproduce reported bugs.

### 3. Beta Distribution
Use an approved tester-distribution provider such as Firebase App Distribution, Play internal testing, TestFlight, or another project-approved service. Distribution credentials and tester data must remain outside source control.

### 4. Production
Use protected release environments and explicit approvals for store publication, production signing, destructive migrations, and irreversible release operations.

## Android / Flutter reference path

For a Flutter product that selects this path:

1. audit existing Flutter version management, package id, flavors and current CI;
2. preserve the repository's chosen Flutter version/setup mechanism;
3. restore dependencies from the committed lockfile;
4. run `flutter analyze`;
5. run `flutter test` plus project-specific integration/device checks;
6. build the channel-appropriate APK/AAB;
7. store the artifact with source/version metadata;
8. optionally distribute the verified artifact through the selected beta provider;
9. install/update on a representative Android phone;
10. record device/OS/build/source/critical-journey evidence.

Do not place signing stores, signing passwords, Firebase service credentials, reusable CLI tokens, or tester PII in the repository.

## Firebase App Distribution adapter

Firebase App Distribution is an optional distribution adapter, not an Empire dependency. When selected:

- register the exact product package/bundle identity required by the platform;
- authenticate CI using protected credentials appropriate to the current supported Firebase tooling;
- distribute only a verified artifact;
- use tester groups rather than hard-coding personal addresses into workflows when practical;
- include source revision and release notes;
- track distribution retention/expiry and tester acceptance/download evidence where useful.

Current Firebase documentation should be re-verified when adapting this lane because CLI/auth/distribution capabilities can change.

## Firebase Studio is not the long-term foundation

As verified from Google documentation in August 2026, new Firebase Studio workspace creation/user signup has been disabled since 22 June 2026 and Firebase Studio is scheduled to sunset on 22 March 2027. Existing workspaces may be transitional tools only. Do not design Empire's permanent mobile workflow around Firebase Studio.

## Native toolchain truth

A phone-first workflow does not claim Android Studio/Xcode are unnecessary. Use Android Studio-compatible builds/emulators/profiling and Xcode/macOS signing/archive infrastructure when required; return build/install/test evidence to the phone.

## EVENTO adoption contract

EVENTO should consume this loop from its own product repository once that source repository is available to Empire. Empire owns the reusable skill, routing, templates and Control Plane visibility only.

EVENTO-specific items stay product-local:

- package/bundle identifiers;
- Flutter source and app assets;
- Firebase/Play/App Store configuration;
- signing credentials;
- tester groups/identities;
- customer/project data;
- production release approvals.

## Acceptance evidence

A mobile beta should not be called ready until applicable evidence includes:

- source commit/PR;
- CI checks;
- artifact type/version/channel;
- install/distribution reference;
- physical device + OS/API version;
- tested critical journey;
- PASS/FAIL/BLOCKED result;
- known limitations;
- rollback/update path.

## Refresh triggers

Re-verify the workflow when Flutter, Android/iOS store requirements, signing rules, Firebase distribution tooling, GitHub Actions, tester-distribution terms/retention, or the project's selected build service materially changes.
