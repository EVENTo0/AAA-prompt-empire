import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routePath = new URL('../app/api/registry/route.ts', import.meta.url)
const registryPath = new URL('../data/project-registry.json', import.meta.url)

test('project registry endpoint requires operator authorization', async () => {
  const route = await readFile(routePath, 'utf8')
  assert.match(route, /isAuthorized/)
  assert.match(route, /status:\s*401/)
  assert.match(route, /no-store, private/)
})

test('registry contains no provider credentials or privileged keys', async () => {
  const registry = await readFile(registryPath, 'utf8')
  assert.doesNotMatch(registry, /service_role|sb_secret_|ghp_|github_pat_|VERCEL_TOKEN|SUPABASE_ACCESS_TOKEN/i)
})

test('EVENTO is the legal parent and lifecycle source of truth', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const evento = registry.projects.find((project) => project.id === 'evento-core')
  assert.equal(registry.portfolioModel.legalParent, 'EVENTO Project Development')
  assert.equal(registry.portfolioModel.legalParentId, 'evento-core')
  assert.equal(evento.portfolioLayer, 'company-core')
  assert.equal(evento.parentId, null)
  assert.equal(evento.commercialRole, 'legal-parent-and-revenue-engine')
  assert.deepEqual(registry.portfolioModel.lifecycle, ['idea','discovery','foundation','mvp','verified','beta','production','commercial','maintenance'])
})

test('EVENTO company web source is authoritative after THE ROOT isolation', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const evento = registry.projects.find((project) => project.id === 'evento-core')
  assert.equal(evento.repository, 'EVENTo0/EVENTo0')
  assert.equal(evento.stage, 'foundation')
  assert.equal(evento.status, 'active')
  assert.match(evento.notes, /THE ROOT PR was closed unmerged/)
  assert.equal(registry.projects.some((project) => project.id === 'evento-repository-triage'), false)
})

test('EVENTO web, mobile, and Empire remain technically separate but share the company hierarchy', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const evento = registry.projects.find((project) => project.id === 'evento-core')
  const eventoMobile = registry.projects.find((project) => project.id === 'evento-mobile')
  const empire = registry.projects.find((project) => project.id === 'aaa-empire')
  assert.equal(evento.vercelProject, 'evento-empire')
  assert.equal(evento.supabaseProjectRef, 'jaxhaiaftpegcodkzaus')
  assert.equal(evento.repository, 'EVENTo0/EVENTo0')
  assert.equal(eventoMobile.repository, 'EVENTo0/evento-mobile')
  assert.equal(eventoMobile.parentId, 'evento-core')
  assert.equal(eventoMobile.portfolioLayer, 'company-core')
  assert.deepEqual(eventoMobile.platforms, ['android', 'ios'])
  assert.equal(empire.repository, 'EVENTo0/AAA-prompt-empire')
  assert.equal(empire.parentId, 'evento-core')
  assert.equal(empire.portfolioLayer, 'internal-engineering-lab')
  assert.equal(empire.saleStatus, 'internal')
  assert.notEqual(evento.repository, eventoMobile.repository)
  assert.notEqual(eventoMobile.repository, empire.repository)
})

test('internal engineering lab repositories are not treated as commercial portfolio products', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const internalIds = ['aaa-empire', 'aaa-prompt', 'empire-mobile-control-plane', 'omniform-nexus']
  for (const id of internalIds) {
    const project = registry.projects.find((entry) => entry.id === id)
    assert.equal(project.parentId, 'evento-core')
    assert.equal(project.portfolioLayer, 'internal-engineering-lab')
    assert.equal(project.saleStatus, 'internal')
  }
})

test('EVENTO ventures inherit the company parent or an EVENTO venture-group parent', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const evex = registry.projects.find((project) => project.id === 'evex-official')
  const octorimal = registry.projects.find((project) => project.id === 'octorimal')
  const familyos = registry.projects.find((project) => project.id === 'familyos')
  const evexMobile = registry.projects.find((project) => project.id === 'evex-mobile')
  assert.equal(octorimal.portfolioLayer, 'evento-venture')
  assert.equal(octorimal.parentId, 'evento-core')
  assert.equal(familyos.parentId, 'evento-core')
  assert.equal(evex.parentId, 'evento-core')
  assert.equal(evexMobile.parentId, 'evex-official')
  assert.equal(evexMobile.portfolioLayer, 'evento-venture')
})

test('all current EVENTo0 repositories are represented in the portfolio registry', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const tracked = new Set(registry.projects.map((project) => project.repository).filter(Boolean))
  const expected = [
    'EVENTo0/EVENTo0','EVENTo0/aetheris-studios','EVENTo0/Evx','EVENTo0/evx-health-coach',
    'EVENTo0/evex-coach','EVENTo0/evex-lab','EVENTo0/evex-fit','EVENTo0/evex-mobile',
    'EVENTo0/AAA-prompt-empire','EVENTo0/AAA-prompt','EVENTo0/evento-mobile',
    'EVENTo0/omniform-nexus-professor-ai','EVENTo0/familyos','EVENTo0/OCTORIMAL',
    'EVENTo0/History-Med-1','EVENTo0/empire-mobile-control-plane',
  ]
  for (const repository of expected) assert.ok(tracked.has(repository), `missing repository from registry: ${repository}`)
})

test('placeholder/meta repositories are not treated as normal commercial products', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const placeholder = registry.projects.find((project) => project.repository === 'EVENTo0/Evx')
  assert.equal(placeholder.kind, 'portfolio-meta-candidate')
  assert.equal(placeholder.portfolioLayer, 'portfolio-meta')
  assert.equal(placeholder.status, 'paused')
  assert.equal(placeholder.saleStatus, 'internal')
})
