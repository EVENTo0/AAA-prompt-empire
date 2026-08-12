import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const repoRoot = new URL('../../', root)

const LOCALES = ['ar', 'en']
const EVIDENCE_STATES = ['VERIFIED', 'PARTIALLY VERIFIED', 'UNVERIFIED', 'BLOCKED']

async function json(path, base = root) {
  return JSON.parse(await readFile(new URL(path, base), 'utf8'))
}

const company = await json('data/company.json')
const catalog = await json('data/service-catalog.json')
const pipeline = await json('data/delivery-stages.json')
const portfolio = await json('data/portfolio.json')
const content = await readFile(new URL('lib/content.ts', root), 'utf8')

/** Every localized value must carry a non-empty string for each locale. */
function assertLocalized(value, label) {
  assert.equal(typeof value, 'object', `${label} must be a localized object`)
  for (const locale of LOCALES) {
    assert.equal(typeof value[locale], 'string', `${label}.${locale} must be a string`)
    assert.ok(value[locale].trim().length > 0, `${label}.${locale} must not be empty`)
  }
}

function assertLocalizedList(value, label) {
  for (const locale of LOCALES) {
    assert.ok(Array.isArray(value[locale]), `${label}.${locale} must be an array`)
    assert.ok(value[locale].length > 0, `${label}.${locale} must not be empty`)
    for (const [index, entry] of value[locale].entries()) {
      assert.ok(entry.trim().length > 0, `${label}.${locale}[${index}] must not be empty`)
    }
  }
}

test('company copy is complete in every supported language', () => {
  assertLocalized(company.tagline, 'company.tagline')
  assertLocalized(company.summary, 'company.summary')
  assert.ok(company.principles.length > 0)
  for (const principle of company.principles) {
    assertLocalized(principle.title, `principle ${principle.id}.title`)
    assertLocalized(principle.body, `principle ${principle.id}.body`)
  }
})

test('the service catalog is complete and free of duplicate ids', () => {
  const ids = catalog.services.map((service) => service.id)
  assert.equal(new Set(ids).size, ids.length, 'service ids must be unique')
  for (const service of catalog.services) {
    assertLocalized(service.name, `service ${service.id}.name`)
    assertLocalized(service.summary, `service ${service.id}.summary`)
    assertLocalizedList(service.deliverables, `service ${service.id}.deliverables`)
    assert.ok(service.platforms.length > 0, `service ${service.id} must declare platforms`)
  }

  const engagementIds = catalog.engagements.map((engagement) => engagement.id)
  assert.equal(new Set(engagementIds).size, engagementIds.length, 'engagement ids must be unique')
  for (const engagement of catalog.engagements) {
    assertLocalized(engagement.name, `engagement ${engagement.id}.name`)
    assertLocalized(engagement.duration, `engagement ${engagement.id}.duration`)
    assertLocalized(engagement.outcome, `engagement ${engagement.id}.outcome`)
  }
})

test('the delivery pipeline is contiguous and fully translated', () => {
  const orders = pipeline.stages.map((stage) => stage.order).sort((a, b) => a - b)
  assert.deepEqual(
    orders,
    orders.map((_, index) => index + 1),
    'stage order must run 1..n with no gaps or duplicates',
  )
  const ids = pipeline.stages.map((stage) => stage.id)
  assert.equal(new Set(ids).size, ids.length, 'stage ids must be unique')

  for (const stage of pipeline.stages) {
    assertLocalized(stage.name, `stage ${stage.id}.name`)
    assertLocalized(stage.body, `stage ${stage.id}.body`)
    assertLocalized(stage.clientEvidence, `stage ${stage.id}.clientEvidence`)
    if (stage.gate !== null) assertLocalized(stage.gate, `stage ${stage.id}.gate`)
  }
})

test('the published stage vocabulary matches the database constraint', async () => {
  const migration = await readFile(new URL('supabase/migrations/0001_project_requests.sql', root), 'utf8')
  for (const stage of pipeline.stages) {
    assert.ok(
      migration.includes(`'${stage.id}'`),
      `stage ${stage.id} is published but missing from the project_requests stage constraint`,
    )
  }
})

