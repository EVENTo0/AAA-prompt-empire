---
name: cloud-preview-phone
description: Create the fastest secure cloud/remote preview, build, test, and management path that can be inspected from a phone. Use when the operator needs to develop, review, simulate, or approve work primarily from mobile.
---

# Cloud Preview & Phone Workflow

1. Determine the smallest truthful feedback artifact: responsive preview URL, PWA, development client, internal mobile build, device-streaming session, remote emulator/simulator, game/web stream, or hosted environment.
2. Prefer branch/PR-scoped ephemeral previews over editing production.
3. Protect non-public previews with suitable authentication and avoid exposing production data/secrets.
4. Where native toolchains are required, run them on secure cloud/remote hosts and return install/build/test evidence to the phone.
5. Link preview/build status back to the source commit/PR so the operator can identify exactly what is being tested.
6. Make admin/status views usable on small screens; expose logs/health/test summaries without granting excessive production access.
7. Verify current free-tier/quota/sleep/expiry/egress constraints before describing a service as free or persistent.
8. Provide fallback paths when QR/deep-link/device install methods are unavailable.

Deliver: phone-accessible URL/build/session, source revision, test credentials strategy if needed, expiry/cost limits, and rollback/cleanup instructions.
