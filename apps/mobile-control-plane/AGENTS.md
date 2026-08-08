# Mobile Control Plane — Local Agent Contract

This app is the phone-first operator surface for AAA+ Engineering Empire and EVENTO projects.

## Product rules
- Optimize for one-handed mobile use first, desktop second.
- Every status must link back to source evidence when possible (repository, PR, run, deployment, preview).
- Distinguish live, degraded, blocked, and demo/unconfigured states. Never fabricate healthy status.
- Privileged actions must be explicit, allowlisted, authenticated, auditable, and disabled by default.
- Do not expose provider tokens, deployment hooks, signing material, Supabase PATs, or service-role credentials to the browser.
- Prefer read-only aggregation by default; mutations require `CONTROL_PLANE_ENABLE_WRITES=true` and per-action confirmation.

## Engineering rules
- Keep provider adapters server-only under `lib/`.
- Use native `fetch` for provider APIs unless a maintained SDK materially improves correctness.
- Add provider failures as degraded cards, not whole-dashboard failures.
- Maintain WCAG-friendly contrast, touch targets >=44px, reduced-motion support, safe-area padding, loading/error/empty/offline states.
- PWA must remain useful as a cached shell while offline, but live infrastructure data must never be presented as current when offline.