test('portfolio entries use published stages and declared evidence states', () => {
  const stageIds = new Set(pipeline.stages.map((stage) => stage.id))
  for (const project of portfolio.projects) {
    assertLocalized(project.name, `project ${project.id}.name`)
    assertLocalized(project.kind, `project ${project.id}.kind`)
    assertLocalized(project.summary, `project ${project.id}.summary`)
    assertLocalized(project.evidenceNote, `project ${project.id}.evidenceNote`)
    assert.ok(stageIds.has(project.stage), `project ${project.id} uses unpublished stage ${project.stage}`)
    assert.ok(
      EVIDENCE_STATES.includes(project.evidence),
      `project ${project.id} must use the Empire evidence vocabulary`,
    )
  }
})

test('no portfolio entry claims verification it does not document', () => {
  for (const project of portfolio.projects) {
    // A "VERIFIED" claim is the one state that must be backed by a link the
    // reader can open. Everything weaker only needs an honest note.
    if (project.evidence === 'VERIFIED') {
      assert.ok(project.link, `project ${project.id} claims VERIFIED and must publish supporting evidence`)
    }
  }
})

test('every public project mirrors a project tracked in the Empire registry', async () => {
  const registry = await json('apps/mobile-control-plane/data/project-registry.json', repoRoot)
  const known = new Set(registry.projects.map((project) => project.id))
  for (const project of portfolio.projects) {
    assert.ok(
      known.has(project.registryId),
      `project ${project.id} references unknown registry id ${project.registryId}`,
    )
  }
})

test('every service routes to a registered Empire skill', async () => {
  const skills = await json('registry/skills.json', repoRoot)
  const known = new Set(skills.skills.map((skill) => skill.id ?? skill.name))
  for (const service of catalog.services) {
    assert.ok(
      known.has(service.routeSkill),
      `service ${service.id} routes to unregistered skill ${service.routeSkill}`,
    )
  }
})

test('every UI string is defined in both languages', () => {
  const block = content.slice(content.indexOf('const dictionary = {'), content.indexOf('} satisfies Dictionary'))
  const entries = [...block.matchAll(/'([a-zA-Z.]+)':\s*\{/g)].map((match) => match[1])
  assert.ok(entries.length > 40, 'the dictionary should cover the whole interface')

  // Each entry must supply both locales; the `satisfies Dictionary` annotation
  // enforces the type, this enforces that neither side was left blank.
  const missing = []
  for (const match of block.matchAll(/'([a-zA-Z.]+)':\s*\{([^}]*)\}/g)) {
    const [, key, body] = match
    for (const locale of LOCALES) {
      if (!new RegExp(`\\b${locale}:\\s*'[^']+'`).test(body) && !new RegExp(`\\b${locale}:\\s*"[^"]+"`).test(body)) {
        missing.push(`${key}.${locale}`)
      }
    }
  }
  assert.deepEqual(missing, [], 'these dictionary entries are missing or empty')
})

test('published contact addresses use the company domain', () => {
  assert.equal(company.domain, 'evento-dev.com')
  for (const key of ['general', 'projects']) {
    assert.ok(
      company.contact[key].endsWith(`@${company.domain}`),
      `contact.${key} must be a branded address on ${company.domain}`,
    )
  }
})

test('operational mailboxes are never published on the public site', async () => {
  // admin@ authenticates tool accounts (GitHub, model providers, hosting).
  // Publishing it turns a credential-recovery address into a spam and
  // social-engineering target.
  const operational = ['admin@', 'billing@', 'root@', 'postmaster@']
  const surfaces = ['data/company.json', 'lib/content.ts', 'lib/business-context.ts']
  for (const path of surfaces) {
    const body = await readFile(new URL(path, root), 'utf8')
    for (const mailbox of operational) {
      assert.ok(
        !body.includes(`${mailbox}${company.domain}`),
        `${path} must not publish ${mailbox}${company.domain}`,
      )
    }
  }
})

test('the AI business context is generated from the published data', async () => {
  const source = await readFile(new URL('lib/business-context.ts', root), 'utf8')
  // It must read the same data the pages render, not a hand-maintained copy
  // that can quietly describe a different company.
  assert.match(source, /from '@\/lib\/content'/)
  for (const field of ['services', 'engagements', 'stages', 'portfolio', 'company']) {
    assert.ok(source.includes(field), `business context must derive ${field} from the site data`)
  }
  assert.ok(!/evidence: 'VERIFIED'/.test(source), 'evidence states must come from the data, never be hardcoded')
})

