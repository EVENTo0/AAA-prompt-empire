# Skill: evidence-freshness-gate

Use for consequential claims containing latest/current/supported/recommended/default/deprecated.

## Gate
A consequential engineering claim must carry:
- verified_at
- primary/official source
- platform/product/version or channel
- applicability surface (API, CLI, IDE, hosted, self-hosted, OS, auth mode as relevant)

If evidence is missing, conflicting, or older than the platform-specific review TTL, return `VERIFY_REQUIRED`; do not silently use the claim as architecture truth.

Security advisories, deprecations, model sunsets, SDK/runtime support and release-channel transitions receive the shortest TTL and must be reverified before production-impacting decisions.

Never treat absence of a weekly announcement as evidence that existing guidance is current. Platforms without a completed baseline require catch-up audit first.
