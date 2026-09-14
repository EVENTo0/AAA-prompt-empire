# Baseline Catch-up Audit — Wave 2

Date: 2026-08-11
Scope: Claude Code/Claude Platform, Hostinger, n8n, Zapier, Stripe, Tap Payments, preview/deployment tooling, CI/CD and software-supply-chain security.

## Claude Code / Claude Platform
Status: URGENT UPDATE POLICY + CAPABILITY EXPANSION
Verified official evidence:
- Claude Code changelog shows 2.1.226 on 2026-08-08. Version 2.1.223 fixed a Bash permission-check bypass, invisible-Unicode/tab permission-display bypass, workflow dynamic-import sandbox escape, and an org-policy bypass for agent definitions. 2.1.224 added self-hosted environments, SHA-256-pinnable archive plugins, stronger sandbox credential masking and cross-session messaging; 2.1.225 added workspace trust to `claude agents` and gateway spend-limit awareness.
- Current Claude Code docs recommend the native install; native installs auto-update. Homebrew exposes `claude-code` stable and `claude-code@latest` latest channels. Claude Code now spans terminal, IDE, desktop, web/mobile, Remote Control, skills/hooks, agent teams, background agents, CI/CD and scheduled routines.
- Claude Platform release notes: Managed Agents gained session budgets, advisor models, inference geography and GitHub-loaded `.claude/skills` on 2026-08-07. Legacy Workbench and experimental prompt-tool APIs are scheduled to end 2026-08-17. Claude Opus 4.1 was retired 2026-08-05.
Official sources:
- https://code.claude.com/docs/en/changelog
- https://code.claude.com/docs/en/overview
- https://platform.claude.com/docs/en/release-notes/overview
Repository implication:
- Add Claude Code version/security preflight before trusted automation. Treat versions predating the security fixes as upgrade-required when relevant.
- Never use `--dangerously-skip-permissions` as a default; workspace trust and sandbox restrictions remain required.
- Extend model-lifecycle beyond Codex to Claude model retirement and surface-specific capabilities.
- Keep Managed Agents as an Empire evaluation target; do not couple Core to it yet.
- Inventory any dependency on legacy Workbench/prompt-tool APIs before 2026-08-17.
Action: urgent-upgrade/correction + agent-harness-adapter evidence + model-lifecycle extension.

## Hostinger
Status: PASS / WORKFLOW UPGRADE
Verified official evidence: 2026 Hostinger updates add Node.js hosting support for NestJS and Nuxt with automatic framework detection, build settings, deployment logs and AI-assisted build failure analysis. Hostinger documents GitHub repository import with automatic redeployments for Node.js Codex-built apps, alongside ZIP deployment. VPS Docker Manager exposes a broad template catalog.
Official sources:
- https://www.hostinger.com/blog/product-updates-2026/
- https://www.hostinger.com/tutorials/how-to-deploy-a-codex-built-app
Repository implication: add Hostinger as a governed deployment adapter for suitable Node.js workloads, preferring Git-connected repeatable deployment over one-off ZIP for maintained projects. Require env-var configuration, build/test evidence, vulnerability monitoring and rollback/previous-release strategy. Do not treat Hostinger as interchangeable with Vercel for every workload.
Action: workflow-change; no Core architecture change.

## n8n
Status: UPGRADE AUDIT REQUIRED
Verified official evidence:
- From n8n v2.6.4, `N8N_EXTERNAL_STORAGE_S3_BUCKET_REGION` accepts only alphanumeric characters and hyphens; invalid older values can prevent startup. n8n recommends upgrading main/worker/runner components to the same version simultaneously.
- n8n provides a built-in security audit (`n8n audit` / API) covering credentials, database expressions, filesystem access, risky/community/custom nodes, unprotected webhooks, missing security settings and outdated instances.
- Source-control environments are Business/Enterprise features; n8n recommends one-direction content flow and warns against pushing/pulling to the same instance. Protected production instances and PR-based multi-branch promotion reduce accidental production changes.
- Current docs include instance-level MCP, AI evaluations, human-in-the-loop tool calls, SSRF protection and task-runner hardening.
Official sources:
- https://docs.n8n.io/hosting/scaling/external-storage/
- https://docs.n8n.io/hosting/securing/security-audit/
- https://docs.n8n.io/source-control-environments/create-environments/
- https://docs.n8n.io/
Repository implication: create n8n pre-upgrade preflight, run security audit on self-hosted/managed instances where accessible, prohibit direct bidirectional production Git sync, and govern MCP/tool exposure through the capability broker.
Action: new skill/eval + workflow/security correction.

