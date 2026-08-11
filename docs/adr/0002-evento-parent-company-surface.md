# ADR-0002: Build the EVENTO parent-company surface as a separate web application

- Status: Accepted
- Date: 2026-08-11
- Owners: EVENTo0 / Empire Orchestrator

## Context

EVENTO Project Development needed its public company surface built: the
website, an application for it, and client accounts — followed by a defined
mechanism for building the projects already in progress and the projects
clients will request in future.

Three constraints shaped the decision:

1. `EVENTo0/evento-mobile` already holds the authoritative EVENTO mobile
   product (Flutter, RC6 Android development build with signing and artifact
   evidence). It must not be forked.
2. `apps/mobile-control-plane` is a private operator console holding provider
   credentials and write actions. It is inside a privileged trust boundary.
3. `EVENTo0/EVENTo0` is developed on a separate track and must not be modified
   from this repository.

## Decision

Build `apps/evento-web` as a standalone Next.js App Router application inside
`EVENTo0/AAA-prompt-empire`, covering the public website, the installable PWA
shell, client accounts and the project-request portal.

Key sub-decisions:

- **The PWA is the app surface for web and installable Android use.** The
  native surface remains `EVENTo0/evento-mobile`. Building a second native app
  here would fork the product.
- **Bilingual Arabic/English with Arabic default,** routed as `/[locale]/…` so
  each language has a real indexable URL, with an RTL-first stylesheet built on
  CSS logical properties rather than a mirrored override sheet.
- **No client SDK for the backend.** Supabase Auth and PostgREST are called
  from the server with `fetch`, keeping the browser free of provider keys and
  allowing a production `connect-src 'self'`.
- **Authorization is row level security, not application logic.** Every
  database call carries the end user's own access token; no service-role key is
  configured or read.
- **The database migration is source-controlled but not applied.** The EVENTO
  Supabase project is shared with EVENTO Mobile, so applying schema changes is
  a gated action requiring owner approval and a rollback plan.
- **The published delivery stages are the request status vocabulary,** so the
  public promise at `/[locale]/method` and the database constraint cannot
  drift. A contract test fails the build if they do.
- **The public portfolio may only mirror the project registry,** and every
  entry carries an explicit Empire evidence state. A `VERIFIED` claim without a
  published link fails the build.

## Alternatives considered

| Alternative | Rejected because |
| --- | --- |
| Extend the Control Plane | Puts a public site inside a credentialed trust boundary. |
| New native company app | Forks the existing authoritative mobile product. |
| Static site plus a hosted form service | Cannot provide per-client sessions or an authorization boundary for request tracking. |
| Cookie locale with a single URL | Loses indexable per-language URLs for a company site where discoverability matters. |

## Consequences

### Positive

- The public surface, the operator console and the mobile product stay in
  separate trust boundaries.
- The site builds, renders and serves every public page with no configuration;
  unconfigured integrations degrade honestly instead of failing silently.
- Contract tests bind marketing content to registry and verification reality.
- One documented pipeline now covers internal, in-flight and future client
  projects.

### Trade-offs

- A second Next.js application to maintain in this repository.
- Intake cannot store requests until the migration is approved and applied.
- Rate limiting is per-instance and depends on a trusted proxy rewriting
  `x-forwarded-for`; production needs an edge rule or a shared store.
- The CSP still allows `'unsafe-inline'` for framework bootstrap scripts;
  moving to nonces is deferred.

## Compliance

`apps/evento-web/AGENTS.md` records the eight invariants that must not regress,
each enforced by `npm run test:contracts`. The delivery mechanism is documented
in `docs/product/EVENTO_DELIVERY_SYSTEM.md`. Verification evidence for this
change is in `docs/verification/2026-08-11-evento-web.md`.
