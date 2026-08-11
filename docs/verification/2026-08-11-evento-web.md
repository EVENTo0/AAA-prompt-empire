# Verification — EVENTO parent-company web surface

Date: 2026-08-11
Branch: `claude/evento-website-apps-dh5pfq`
Scope: `apps/evento-web`, `docs/product/EVENTO_DELIVERY_SYSTEM.md`, ADR-0002,
`.github/workflows/evento-web.yml`, project registry entry for `evento-core`

## Outcome

Build the EVENTO parent-company website, its installable app shell and client
accounts, and define the mechanism through which existing and future client
projects are built.

**Final state: PARTIALLY VERIFIED.** Everything that can be exercised without
touching live infrastructure has been exercised. Deployment and the live
database remain unverified, deliberately.

## Environment

- Node 22.22.2, npm 10.9.7
- Next.js 16.3.0, React 19.2.8, TypeScript 6.0.3
- Chromium from `/opt/pw-browsers` driven with `playwright-core`
- Local production server on port 3111; local development server on port 3112
- No live Supabase project was contacted. No EVENTO infrastructure was modified.

## Commands executed and results

| Check | Command | Result |
| --- | --- | --- |
| Contract tests | `npm run test:contracts` | **PASS** — 36/36 |
| Typecheck | `npm run typecheck` | **PASS** — no errors |
| Production build | `npm run build` | **PASS** — 21 static pages, 5 dynamic routes |
| Empire Guard | `python3 scripts/validate_empire.py` | **PASS** — 27 skills, 22 agents |
| Routing evals | `python3 scripts/run_empire_evals.py` | **PASS** — 18 cases |

## Runtime evidence (production server, port 3111)

- Routing: `/` → 307 → `/ar`; `/services` → 307 → `/ar/services`;
  `Accept-Language: en-GB` → 307 → `/en`.
- HTTP 200 on `/ar`, `/en`, `/ar/services`, `/en/services`, `/ar/method`,
  `/ar/projects`, `/ar/about`, `/ar/contact`, `/ar/account`, `/en/account`,
  `/ar/offline`.
- HTTP 200 on `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml` (12 URLs),
  `/sw.js`, `/icon.svg`, `/api/health`.
- HTTP 404 on an unknown path.
- `<html lang="ar" dir="rtl">` and `<html lang="en" dir="ltr">` confirmed.
- Response headers confirmed on a live response: CSP with
  `default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`; `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security`; no `X-Powered-By`.
- Unconfigured degradation: `/api/health` reports
  `accountsConfigured: false`; the account page renders the explicit
  "accounts not enabled" state; `POST /api/intake` returns 503
  `not-configured` for a fully valid submission rather than reporting success.

## API contract evidence

| Scenario | Expected | Observed |
| --- | --- | --- |
| POST `/api/intake` with no `Origin` | 403 | 403 `cross-origin` |
| POST `/api/intake` from `https://evil.example` | 403 | 403 `cross-origin` |
| POST `/api/intake` same-origin, invalid payload | 422 | 422 with per-field failures |
| POST `/api/intake` same-origin, valid, store absent | 503 | 503 `not-configured` |
| POST `/api/account/login`, store absent | 503 | 503 `not-configured` |
| Repeated intake posts past the window | 429 | 429 with `Retry-After` |

## Browser evidence

Chromium at 390×844 (phone) and 1280×900 (desktop), `/ar` and `/en`:

- Horizontal overflow measured as **0 px** on every page checked, in both
  writing directions.
- No console errors and no failed requests.
- The mobile menu opens and closes, and closes on route change.

## Account journey evidence

Driven through the real UI against a **protocol stub** implementing the
Supabase Auth and PostgREST request/response shapes, including the two
authorization rules the SQL migration enforces (server-assigned `owner_id`,
own-rows-only reads). 18/18 checks passed:

- signup returns 201 and signs the client straight in;
- the session cookie exists, is `HttpOnly`, is `SameSite=Strict`, and is
  unreachable from `document.cookie`;
- the empty portal state renders;
- the signed-in email is prefilled on the intake form;
- submitting returns a well-formed reference (`EV-YYYY-XXXXXX`);
- the request appears in that client's portal at the `intake` stage;
- **a second client signed in from a different address cannot see it**;
- sign-out clears both cookies and returns the auth form;
- a wrong password is refused with 401 and the message reveals nothing about
  whether the account exists.

This proves the application's handling of the protocol. It does **not** prove
behaviour against a live Supabase project.

## Defects found and fixed during verification

