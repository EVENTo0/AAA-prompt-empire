# Wave 5 — Retirement & Compatibility Guard

Checked: 2026-08-31
Scope: AAA-prompt-empire only
Core promotion: BLOCKED
PR: #18

## Decision
The next Empire wave prioritizes lifecycle expiry, deadline enforcement and compatibility failure over adding more model capability. The primary risk is selecting interfaces, models or platforms that are already deprecated, scheduled to retire, or incompatible with current toolchains.

## Approved changes
1. **Codex transport — URGENT:** reject new use of `codex mcp-server`; migrate new integrations to Codex app server. Existing usage is migration-only.
2. **GitHub Copilot model lifecycle — URGENT:** register the 2026-09-01 Copilot retirements and supported fallbacks; reject new pins to scheduled-retirement models. Also track MAI-Code-1-Flash retirement on 2026-09-10.
3. **GitHub Spark retirement — URGENT:** reject Spark as a new platform. Existing deployed-app continuity does not make Spark valid for new architecture.
4. **Supabase logs deadline:** direct `logs.all` callers are `MIGRATION_REQUIRED` before 2026-09-23 and `FAIL` on/after 2026-09-23.
5. **GitHub transport security:** require modern TLS compatibility before SHA-1 is disabled for GitHub HTTPS/CDNs on 2026-09-15.
6. **Android upgrade scout:** add Android Studio Quail 3 compatibility plus the three-year AGP support age window.
7. **Hostinger Reach:** add as an optional capability-broker adapter through public API / Hostinger n8n node / connector surfaces. It is not an Empire Agent.
8. **Supply-chain refinement:** automated marketplace/plugin/community-node update is limited to allowlisted trusted sources with origin/version/provenance evidence.
9. **WordPress 7.1:** test Block API v2-or-lower blocks inside the always-iframed post editor; do not rely on the WordPress 7.0 non-iframe fallback. Prefer API v3 after successful migration testing.
10. **No Core promotion:** Provider Live Parity remains the final proof gate. Static CI/evals do not authorize Core mutation.

## Official evidence used
- OpenAI release notes: Codex `mcp-server` command deprecated on 2026-08-24; use Codex app server.
- GitHub Copilot model documentation/changelog: September 1 retirements and alternatives; MAI-Code-1-Flash scheduled for September 10.
- GitHub Spark changelog: no new users/apps from 2026-08-04; existing workbench access through 2026-08-31; deployed apps can continue.
- Supabase changelog: `logs.all` removed on 2026-09-23; replacement is ClickHouse-backed `logs` endpoint.
- GitHub changelog: SHA-1 in HTTPS/TLS fully disabled on 2026-09-15.
- Android Developers: Quail 3 supports AGP 7.1–9.3 and Android Studio now enforces an approximately three-year AGP support window.
- Hostinger Week 35 / Reach docs: Reach public API and 30+ n8n/API actions are available.
- WordPress Block Editor docs: WordPress 7.1 always uses the iframe post editor; API v2-or-lower blocks must work correctly inside it.

## Governance
- Empire branch/Draft PR only.
- No self-approval.
- No automatic cross-repository mutation.
- No automatic Core promotion.
- Provider Live Parity PASS + separate owner approval are required before any Core proposal.
