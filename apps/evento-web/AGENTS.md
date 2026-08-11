<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# EVENTO Web — local operating contract

This app inherits the root `AGENTS.md`. The rules below are additional and
specific to `apps/evento-web`.

## Scope boundaries

- This app owns the **public** EVENTO surface: website, PWA shell, client
  accounts and the request portal.
- It does **not** own the EVENTO mobile product. That lives in
  `EVENTo0/evento-mobile` and is authoritative there. Do not fork it here.
- It does **not** own operator tooling. That is `apps/mobile-control-plane`.
- Never modify `EVENTo0/EVENTo0`; that repository is developed on a separate
  track and must not be touched from this one.

## Invariants that must not regress

1. No provider credential may reach the browser. No `NEXT_PUBLIC_` variable
   exists in this app, and none may be added.
2. No service-role key. Authorization is row level security using the visitor's
   own access token.
3. Every mutating route checks `sameOrigin(request)` and is rate limited.
4. Auth errors are generic. Never forward upstream wording that distinguishes
   "unknown account" from "wrong password".
5. The service worker never caches `/api` responses or the account area, and
   navigations are network-first.
6. The production CSP has no `'unsafe-eval'` and no external `connect-src`.
7. When the store is not configured, the intake form fails loudly with
   `not-configured`. It must never imply a request was saved.
8. Public project states use the Empire evidence vocabulary and must not claim
   a stage the verification record does not support.

`npm run test:contracts` enforces all eight. If a change requires breaking one,
change the contract deliberately and say so — do not weaken the test.

## Content

All user-visible copy is bilingual. Arabic is the default locale and the layout
is RTL-first: use CSS logical properties (`inset-inline-start`,
`margin-inline-end`, `padding-inline-start`), never `left`/`right`. A contract
test fails if a dictionary entry or data field is missing either language.

## Before claiming the app works

`npm run check` (contracts, typecheck, production build) is the minimum. It does
not prove the pages render or that the account flow works — for that, start the
server and exercise it. Build success alone is never completion evidence.
