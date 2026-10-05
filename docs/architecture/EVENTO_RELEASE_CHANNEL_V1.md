# EVENTO Release Channel Contract v1

Release Channel Readiness is separate from Release Readiness, Release Handoff Package, Release Seal, and the final external release itself.

## Non-negotiable boundary

This stage may prepare and verify the destination channel and may produce signed release-candidate artifacts. It must not publish to Vercel production, Google Play, GitHub Releases, or any other external destination.

The global external-release policy remains deny-by-default until owner approval and channel evidence are complete.

## Channel matrix

### Web — production/release handoff

Target class: `web-production` / Vercel stable production channel.

Readiness requires:
- task/package state already production-verified and release-sealed where applicable;
- the Vercel project/channel binding recorded in `registry/evento-release-channels.json`;
- `binding_verified=true`;
- provider/credential health evidence;
- external-release policy explicitly enabled only at the final release gate.

No production deploy is executed by this PR.

### Android — signed AAB/APK + Play handoff

Target class: `android-store` / Google Play.

The repository now contains a protected manual release-candidate lane that can build:
- signed APK;
- signed AAB;
- signature verification evidence;
- SHA-256 evidence.

Required protected secrets:
- `EVENTO_ANDROID_KEYSTORE_B64`
- `EVENTO_ANDROID_KEYSTORE_PASSWORD`
- `EVENTO_ANDROID_KEY_ALIAS`
- `EVENTO_ANDROID_KEY_PASSWORD`

The lane intentionally performs no Play upload. A Play application/track binding must still be selected and verified before the channel can become ready.

### Desktop — signed MSI/NSIS + release handoff

Target class: `desktop-installer` / GitHub Release or another approved distributor.

The repository now contains a protected manual release-candidate lane that can:
- sign MSI/NSIS artifacts with the configured PFX;
- verify Authenticode signatures;
- generate SHA-256 evidence.

Required protected secrets:
- `EVENTO_WINDOWS_PFX_B64`
- `EVENTO_WINDOWS_PFX_PASSWORD`

The lane intentionally performs no GitHub Release publication. The repository/distributor binding must be verified before the channel can become ready.

## Readiness decision

A channel is READY only when all of the following are true:
1. the release package is sealed;
2. global external-release policy is enabled;
3. the channel type is enabled;
4. the project channel is enabled;
5. `channel_id` is configured;
6. `binding_verified=true`;
7. required signing evidence exists for binary channels;
8. provider/credential health is proven.

Otherwise the result is `RELEASE CHANNEL BLOCKED`.

## Current expected result

Current policy intentionally remains fail-closed:
- `external_release=false`;
- all channel types `enabled=false`;
- all project channels `enabled=false`;
- known destination identifiers may be prebound, but release bindings remain unverified;
- signed release-candidate evidence is not yet recorded.

Therefore the expected state before final signing/binding evidence is **RELEASE CHANNEL BLOCKED**.

This is correct and must not be interpreted as a failure of the readiness architecture. It is the guard that prevents an unsigned or unbound artifact from being published.

## Prebound destination identifiers

The readiness registry may record a destination identifier before the external binding is verified. This is configuration, not release authority.

Currently prebound:
- `evento-one` → Vercel project `prj_15JeGkRMsh6pvc2OAE902mkAB3Z6` (`evento-one-web`);
- `evento-admin-android` → Android application ID `ae.evento.admin`;
- `aaa-empire` → GitHub repository `EVENTo0/AAA-prompt-empire`.

All three remain `binding_verified=false` for the external release channel until provider/credential and destination evidence is captured.
