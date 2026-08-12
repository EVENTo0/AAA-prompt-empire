# EVENTO Web — Architecture Decision

Status: Accepted for the v0.1 vertical slice
Date: 2026-08-11

## Decision

Build the EVENTO parent-company surface as a standalone Next.js App Router
application under `apps/evento-web`, serving three things from one codebase:

1. the public company website (bilingual Arabic/English, Arabic default);
2. the installable PWA app shell for that website;
3. client accounts and the request-tracking portal.

The app is independent of the private `EVENTo0/evento-mobile` product and of
the internal `apps/mobile-control-plane` operator console. It shares no code and
no runtime state with either.

## Why this and not the alternatives

| Option | Why not |
| --- | --- |
| Extend `apps/mobile-control-plane` | That console is a private operator tool with provider credentials and write actions. Serving the public internet from the same process would put a marketing site inside a privileged trust boundary. |
| A new native app for the company | `EVENTo0/evento-mobile` already exists and holds the authoritative mobile product. A second native app would fork the product. The PWA covers the installable web surface; the native surface stays where it is. |
| A static site with a form service | Client accounts and per-client request tracking need a session and an authorization boundary, which a static host cannot provide. |

## Boundaries

- **Browser** — rendered pages, the intake form and the auth form. It talks
  only to this app's own `/api` routes. It never holds a provider key, which is
  why the production `connect-src` can stay at `'self'`.
- **App server** — origin checks, validation, throttling, session cookies, and
  all provider calls.
- **Supabase** — authentication and the `project_requests` table. Reached over
  its REST endpoints with `fetch`; no client SDK is used, so the runtime
  dependency surface stays at the framework plus `server-only`.

## Authorization model

Authorization is row level security in the database, not application logic:

- every request to PostgREST carries the **end user's own access token**;
- a service-role key is never configured and never read — a contract test
  fails the build if one is referenced;
- `owner_id` is assigned by a `BEFORE INSERT` trigger from `auth.uid()`, so a
  client cannot claim another client's request by posting an `owner_id`;
- there is no `UPDATE` or `DELETE` policy, so a submitted request cannot be
  altered or removed by a client. Stage transitions are operator actions taken
  outside this application.

## Degradation

When `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` are absent the site still
builds, renders and serves every public page. Accounts show an explicit
"not enabled on this deployment" state and the intake form returns HTTP 503
`not-configured` with an email fallback. The form must never report a stored
request when nothing stored it.

## Session handling

Access and refresh tokens live in `HttpOnly`, `SameSite=Strict` cookies,
`Secure` in production. An expired access token is exchanged for a fresh one
using the refresh cookie on the next server render; a failed exchange clears
both cookies rather than leaving a half-valid session.

## Known limitations

These are real and deliberately not papered over:

1. **Rate limiting is per-instance and best effort.** The counter lives in one
   server's memory. Across multiple instances it does not aggregate.
2. **`x-forwarded-for` is client-controlled unless a trusted proxy overwrites
   it.** Behind Vercel or a similar platform it is set by the platform. If this
   app is ever exposed directly, the header can be spoofed and the limiter
   bypassed. Production must sit behind a proxy that rewrites the header, or
   add an edge/WAF rule.
3. **CSP allows `'unsafe-inline'` for scripts and styles.** The framework's
   inline bootstrap needs it. Moving to a nonce-based policy is the next
   hardening step. `'unsafe-eval'` and websocket origins are development-only
   and are asserted absent from the production policy by a contract test.
4. **Email confirmation behaviour follows the Supabase project's setting.** If
   confirmation is required, signup returns `needsConfirmation` and does not
   create a session.
5. **The account area is excluded from the offline cache** by design, so it is
   unavailable offline rather than showing a stale copy as live.

## Applying the migration

`supabase/migrations/0001_project_requests.sql` is **source-controlled but not
applied**. The EVENTO Supabase project is shared with the EVENTO Mobile
product, so running it is a gated action:

1. review the migration against the live schema;
2. get owner approval;
3. apply to a branch or staging project first and exercise the intake flow;
4. apply to production with the rollback (`DROP TABLE public.project_requests;`)
   confirmed in advance;
5. record the result in `docs/verification/`.

Until that happens, `accountsConfigured` in `/api/health` reports `false` for
any deployment without the environment variables, and the site runs in its
degraded, honest state.

## Evolution path

- v0.2: nonce-based CSP, shared-store rate limiting, operator stage transitions
  with an audit trail, request attachments, email notifications on stage change.
- v0.3: connect the portal to the Control Plane so a request's stage reflects
  real branch, build and preview evidence instead of a manually set field.
- v1: client-visible evidence links per stage — preview URLs, build artifacts
  and verification records surfaced directly in the portal.
