# AAA+ Empire Mobile Control Plane — Architecture Decision

Status: Accepted for v0.1 vertical slice  
Date: 2026-08-08

## Decision

Build the operator console as a standalone Next.js App Router PWA under `apps/mobile-control-plane`. The browser receives normalized status models only. Provider credentials and privileged mutations remain server-side.

## Boundaries

- **Browser/PWA:** mobile UI, refresh, installability, offline shell, safe command requests.
- **Control Plane server:** session validation, provider aggregation, allowlists, action policy, normalization, timeouts.
- **Providers:** GitHub Actions/PRs/repos/agents, Vercel deployments/previews, Supabase Management API health, EVENTO catalog endpoint.
- **Native builds:** surfaced as GitHub workflow runs/artifacts; Android/iOS build workflows remain source-controlled per project.

## Security posture

1. No provider token may use a `NEXT_PUBLIC_` variable.
2. Runtime provider credentials are environment secrets only.
3. Repository scope and workflow names are explicit allowlists.
4. Write operations are disabled unless `CONTROL_PLANE_ENABLE_WRITES=true`.
5. Every write request is authenticated, same-origin constrained, and requires explicit action confirmation.
6. Service worker never caches `/api` responses or authenticated dashboard pages.
7. Production deployment should add an upstream identity/access layer before broad use.

## Availability model

Provider failures degrade independently. The dashboard must remain usable when one provider is unavailable and must never present stale/offline data as live evidence.

## Evolution path

v0.2 should add passkey/OIDC auth, persistent audit events, normalized project registry, artifact download/install links, richer logs, and dedicated Android/iOS build contracts. v1 should add role-based approval policies and EVENTO order-to-build automation.
