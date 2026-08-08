# Mobile Development Loop Template

Purpose: provide a reusable, phone-first development and testing loop for product repositories without forcing one CI/distribution provider.

## Target loop

Phone operator → ChatGPT/Codex/Claude → GitHub branch/PR → cloud checks/build → secure artifact or tester distribution → physical phone install/update → feedback/screenshot → next branch/PR.

## Recommended channels

1. **Instant Preview** — responsive web/PWA preview when the product has a web surface.
2. **Dev Artifact** — branch/PR APK or equivalent artifact for engineering testing.
3. **Beta Distribution** — stable prerelease build delivered to approved testers through Firebase App Distribution, Play internal testing, TestFlight, or another approved provider.
4. **Production** — protected store/release path after QA/security/release approval.

## Flutter Android bootstrap

Copy `flutter-android-beta.yml` into the PRODUCT repository only after auditing its existing CI. The reference workflow intentionally fails until the product-approved Flutter SDK setup is configured; this prevents accidental claims that a generic template is runnable everywhere.

After adapting it, the verified path should normally include:

- pinned/approved Flutter toolchain setup;
- dependency restore from committed lockfile;
- `flutter analyze`;
- `flutter test`;
- release/debug artifact build appropriate to the channel;
- artifact upload with retention;
- optional protected beta distribution;
- release notes containing source revision and verification status.

## Firebase App Distribution adapter

Use Firebase only when the product selects it. Keep Firebase project/app identifiers in non-secret configuration where appropriate and credentials in protected CI environment secrets/OIDC/service credentials. Verify the Android package name exactly matches the registered Firebase app before distribution. Do not commit service-account JSON or reusable CLI tokens.

## Phone acceptance evidence

A beta is not accepted merely because the cloud build succeeded. Record at least:

- physical device model and OS/API version;
- installed build/version/source SHA;
- critical journey tested;
- pass/fail/blocker;
- screenshots/log references when useful;
- rollback/uninstall/update path.

## EVENTO adoption

EVENTO should consume this capability in its own product repository/workflow. Empire supplies the reusable contract/template and Control Plane visibility; it must not own EVENTO signing keys, tester identities, customer data, or production app secrets.
