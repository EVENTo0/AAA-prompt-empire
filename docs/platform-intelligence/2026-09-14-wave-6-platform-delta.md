# Wave 6 — Bounded Platform Delta

Checked: 2026-09-14
Scope: `EVENTo0/AAA-prompt-empire` PR #18 only
Core promotion: BLOCKED
Portfolio Registry PR #26: separate and untouched

## Decision

Wave 6 updates existing Platform Intelligence, supply-chain, automation-upgrade and secure-execution controls. It creates no Agent and no Skill. OpenAI Agents API and the Vercel Agent Stack are optional experimental runtime backends behind the existing provider-neutral harness; neither is an Empire or Core dependency.

## GitHub SHA-1/TLS compatibility preflight

Status: PARTIALLY VERIFIED.

- The current execution client (`git 2.51.1`, libcurl `8.5.0`, OpenSSL `3.0.13`) completed `git ls-remote` over HTTPS against this repository and returned the expected `main` HEAD.
- Repository workflows use GitHub-hosted `ubuntu-latest`; no self-hosted runner reference or `pull_request_target` trigger was found.
- Direct `curl`, `github.dev` and `openssl s_client` probes were blocked by the managed environment's outbound proxy timeout. They are not PASS evidence and are recorded as a limitation, not interpreted as TLS incompatibility.
- Git's `default-hash: sha1` describes Git object identifiers and is not the retiring HTTPS/TLS signature algorithm.
- Remaining release-critical clients—owner workstation, any corporate proxy/firewall, third-party automation and each actual runner image—must run the live preflight before/after the 2026-09-15 cutoff. Unknown or stale paths fail closed for release use.

Rollback: documentation/eval-only result; no system TLS configuration was changed.

## Platform changes

1. GitHub Actions `cache-mode` is GA. Select `read`, `write`, `write-only` or `none` at the narrowest scope; untrusted code does not receive write access by convenience.
2. GitHub's `require_secret_scanning_alert_resolution` ruleset can block PR merge when introduced secret alerts remain open. This is external repository state and requires plan/setting evidence.
3. CodeQL 2.27.0 is recorded as the 2026-09-09 current lifecycle point. GitHub.com managed rollout and GHES/manual CLI upgrade paths remain distinct; no permanent version pin is created.
4. Claude plugin enablement/update now requires source, exact version/checksum, hooks/MCP/tools, network/secrets/filesystem access, safe-mode reproduction, compatibility and rollback evaluation.
5. Xcode 27 RC was superseded today: Xcode 27 (27A266a) is stable as of 2026-09-14. Stable status allows evaluation but does not prove product readiness.
6. Android Studio Quail 4 (2026.1.4), not Quail 3, is current stable. Project AGP/JDK/SDK compatibility still needs build/test/rollback proof.
7. Supabase `logs.all` remains a hard 2026-09-23 deadline: `MIGRATION_REQUIRED` before; `FAIL` on/after for direct release dependencies.
8. Secure sandbox evidence now requires explicit execution region, data-residency requirement and failover behavior. Unknown placement is `VERIFY_REQUIRED`; silent failover across an approved boundary is prohibited.

## Official sources

- GitHub SHA-1 HTTPS/TLS retirement: https://github.blog/changelog/2026-04-20-sunsetting-sha-1-in-https-on-github/
- GitHub Actions cache-mode: https://github.blog/changelog/2026-09-10-control-github-actions-cache-access-with-cache-mode/
- GitHub secret-alert merge rule: https://github.blog/changelog/2026-09-09-block-pull-requests-with-exposed-secrets-from-merging/
- CodeQL 2.27.0: https://github.blog/changelog/2026-09-09-codeql-2-27-0-adds-support-for-linux-arm64/
- OpenAI Agents API: https://openai.com/index/introducing-the-agents-api/
- Vercel Agent Stack: https://vercel.com/blog/agent-stack
- Apple releases: https://developer.apple.com/news/releases/
- Android Studio releases: https://developer.android.com/studio/releases
- Supabase `logs.all`: https://supabase.com/changelog/48235-migration-of-supabase-management-api-logs-all-analytics-endpoint-to-logs-endpoint

## Governance and remaining gate

- No Agent, Skill, deployment, product repository or `AAA-prompt` Core mutation.
- PR #18 stays Draft/Open and separate from PR #26.
- Static/eval proof does not establish Codex↔Claude runtime parity.
- Provider Live Parity PASS and separate owner approval remain mandatory before any Core proposal.
