# AAA+ Empire Mobile Control Plane

Phone-first PWA command center for EVENTO and AAA+ Engineering Empire operations.

## Vertical slice in v0.1

- Authenticated PWA shell with 12-hour HttpOnly signed sessions.
- GitHub repository scope: repository metadata, open PRs, Codex/Claude agent counts, recent Actions runs and evidence links.
- Safe write lane: re-run failed CI and dispatch allowlisted Android/iOS/preview workflows; all writes are disabled by default.
- Vercel deployment aggregation with direct preview URLs.
- Supabase Management API project + service health monitoring.
- EVENTO sale-ready project catalog adapter through a server-side JSON endpoint.
- Offline shell with explicit stale-data warning; API responses are never cached by the service worker.
- Mobile-first bottom navigation, safe-area spacing, 44px controls and reduced-motion support.

## Security model

The app never sends provider tokens to the browser. `GITHUB_TOKEN`, `VERCEL_TOKEN`, `SUPABASE_ACCESS_TOKEN`, deploy hooks and catalog tokens are server-only environment secrets. Operator access uses `CONTROL_PLANE_ACCESS_KEY` and a separate HMAC session secret. Both must be at least 24 characters; production should use high-entropy random values.

Write actions require all of the following: a valid operator session, `CONTROL_PLANE_ENABLE_WRITES=true`, an allowlisted repository/workflow/project, and an exact per-request confirmation token. Keep writes disabled until read-only operation is verified.

For internet-facing production, add a second identity boundary (for example Vercel deployment protection, an identity-aware proxy, or a future passkey/OIDC lane). Do not treat a shared operator key as the final enterprise IAM model.

## Provider setup

Copy `.env.example` into your hosting secret manager. Start with GitHub read-only. Add Vercel, Supabase and EVENTO catalog connectors independently; one failed provider degrades its section without taking down the whole dashboard.

The GitHub token should be fine-grained and scoped only to the repositories shown in `CONTROL_PLANE_REPOSITORIES`. Grant Actions write permission only if you enable write actions.

Supabase health uses the Management API (`/v1/projects` and `/v1/projects/{ref}/health`) with a server-only PAT. The app intentionally does not use a service-role database key.

## Android / iOS builds

The Control Plane dispatches existing GitHub Actions workflow files named in `CONTROL_PLANE_ALLOWED_WORKFLOWS`. Add `android.yml` and `ios.yml` to the target product repository when those build lanes exist. iOS signing/build execution must run on suitable macOS infrastructure; the phone receives status and artifact/URL evidence rather than pretending Xcode is unnecessary.

## Local verification

```bash
npm install
npm run test:contracts
npm run build
npm run dev
```

Then open the local URL, sign in, test loading/error/offline states, and verify on a representative physical phone before release.

## Deployment

Deploy this folder as a standalone Next.js application on Vercel or another Node-compatible host. On Vercel, set the Root Directory to `apps/mobile-control-plane` and add secrets per environment. Prefer a protected preview first, then production only after read-only provider verification and security review.