test('the context surfaces expose no request, account or configuration data', async () => {
  const source = await readFile(new URL('lib/business-context.ts', root), 'utf8')
  for (const term of ['SUPABASE', 'project_requests', 'accessToken', 'cookies']) {
    assert.ok(!source.includes(term), `business context must not reference ${term}`)
  }
})

test('the public context routes are crawlable while the rest of the API is not', async () => {
  const robots = await readFile(new URL('app/robots.ts', root), 'utf8')
  assert.match(robots, /'\/api\/context'/)
  assert.match(robots, /'\/llms\.txt'/)
  assert.match(robots, /disallow: \['\/api\/'/)
})

test('Arabic text is never letter-spaced', async () => {
  // Arabic script is cursive and joined; tracking breaks the joins. Any rule
  // that applies letter-spacing must be scoped to Latin or reset for Arabic.
  const css = await readFile(new URL('app/globals.css', root), 'utf8')

  const offenders = []
  // Split into rule blocks and check each one that sets letter-spacing.
  for (const block of css.split('}')) {
    if (!/letter-spacing:(?!\s*normal\b)/.test(block)) continue
    const selector = block.slice(0, block.indexOf('{')).trim()
    const isLatinScoped = /:lang\(en\)/.test(selector)
    // The ledger face is Latin-only by unicode-range, so tracking is safe
    // there; `:lang(ar)` overrides reset it for Arabic.
    const isLedger = /\.ledger|\.reference|\.tag\b|\.evidence|\.eyebrow|\.fieldLabel|\.stageMeta dt|footerGrid h4|brandText small/.test(
      selector,
    )
    if (!isLatinScoped && !isLedger) offenders.push(selector)
  }
  assert.deepEqual(offenders, [], 'these rules track text without scoping away from Arabic')

  // Every ledger-ish selector that tracks must have an Arabic reset.
  for (const name of ['.eyebrow', '.evidence', '.fieldLabel', '.stageMeta dt', '.footerGrid h4']) {
    assert.ok(
      css.includes(`:lang(ar) ${name}`),
      `${name} applies tracking and needs a :lang(ar) reset`,
    )
  }
})

test('the design tokens stay within their declared limits', async () => {
  const tokens = await readFile(new URL('app/tokens.css', root), 'utf8')
  const rootBlock = tokens.slice(tokens.indexOf(':root {'))

  // Palette: six colours. Semantic status colours are functional and counted
  // separately so status never competes with the accent for meaning.
  const palette = ['--ink:', '--raised:', '--line:', '--text:', '--muted:', '--accent:']
  for (const name of palette) assert.ok(rootBlock.includes(name), `${name} must exist`)

  const rawHex = [...rootBlock.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-f]{3,8})\s*;/gim)].map((m) => m[1])
  assert.equal(
    rawHex.length,
    palette.length + 2,
    `expected 6 palette + 2 semantic raw colours, found ${rawHex.length}: ${rawHex.join(', ')}`,
  )

  // Spacing is a strict 4px grid.
  for (const [, name, value] of rootBlock.matchAll(/(--space-\d+):\s*(\d+)px/g)) {
    assert.equal(Number(value) % 4, 0, `${name} = ${value}px breaks the 4px grid`)
  }

  // The type scale is declared, not improvised at call sites.
  for (const step of ['--text-2xs', '--text-sm', '--text-base', '--text-lg', '--text-2xl', '--text-3xl']) {
    assert.ok(rootBlock.includes(`${step}:`), `${step} must be declared`)
  }

  assert.match(rootBlock, /--leading-body:\s*1\.7[0-9]?/, 'Arabic body text needs line-height >= 1.7')
})

