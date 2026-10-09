# EVENTO Web

The EVENTO Project Development parent-company surface: the public website, the
installable PWA shell, client accounts, and the project-request portal.

Bilingual Arabic/English with Arabic as the default locale and an RTL-first
layout.

## Run it

```bash
cd apps/evento-web
npm install
npm run dev            # http://localhost:3000 → redirects to /ar
```

Use `localhost`, not `127.0.0.1`: the Next.js dev server blocks cross-origin
requests to dev resources, and assets 403 when the two disagree. Production
(`npm run start`) has no such constraint.

## Checks

```bash
npm run test:contracts   # content, security and intake-rule contracts
npm run typecheck
npm run build
npm run check            # all three
```

`npm run check` proves the app compiles and its contracts hold. It does not
prove the pages render or that the account flow works — start the server and
exercise it before claiming either.

## Configuration

Everything is server-side; see `.env.example`. The app runs with no
configuration at all:

| Variable | Effect when unset |
| --- | --- |
| `SITE_ORIGIN` | Canonical URLs and the sitemap fall back to `localhost:3000`. Set this before publishing. |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Accounts show "not enabled on this deployment"; the intake form returns `not-configured` and offers an email fallback. Public pages are unaffected. |

`SUPABASE_PUBLISHABLE_KEY` is the anon/publishable key. A service-role key must
never be configured for this app — authorization is row level security using
each visitor's own access token, and a contract test fails the build if a
service-role credential is referenced anywhere in the source.

## Layout

```
app/[locale]/        pages — the locale segment is the root layout
app/api/             intake, account login/signup/logout, health
components/          UI, with client components marked 'use client'
data/                company, service catalog, delivery stages, portfolio (bilingual JSON)
lib/                 i18n, content, session, supabase adapter, validation, rate limit
supabase/migrations/ project_requests schema — NOT applied, see ARCHITECTURE.md
tests/               contract tests run by node:test
```

## Content changes

Copy lives in `lib/content.ts` (interface strings) and `data/*.json` (company,
services, stages, projects). Both languages are required; a contract test fails
if either side is missing or empty.

Project entries in `data/portfolio.json` must use the Empire evidence
vocabulary — `VERIFIED`, `PARTIALLY VERIFIED`, `UNVERIFIED`, `BLOCKED` — and a
`VERIFIED` claim must carry a link a reader can open.

## Architecture, limitations and the migration gate

See [ARCHITECTURE.md](./ARCHITECTURE.md). It records the authorization model,
the known limitations (per-instance rate limiting, spoofable `x-forwarded-for`
without a trusted proxy, `unsafe-inline` in the CSP) and the approval steps
required before the database migration is applied to the shared EVENTO
Supabase project.
