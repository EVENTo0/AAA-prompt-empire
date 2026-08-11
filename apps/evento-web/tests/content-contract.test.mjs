import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

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