test('components consume tokens, never raw values', async () => {
  const css = await readFile(new URL('app/globals.css', root), 'utf8')
  const body = css.slice(css.indexOf('box-sizing: border-box'))

  // Colours must all come from tokens.
  const rawColours = [...body.matchAll(/(?:color|background|border-color|fill):\s*(#[0-9a-f]{3,8}|rgba?\()/gi)]
  assert.deepEqual(
    rawColours.map((m) => m[0]),
    [],
    'these declarations use a raw colour instead of a token',
  )

  // No physical-direction properties: one stylesheet must serve both scripts.
  for (const physical of ['margin-left:', 'margin-right:', 'padding-left:', 'padding-right:', 'border-left:', 'border-right:']) {
    assert.ok(!body.includes(physical), `${physical} breaks RTL; use the logical property`)
  }
})

test('the fonts the stylesheet declares are actually shipped', async () => {
  const tokens = await readFile(new URL('app/tokens.css', root), 'utf8')
  const referenced = [...tokens.matchAll(/url\('\/fonts\/([^']+)'\)/g)].map((m) => m[1])
  assert.ok(referenced.length >= 5, 'both scripts and the ledger face must be declared')

  const shipped = await readdir(new URL('public/fonts/', root))
  for (const file of referenced) {
    assert.ok(shipped.includes(file), `${file} is referenced by @font-face but not shipped`)
  }

  // Each face must be range-limited, or an Arabic reader downloads Latin too.
  const faces = tokens.split('@font-face').slice(1)
  for (const face of faces) {
    assert.match(face, /unicode-range:/, 'every @font-face needs a unicode-range')
  }
  assert.match(tokens, /font-display:\s*swap/, 'text must paint before the face arrives')
})

test('static assets are never rewritten by locale middleware', async () => {
  const middleware = await readFile(new URL('middleware.ts', root), 'utf8')
  const matcher = middleware.slice(middleware.indexOf('matcher:'))
  // A redirected @font-face URL fails silently and the page falls back to a
  // system face, so this exclusion is load-bearing.
  for (const path of ['fonts', '_next/static', 'api', 'sw\\\\.js', 'llms\\\\.txt', 'opengraph-image']) {
    assert.ok(matcher.includes(path), `middleware must not rewrite /${path.replace(/\\\\/g, '')}`)
  }
})

test('one numeral system is enforced through a single formatter', async () => {
  const format = await readFile(new URL('lib/format.ts', root), 'utf8')
  assert.match(format, /nu-latn/, 'the digit decision must be explicit')

  // No component may reach for its own locale-specific numeral system.
  for (const dir of ['app', 'components']) {
    for (const entry of await readdir(new URL(`${dir}/`, root), { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue
      const path = `${entry.parentPath ?? entry.path}/${entry.name}`
      const body = await readFile(path, 'utf8')
      assert.ok(
        !/new Intl\.(NumberFormat|DateTimeFormat)/.test(body),
        `${path} formats numbers locally; use lib/format.ts so digits stay consistent`,
      )
    }
  }
})

test('the language switcher preserves the current page', async () => {
  const header = await readFile(new URL('components/site-header.tsx', root), 'utf8')
  // Resetting to the homepage on language change is the most common
  // bilingual-site defect; the switcher must rebuild the current path.
  assert.match(header, /pathname\.split\('\/'\)/)
  assert.match(header, /segments\[1\] = altLocale/)
  assert.match(header, /hrefLang=\{altLocale\}/)
})

test('every page declares its own canonical and hreflang', async () => {
  for (const [file, route] of [
    ['app/[locale]/services/page.tsx', '/services'],
    ['app/[locale]/method/page.tsx', '/method'],
    ['app/[locale]/projects/page.tsx', '/projects'],
    ['app/[locale]/about/page.tsx', '/about'],
    ['app/[locale]/contact/page.tsx', '/contact'],
  ]) {
    const body = await readFile(new URL(file, root), 'utf8')
    assert.ok(
      body.includes(`localeAlternates(locale, '${route}')`),
      `${file} must declare alternates for ${route}, or it inherits the homepage's`,
    )
  }
})

test('social cards and structured data are generated from site data', async () => {
  const og = await readFile(new URL('app/[locale]/opengraph-image.tsx', root), 'utf8')
  assert.match(og, /size = \{ width: 1200, height: 630 \}/)
  // The image renderer rejects woff2, so it must read the woff copies.
  assert.match(og, /og-fonts/)
  assert.ok(!/fonts', file\)/.test(og) || og.includes('og-fonts'), 'OG fonts come from assets/og-fonts')

  const ld = await readFile(new URL('lib/structured-data.ts', root), 'utf8')
  assert.match(ld, /'@type': 'Organization'/)
  assert.match(ld, /from '@\/lib\/content'/, 'structured data must derive from the site data')

  // Strip comments first: the file explains which fields are banned, and that
  // prose must not trip the check.
  const ldCode = ld.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  for (const field of ['aggregateRating', 'numberOfEmployees', 'revenue', 'award']) {
    assert.ok(
      !ldCode.includes(field),
      `structured data must not claim ${field} — the site does not publish it`,
    )
  }
})