1. **CSRF check rejected all legitimate posts.** `sameOrigin` compared the
   browser `Origin` against `new URL(request.url).host`, which Next.js reports
   with a normalized `localhost` authority inside a route handler. Every
   same-origin submission returned 403. Now compares against
   `x-forwarded-host`/`host`; a contract test pins the fix.
2. **`next dev` was unusable.** The strict CSP blocked React's development
   `eval()` and the HMR websocket, so no client component ever hydrated. The
   development policy now allows both; a contract test asserts the production
   policy still allows neither.
3. **39 px horizontal overflow on every Arabic phone page.** The skip link used
   `inset-inline-start: -9999px`, which pushes content off-canvas to the right
   under RTL. Replaced with a vertical transform.
4. **Header overflowed at 390 px.** The labelled hamburger plus the language
   switch did not fit; the toggle is now icon-only with an accessible name.
5. **The desktop CTA was visible on phones.** `.headerCta { display: none }`
   was overridden by the later generic `.button` rule. Scoped to `.siteHeader`.
6. **The brand wordmark was clipped in RTL.** Now isolated with `direction: ltr`
   and `unicode-bidi: isolate`.
7. **The portal showed raw ids** (`web-platform`, `assessment`) instead of
   localized service and engagement names.

## Not verified

Stated explicitly rather than implied:

- **Deployment.** Nothing is deployed. There is no public URL, no custom
  domain, no TLS certificate and no CDN configuration.
- **Live Supabase.** No live project was contacted. The `project_requests`
  migration is source-controlled and **not applied**; the Supabase project is
  shared with EVENTO Mobile, so applying it needs owner approval, a staging
  run and a confirmed rollback.
- **Real device behaviour.** Verified in headless Chromium at phone viewports,
  not on physical Android or iOS hardware.
- **PWA install.** The manifest and service worker are served and syntactically
  correct; an actual install-to-home-screen and offline session on a real
  device has not been performed.
- **Accessibility.** Semantics, focus styles, contrast tokens, a skip link and
  reduced-motion support are implemented; no audit tool or screen-reader pass
  has been run.
- **Performance.** No Lighthouse or field measurement.
- **Email deliverability** for account confirmation.

## Safety evidence

- No secret, key, token, certificate or `.env` file is committed; `.env.example`
  contains empty placeholders only, and the CI job fails if any other `.env*`
  file appears.
- No `NEXT_PUBLIC_` variable exists anywhere in the app; a contract test scans
  both the template and all source.
- No service-role credential is referenced; a contract test scans all source.
- No live infrastructure was created, modified or deleted — no Supabase
  project, no Vercel project, no DNS.
- `EVENTo0/EVENTo0` was not read, written or referenced in any tool call.
- `EVENTo0/evento-mobile` is untouched; it remains authoritative for the mobile
  product.
- `apps/mobile-control-plane` implementation files are unchanged; only its
  project-registry data entry for `evento-core` was updated.

## Rollback

The change is additive. `apps/evento-web/`, `.github/workflows/evento-web.yml`,
ADR-0002, the delivery-system doc and this record can be removed with no effect
on other projects. The only edit to existing content is the `evento-core` entry
in `apps/mobile-control-plane/data/project-registry.json`, which is a
notes/workflows field update reversible on its own.

## Next actions

1. Owner decision on applying `0001_project_requests.sql` — branch or staging
   project first.
2. Set `SITE_ORIGIN` and deploy a protected preview.
3. Accept the preview from a physical phone, including PWA install and an
   offline session, and record that evidence here.
4. Run an accessibility and performance pass against the deployed preview.

---

# Addendum — domain identity and AI business context

Date: 2026-08-11 (same branch)
Scope: `evento-dev.com` identity, `/llms.txt`, `/api/context`,
`docs/product/EVENTO_SITE_AND_IDENTITY.md`

## Outcome

Bind the site to the registered domain, publish machine-readable business
context for the AI toolchain, and document the page structure, email identity
and DNS plan.

**State: PARTIALLY VERIFIED** — same boundary as above. Nothing is deployed and
no Hostinger resource was touched.

## Changed

- Contact identity moved from a personal Gmail to `hello@evento-dev.com`
  (general) and `projects@evento-dev.com` (intake). `admin@` is defined as the
  tool-authentication mailbox and is deliberately **not** published.
- `/llms.txt` and `/api/context` publish company, capabilities, delivery
  stages, engagement models, projects and the evidence vocabulary, generated
  from the same data files the pages render.
- `robots.ts` allows the two context routes while keeping the rest of `/api`
  and the account area disallowed.
