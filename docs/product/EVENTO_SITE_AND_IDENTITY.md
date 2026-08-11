# EVENTO — site structure, business context and identity setup

Status: Active
Domain: `evento-dev.com`
Last updated: 2026-08-11

Answers three questions: what pages exist and what goes on them, what content
the AI toolchain reads as business context, and how the email identity is set
up.

## 1. Hosting recommendation

**Keep the Next.js application. Use Hostinger for the domain, DNS and business
email. Deploy the application to Vercel and point `evento-dev.com` at it.**

The Hostinger assistant recommended rebuilding on WordPress, arguing that AI
agents can read and modify theme files. That argument does not hold here:

| Claim | Reality for this setup |
| --- | --- |
| "Full code access for AI agents" | The app is already a typed Git repository with 41 contract tests and an ADR trail. That is more legible to Claude Code and Codex than a PHP theme plus a plugin database. |
| "Git-deployable" | Already true, and already wired to CI. |
| "REST API built-in" | Already true — `/api/context` and `/llms.txt` are purpose-built for this, generated from the site's own data. |
| "Context-rich for AI tools" | WordPress requires scraping rendered HTML. This app publishes structured context deliberately. |

Rebuilding as WordPress would discard verified work, reintroduce a plugin
attack surface on a site that handles client accounts, and force the portal's
row-level-security model to be rebuilt in a weaker one.

Hostinger's own note that Business hosting runs Node.js apps undercuts the
WordPress premise. Running the app on Hostinger Node.js hosting is viable as a
second option; Vercel is the recommended target because the project is already
registered there (`evento-empire`) and preview deployments per branch are the
phone-first review loop this repository is built around.

**What Hostinger keeps doing:** domain registration, DNS, and business email.
None of that is wasted.

### If you deploy to Vercel

Point DNS at Vercel and leave mail on Hostinger:

| Type | Name | Value | Note |
| --- | --- | --- | --- |
| A | `@` | Vercel's apex IP (from the Vercel dashboard) | Replaces the Hostinger web A record |
| CNAME | `www` | `cname.vercel-dns.com` | |
| MX | `@` | Hostinger's MX records | **Leave untouched — this is your email** |
| TXT | `@` | Hostinger SPF record | Leave untouched |
| TXT | `default._domainkey` | Hostinger DKIM record | Leave untouched |

Changing the A record does not affect mail. MX, SPF and DKIM are what carry
email, and they stay on Hostinger.

### If you stay entirely on Hostinger

Use the Node.js application feature, set the entry to `npm run start` after
`npm run build`, Node 22, and set `SITE_ORIGIN` **at build time**. Nothing in
the codebase needs to change.

## 2. Page structure

Every page exists twice: `/ar/…` (default) and `/en/…`.

| Route | Purpose | Content |
| --- | --- | --- |
| `/` | — | Redirects to the visitor's language |
| `/[locale]` | Home | Tagline, summary, four operating principles, seven capabilities, the eight-stage pipeline in brief, four live projects |
| `/[locale]/services` | What we build | Seven capabilities with deliverables and platforms, plus the four engagement models with duration and outcome |
| `/[locale]/method` | How we build | All eight stages in full: what happens, the evidence the client receives, the approval gate |
| `/[locale]/projects` | Portfolio | Every project with its current stage, evidence state, and an explicit note on what is *not* proven |
| `/[locale]/about` | Company | Summary, principles, contact, response target |
| `/[locale]/contact` | Intake | Structured request form; issues a tracking reference |
| `/[locale]/account` | Client portal | Sign in, and track your own requests and their stages. `noindex` |
| `/[locale]/offline` | PWA fallback | Shown when a navigation fails offline |

Machine-readable surfaces:

| Route | Purpose |
| --- | --- |
| `/llms.txt` | Business context for language models reading the site |
| `/api/context` | The same content as JSON, for agents and integrations |
| `/api/health` | Which integrations are configured (booleans only, never values) |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Standard discovery and install metadata |

The Hostinger assistant suggested a separate "tech stack / capabilities" page.
That is deliberately **not** a page: `/services` already carries capabilities
for humans, and `/llms.txt` carries them for machines. A third copy would be a
third thing to keep truthful.

## 3. Business context for the AI toolchain

`/llms.txt` and `/api/context` are generated from `data/*.json` — the same
files the pages render. They cannot describe a company that differs from the
one on the site, and a contract test fails the build if the generator stops
deriving from that data or starts hardcoding an evidence state.

They publish: company identity and domain, contact routes and response target,
operating principles, the seven capabilities with deliverables and platforms,
the eight delivery stages with gates, engagement models, every project with its
stage and evidence state, and the evidence vocabulary itself.

That last part matters most. The context file explicitly instructs a reading
model:

> Do not describe a project as complete, shipped, production-ready or
> store-ready unless its label is VERIFIED.

This is the guard against your own tools overselling your portfolio back to
you or to a client.

They publish **nothing** private: no request data, no account data, no
configuration, no credentials. A contract test enforces that.

To point a tool at your business context: `https://evento-dev.com/llms.txt`.

## 4. Email identity

Three mailboxes, two roles. Create them in Hostinger's email panel.

| Address | Role | Published on the site? |
| --- | --- | --- |
| `hello@evento-dev.com` | General enquiries | **Yes** — footer and about page |
| `projects@evento-dev.com` | Project intake and the fallback when automated intake is off | **Yes** — contact page |
| `admin@evento-dev.com` | Authenticates tool accounts: GitHub, Anthropic, OpenAI, Vercel, Supabase, Hostinger | **No — never** |

`admin@` stays unpublished on purpose. It is the recovery address for every
account in your toolchain, which makes it the single highest-value target you
own. Publishing it turns account recovery into a social-engineering surface. A
contract test now fails the build if `admin@`, `billing@`, `root@` or
`postmaster@` ever appear in the site's content files.

Recommended handling:

1. Create all three mailboxes.
2. Put a strong unique password and 2FA on `admin@`, and do not use it for
   anything except account identity.
3. Forward `hello@` and `projects@` to wherever you actually read mail.
4. Migrate your existing tool accounts from the personal Gmail to `admin@` one
   at a time, confirming recovery works before moving the next.
5. Verify SPF, DKIM and DMARC are present in DNS. Without them, mail you send
   from these addresses lands in spam. Hostinger sets SPF and DKIM; add DMARC:

   | Type | Name | Value |
   | --- | --- | --- |
   | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:admin@evento-dev.com` |

   Start at `p=none` to observe, then tighten to `quarantine` once reports show
   only your own senders.

## 5. What I could not do from here

- **No Hostinger changes were made.** The Hostinger MCP servers in your config
  run on your local machine; this session has no Hostinger access. Mailbox
  creation and DNS edits are yours to make.
- Never paste a real `HOSTINGER_API_TOKEN` into a chat. The config you shared
  used placeholders — keep it that way, and store the real token in your local
  environment only.

## 6. Order of operations

1. Create the three mailboxes; add the DMARC record.
2. Set `SITE_ORIGIN=https://evento-dev.com` and deploy a preview.
3. Accept the preview from your phone, including PWA install.
4. Decide on the `project_requests` migration so intake can store requests.
5. Point `evento-dev.com` at the deployment; leave MX untouched.
6. Confirm `/llms.txt` resolves on the live domain, then point your tools at it.