## Zapier
Status: BREAKING CLI CORRECTION + MCP/SDK WATCH
Verified official evidence:
- Zapier Platform v19.0.0 (2026-05-18) removed the old `zapier` executable; `zapier-platform` is required.
- Platform v18 moved to Node.js 22 and introduced other breaking changes; user migrations are blocked across semantic major versions.
- v18.6.0 added auth-template/auth-render inspection commands. Zapier MCP provides explicitly selected app actions to MCP clients with action history; Zapier SDK is currently documented as open beta.
Official sources:
- https://docs.zapier.com/integrations/news/2026/v19.0.0
- https://docs.zapier.com/integrations/news/2025/v18.0.0
- https://docs.zapier.com/integrations/news/2026/migrations-same-major-version
- https://docs.zapier.com/mcp/quickstart
- https://docs.zapier.com/sdk
Repository implication: replace stale `zapier` CLI assumptions with `zapier-platform`; require major-version-aware migration planning. MCP/SDK remain behind capability-broker least privilege, explicit action allowlists and audit history. SDK open beta is scouting, not production default.
Action: urgent correction + capability-broker eval.

## Stripe
Status: UPGRADE DISCIPLINE REQUIRED
Verified official installed Stripe guidance: latest API family in the installed official upgrade skill is `2026-06-24.dahlia`. Stripe major API families can contain breaking changes; monthly releases inside a major are intended to be backward-compatible. SDK/API pairing differs for dynamically vs strongly typed languages. Explicit API-version selection, webhook-version awareness and test-mode validation are required before promotion.
Official source: https://docs.stripe.com/changelog
Repository implication: strengthen payment integration skill with current-version detection, changelog diff, SDK/API pairing, webhook contract tests, idempotency, test-mode E2E and rollback. Never upgrade the account/API version solely because a newer family exists.
Action: skill correction/eval; no payment architecture replacement.

## Tap Payments
Status: SECURITY CONTRACT PASS / NEEDS TEST FIXTURES
Verified official evidence: Tap separates Test and Live API keys; secret keys use bearer authentication and must remain server-side. Tap recommends `reference.idempotent` for duplicate-charge handling, `post.url` webhooks, webhook hashstring verification, and server-side Retrieve Charge verification at redirect. Production readiness includes sandbox/production testing and live transaction checks per payment method/channel.
Official sources:
- https://developers.tap.company/reference/api-endpoint
- https://developers.tap.company/docs/recommendations-best-practices
- https://developers.tap.company/docs/webhook
- https://developers.tap.company/docs/get-started
Repository implication: browser redirect is never authoritative payment proof. Require hash verification, retrieve-charge verification, idempotency, secret separation, retry-safe handlers and a payment ledger before fulfillment.
Action: payment-security eval + workflow guard.

## Preview / Build / Deployment tooling
Status: PASS / UPGRADE WORKFLOW
Verified official Vercel evidence:
- Native Deployment Checks can run lint/typecheck on deployments and can be required before production.
- GitHub Actions can block Vercel production promotion until selected checks pass.
- `vercel deploy --dry` (CLI 54.17.2+) can expose framework detection and exact deployment file manifests without uploading code, including JSON output for agents.
- Active PR branch preview deployments are preserved by deployment-retention policies; dashboard deployment scanning has improved for mobile.
Official sources:
- https://vercel.com/changelog/native-deployment-checks
- https://vercel.com/changelog/block-vercel-deployment-promotions-with-github-actions
- https://vercel.com/changelog/dry-run-deployments-with-vercel-cli
- https://vercel.com/changelog/deployment-retention-policies-now-preserve-active-branch-deployments
Repository implication: add pre-deploy dry-run/manifest inspection where Vercel is used; make lint/typecheck/test/security gates required for promotion; keep phone-first preview URLs but separate preview acceptance from production release.
Action: CI/deployment workflow improvement.

## CI/CD and software-supply-chain security
Status: HIGH PRIORITY
Verified official GitHub guidance: GitHub artifact attestations establish build provenance and can include SBOM attestations; consumers must verify attestations for them to provide security value. GitHub recommends OIDC for short-lived cloud authentication, reusable workflows and hardened build systems; artifact attestations can support SLSA Build Level 3 patterns.
Official sources:
- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
- https://docs.github.com/en/actions/how-tos/secure-your-work
- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/increase-security-rating
Repository implication: add a supply-chain provenance gate for releasable binaries/images/packages: least-privilege Actions permissions, OIDC where supported, SBOM/provenance generation, attestation verification before release, and retained test/security evidence. Availability differs by repository visibility/plan, so capability detection is required.
Action: new skill/eval + release workflow change.

## Wave-2 conclusion
Immediate corrections: Claude Code security/version preflight, Zapier v19 CLI migration, n8n upgrade/security preflight. High-value workflow upgrades: Hostinger Git deployment adapter, Vercel dry-run + required deployment checks, Stripe/Tap payment contract tests, GitHub provenance/SBOM/OIDC gate. No Core promotion yet. Managed Agents, Zapier SDK beta and other provider-specific runtime capabilities remain Empire-only until representative validation.