- `docs/product/EVENTO_SITE_AND_IDENTITY.md` records the hosting
  recommendation, page map, context design, mailbox roles and DNS records.

## Verification

| Check | Result |
| --- | --- |
| `npm run test:contracts` | **PASS** — 41/41 (5 new) |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `/llms.txt` | HTTP 200, 101 lines, correct content |
| `/api/context` | HTTP 200, 8 top-level sections |
| Canonical origin with `SITE_ORIGIN` set at build | sitemap, robots and context all emit `https://evento-dev.com` |
| Branded address rendered | `hello@evento-dev.com` on the about page |
| `admin@` leakage | **0 occurrences** across `/llms.txt`, `/api/context` and rendered pages |
| Layout regression sweep | 0 px horizontal overflow, no console errors |

New contract tests: branded-domain addresses; operational mailboxes never
published; context generated from site data and never hardcoding an evidence
state; context exposes no request/account/configuration data; context routes
crawlable while the rest of the API is not.

## Defects found and fixed

1. **`/llms.txt` returned a 307 redirect** to `/ar/llms.txt` — the middleware
   matcher excluded `robots.txt` and the manifest but not `llms.txt`, so a
   well-known root path was rewritten under a locale.
2. **`SITE_ORIGIN` had no effect when set only at runtime.** The metadata,
   robots, sitemap and context routes are statically generated, so the value is
   baked at build time. Documented in `.env.example`; a runtime-only setting
   leaves every canonical URL pointing at localhost.
3. Doubled full stops in the generated stage text where source strings already
   ended in one.

Note: two earlier "failures" during this pass were a stale `.next` directory
and an orphaned server holding the port, not application defects. Confirmed by
a clean rebuild.

## Not verified

Unchanged from the main record, plus:

- No mailbox exists yet. `hello@`, `projects@` and `admin@` are specified, not
  created. Until they are, the addresses on the site do not receive mail.
- No DNS record was created or changed. SPF, DKIM and DMARC are unverified.
- No Hostinger API call was made from this session; the Hostinger MCP servers
  run on the operator's local machine and are not available here.

---

# Addendum 2 — installed-app experience

Date: 2026-08-11 (same branch)
Scope: `components/install-prompt.tsx`, `components/app-nav.tsx`, app-mode styles

## Outcome

Turn the installable web app from "a website with a manifest" into a real
installed-app experience: an in-page install offer and a bottom navigation bar
that exists only once the site runs standalone.

**State: PARTIALLY VERIFIED** — verified in a browser genuinely running in app
mode; not verified on physical hardware.

## Changed

- **Install offer.** Captures `beforeinstallprompt`, suppresses the browser's
  own English mini-infobar, and offers installation in the visitor's language.
  Dismissal persists. Never shown when already installed. iOS Safari never
  fires that event, so it gets written "Add to Home Screen" guidance instead.
- **Bottom navigation.** Four destinations, shown only under
  `@media (display-mode: standalone|fullscreen|minimal-ui)`. Visibility is a
  CSS decision, not a JavaScript one, so there is no flash of the wrong chrome
  and no hydration mismatch. Body padding and safe-area insets keep content
  clear of the bar, and the sticky header is released in app mode where there
  is no address bar to scroll away.

## Verification

| Check | Result |
| --- | --- |
| `npm run test:contracts` | **PASS** — 41/41 |
| `npm run typecheck` / `npm run build` | **PASS** |
| `matchMedia('(display-mode: standalone)')` in app mode | **true** |
| Bottom nav computed `display` in app mode | **grid** (hidden in browser mode) |
| Bottom nav absent in ordinary browsing | **confirmed** on 13 page captures |
| Horizontal overflow, app mode, AR and EN | **0 px** |
| Active-destination highlighting, RTL order | **correct** |

Captured across 16 screenshots: 8 Arabic phone pages, 2 English phone pages,
3 desktop pages, 3 app-mode pages.

## Method note

Chromium's CDP `Emulation.setEmulatedMedia` **silently ignores** the
`display-mode` feature — it accepted the call while `matchMedia` still reported
`browser`, which initially looked like a CSS bug. The real check launches
Chromium with `--app=<url>`, where the standalone media query genuinely
matches. Anyone re-verifying this must use app mode, not media emulation.

## Not verified

- Actual installation to a phone home screen, and a real offline session.
- `beforeinstallprompt` firing in a real Chrome install flow — the offer is
  event-driven and was not triggered in a headless capture.
- iOS guidance path on a real iPhone.
