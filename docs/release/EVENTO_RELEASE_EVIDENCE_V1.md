# EVENTO Release Evidence v1

This document is the final evidence boundary for the current EVENTO control-plane implementation.

## What is proven

The control plane has reproducible development artifacts for Windows and Android, and the full CI set was green at source head `fc7b82b5b8ca08fda28579e46b48f300524618b9`.

- Windows artifact: `evento-desktop-windows`, workflow run `37217500135`, artifact `11308374301`, SHA-256 `9b924f83b078036a8a9fb0151cf54190de43aab8c1dbc05ddf8571b7dc5c37ec`.
- Android artifact: `evento-admin-android-debug`, workflow run `37217500137`, artifact `11308464763`, SHA-256 `d2bb6227bde3aa2b0718339de5ca7c044fbaa1f9222838dc69751b087574ec2f`.

## What these artifacts are not

They are not release evidence.

The Windows installers are not code-signed. The Android artifact is a debug APK, not a release-signed APK/AAB. Neither artifact may satisfy `signed_artifact_evidence` in `registry/evento-release-contracts.json`.

## Current release posture

Release remains fail-closed:

- global `policy.release=false`;
- every project has `release_enabled=false`;
- Android and desktop signing evidence is false;
- signed artifact evidence is false;
- release channels are unset.

## Final-review rule

A development artifact can prove that the build lane works. It cannot authorize release. Any later release must provide new signed-artifact evidence and pass the separate Release Readiness and Release Approval contracts.

PR #28 can be reviewed for merge as a control-plane implementation while Production Release remains disabled.
