# EVENTO Release Channel Contract v1

Release channel readiness is separate from Release Readiness, Release Handoff Package, and Release Seal.

## Rule

A sealed package is not publishable until its external channel is explicitly configured and verified.

### Web
Requires a verified stable/publish channel binding.

### Android
Requires a verified Google Play application/channel binding plus signed artifact evidence.

### Desktop
Requires a verified distribution channel plus signed installer evidence.

## Current policy

All external channels are disabled and unverified. This contract is readiness-only and cannot execute release publication.
