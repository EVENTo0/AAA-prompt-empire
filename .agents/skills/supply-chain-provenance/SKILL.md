---
name: supply-chain-provenance
description: Add provenance, SBOM, least-privilege CI, OIDC, attestation generation, verification, trusted-source update policy, and revocation evidence to releasable Empire artifacts where platform support allows.
---

# Supply Chain Provenance

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

## GitHub Actions execution security
- Treat `pull_request_target` as privileged and deny it by default in Empire workflows. Any exception requires explicit security review/ADR and must not execute untrusted PR code with elevated token/secrets.
- Review `workflow_dispatch` and other manual/privileged triggers against repository or organization Workflow Execution Protections where available; use evaluate/shadow mode before enforcement if needed.
- Prefer built-in `GITHUB_TOKEN` with minimum permissions for GitHub-native agentic workflows instead of long-lived PATs when supported.
- Keep checkout credentials non-persistent unless a reviewed write workflow explicitly requires them.
- For self-hosted runners, verify the current GitHub minimum/runtime version and freshness before relying on them. Unknown runner freshness is `VERIFY_REQUIRED`, not PASS.
- Do not bypass GitHub's held-workflow approval protections for potentially malicious public-repository workflows merely to make CI run faster.
- Track supported major versions of first-party setup/checkout Actions and upgrade through CI evidence rather than leaving deprecated Node runtimes implicit.

## GitHub transport compatibility gate
- GitHub disables SHA-1 use in HTTPS/TLS for github.com and partner CDNs on 2026-09-15.
- Before that date, verify Git clients, API libraries, OS trust/TLS stacks, proxies and automation runners can negotiate modern HTTPS algorithms. Use a current Git/runtime stack; stale compatibility is `FAIL` for release-critical paths once the deadline is reached.
- Do not confuse Git object hash migration concerns with this HTTPS/TLS certificate/signature compatibility gate.

## Marketplace/plugin update policy
- Automated plugin/community-node/marketplace updates are permitted only for explicitly allowlisted trusted sources with a recorded owner, origin, version and provenance/checksum evidence where available.
- Unknown publishers, arbitrary marketplace search results, renamed packages, source changes or missing provenance must return `VERIFY_REQUIRED` and block unattended update/install.
- Security-critical updates from allowlisted sources may use an expedited path, but they still require post-update compatibility and rollback evidence.

## Capability detection
Artifact attestation availability can vary by repository visibility and plan. If unsupported, emit VERIFY_REQUIRED or use an approved alternative signing/provenance mechanism rather than claiming equivalent protection.

## Mobile-first note
Preview/installability and production distribution remain separate gates. Device acceptance evidence does not replace signing, provenance, store/distribution or release checks.
