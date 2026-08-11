# Skill: supply-chain-provenance

## Purpose
Raise confidence in binaries, packages, containers and mobile/web release artifacts produced by Empire CI/CD.

## Gate
For releasable artifacts, where platform/plan support allows:
1. Build from an identified commit/ref in a controlled workflow.
2. Use least-privilege workflow permissions and protected environments.
3. Prefer OIDC/short-lived federation over long-lived cloud credentials.
4. Produce test/security evidence and dependency inventory/SBOM when appropriate.
5. Produce build provenance/artifact attestation.
6. Verify the attestation before release or consumption; generation alone is not sufficient.
7. Record artifact digest, workflow/run, commit SHA, environment, signer/trust root and verification result.
8. Define revocation/deletion behavior when an artifact should no longer be trusted.

## Capability detection
Artifact attestation availability can vary by repository visibility and plan. If unsupported, emit VERIFY_REQUIRED or use an approved alternative signing/provenance mechanism rather than claiming equivalent protection.

## Mobile-first note
Preview/installability and production distribution remain separate gates. Device acceptance evidence does not replace signing, provenance, store/distribution or release checks.
