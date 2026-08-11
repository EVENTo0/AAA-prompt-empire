# Baseline Catch-up Audit — Wave 1

Date: 2026-08-11
Scope: official-source verification for the first high-impact platform set. Status values are intentionally conservative: PASS means current evidence is sufficient for the stated claim; VERIFY_REQUIRED means the platform or repository mapping still needs follow-up before production guidance changes.

## OpenAI / Codex
Status: PARTIAL / VERIFY_REQUIRED
Verified official evidence: Codex supports Goal mode across app/IDE/CLI, browser/developer tooling has expanded, and Codex remains a fast-moving surface. Repository implication: keep model/runtime/tool claims behind the evidence-freshness gate and avoid hard-coding product-surface assumptions. Complete model sunset/current-default verification remains a dedicated follow-up.
Official source: https://help.openai.com/en/articles/6825453-chatgpt-release-notes
Action: model-lifecycle + codex-sunset-eval + surface/auth-aware routing.

## GitHub / Actions / Copilot agents
Status: PASS for governance direction
Verified official evidence: Copilot cloud agent can fix failing Actions from isolated cloud environments; agent secrets/variables have a dedicated scope; Agent Finder discovers tools/resources from controlled registries without silent installation; agent session streaming exists for some enterprise surfaces; usage-based AI billing is active.
Official sources:
- https://github.blog/changelog/2026-05-08-more-flexible-secrets-and-variables-for-copilot-cloud-agent/
- https://github.blog/changelog/2026-06-17-agent-finder-for-github-copilot-now-available/
- https://github.blog/changelog/2026-07-02-copilot-agent-session-streaming-is-now-in-public-preview/
- https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/
Repository implication: capability-broker must separate discovery from installation/execution; agent secrets must not be conflated with Actions secrets; cost governance should include AI credits and Actions consumption.
Action: workflow-change + security/evidence evals.

## Vercel
Status: PASS for architecture correction; ongoing watch required
Verified official/installed guidance: modern Vercel guidance favors Fluid Compute/default Node runtime rather than assuming Edge for streaming; AI Gateway and Sandbox are first-class relevant capabilities; current Vercel platform guidance must be checked before choosing runtime/storage/configuration.
Official source: https://vercel.com/docs
Repository implication: vercel-modern-runtime gate is required; sandbox abstraction and model gateway routing should remain provider-neutral.
Action: skill/eval, not Core architecture rewrite.

## Supabase
Status: URGENT / PASS
Verified official evidence: self-hosted Supabase is changing the default API gateway from Kong to Envoy around the Aug 9-13 release window; custom kong.yml, HTTPS listener assumptions and service/container references can break. Explicit extension version pinning is ignored from 2026-08-05. The Management API logs.all endpoint is scheduled for removal on 2026-09-23.
Official sources:
- https://supabase.com/changelog/48048-self-hosted-supabase-envoy-becomes-the-default-api-gateway-b
- https://supabase.com/changelog?types=breaking-change
Repository implication: hosted projects are not impacted by the gateway change, but self-hosted upgrade automation requires preflight detection and rollback/pinning. API consumers must inventory logs.all usage.
Action: urgent-upgrade-audit + regression fixture.

## Flutter / Dart
Status: PASS / WATCH
Verified official evidence: Flutter 3.44 is the current stable release family in official release notes; documentation reflects later 3.44 patch releases.
Official source: https://docs.flutter.dev/release/release-notes
Repository implication: no architecture migration. Maintain stable-first matrix and verify project-specific package/plugin compatibility before upgrades.
Action: watch + compatibility CI.

## Android Studio / Android
Status: PASS / channel-sensitive
Verified official evidence: Android Studio Quail 3 is presented on the current stable release page, while preview pages may retain channel snapshots from earlier publication dates. Cloud service compatibility is bounded to supported Studio versions; Studio Labs exposes experimental agent/test features without requiring a canary IDE.
Official sources:
- https://developer.android.com/studio/releases
- https://developer.android.com/studio/preview/features
Repository implication: source freshness matters when official pages disagree due to publication timing; stable release page wins for current production selection, while preview docs inform scouting only.
Action: native-toolchain-scout + channel eval.

## Apple / Xcode / iOS / Swift
Status: PASS
Verified official evidence: Xcode 26.6 is the released production line; Xcode 27 remains beta. Xcode 26.6 includes Swift 6.3, Agent Client protocol support, Gemini in coding assistance and MCP-related preview tooling improvements.
Official sources:
- https://developer.apple.com/documentation/xcode-release-notes
- https://developer.apple.com/documentation/xcode-release-notes/xcode-26_6-release-notes
Repository implication: agent interoperability should go through the neutral harness adapter; Xcode 27 must stay scouting-only until stable.
Action: native-toolchain-scout + compatibility matrix.

## WordPress / Gutenberg
Status: URGENT TESTING
Verified official evidence: WordPress 7.1 RC1 shipped 2026-08-05; RC2 is scheduled 2026-08-12; final release is scheduled 2026-08-19. 7.1 includes consequential editor/site-building changes including responsive and pseudo-state styling work.
Official sources:
- https://make.wordpress.org/core/7-1/
- https://make.wordpress.org/core/2026/06/19/roadmap-to-7-1/
Repository implication: Gutenberg-based projects should run staging compatibility before final release, including RTL/Arabic, block themes/patterns, forms, payments, responsive rendering and accessibility.
Action: compatibility CI now; no production upgrade before final + evidence.

## Wave-1 conclusion
No Core promotion yet. Empire gains evidence for: Supabase breaking-change guard, GitHub agent capability broker/security boundaries, Vercel modern runtime gate, native stable/preview separation, and WordPress pre-release compatibility CI. Remaining baseline targets include Claude Code, Hostinger, n8n, Zapier, Stripe, Tap, deployment/preview services, CI/testing/security advisories and additional developer platforms.
