# EVENTO Release Contract v1

Release is a separate authority from build, merge, deploy, production promotion, and rollback.

## Invariants

- Release is default-deny.
- No build, merge, production deploy, preview acceptance, or production verification implies release authority.
- Release requires a project-specific contract and explicit release evidence.
- Android release requires signed AAB/APK evidence.
- Desktop release requires signed MSI/NSIS evidence.
- Web release requires a production-verified task plus explicit release approval.
- Release signing material is never stored in prompts, Git history, screenshots, task issues, or evidence comments.
- No automatic release is enabled in v1.

## Contracts

### web-production
Requires:
- task state PRODUCTION-VERIFIED;
- release-enabled policy;
- explicit release approval;
- provider/project binding still valid.

### android-store
Requires:
- signed AAB or APK evidence;
- signing evidence;
- release-enabled policy;
- explicit release approval;
- store/channel configuration.

### desktop-installer
Requires:
- signed MSI or NSIS evidence;
- signing evidence;
- checksum/evidence pack;
- release-enabled policy;
- explicit release approval.

## Current policy

All release contracts are disabled. Current output is readiness/blocker evidence only.
