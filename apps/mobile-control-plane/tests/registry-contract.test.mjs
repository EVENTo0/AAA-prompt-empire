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

test('registry contains no provider credentials or service-role keys', async () => {
  const registry = await readFile(registryPath, 'utf8')
  assert.doesNotMatch(registry, /service_role|sb_secret_|ghp_|github_pat_|VERCEL_TOKEN|SUPABASE_ACCESS_TOKEN/i)
})

test('EVENTO acquisition, operations, mobile, and Empire have bounded authority', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const evento = registry.projects.find((project) => project.id === 'evento-core')
  const eventoOne = registry.projects.find((project) => project.id === 'evento-one')
  const eventoMobile = registry.projects.find((project) => project.id === 'evento-mobile')
  const empire = registry.projects.find((project) => project.id === 'aaa-empire')

  assert.equal(evento.vercelProject, 'evento-empire')
  assert.equal(evento.supabaseProjectRef, 'jaxhaiaftpegcodkzaus')
  assert.equal(evento.repository, 'EVENTo0/Evento-project-development-v1')
  assert.equal(evento.canonicalRepo, evento.repository)
  assert.equal(evento.authority, 'canonical')

  assert.equal(eventoOne.repository, 'EVENTo0/Evento-One')
  assert.equal(eventoOne.canonicalRepo, eventoOne.repository)
  assert.equal(eventoOne.authority, 'canonical')
  assert.match(eventoOne.notes, /GitHub CI.*unverified/i)

  assert.equal(eventoMobile.repository, 'EVENTo0/evento-mobile')
  assert.equal(eventoMobile.supabaseProjectRef, 'jaxhaiaftpegcodkzaus')
  assert.equal(eventoMobile.vercelProject, null)
  assert.deepEqual(eventoMobile.platforms, ['android', 'ios'])
  assert.ok(eventoMobile.workflows.includes('phone-dev-rc3-v2.yml'))
  assert.equal(eventoMobile.authority, 'bounded-canonical')

  assert.equal(empire.repository, 'EVENTo0/AAA-prompt-empire')
  assert.notEqual(evento.id, eventoMobile.id)
  assert.notEqual(eventoMobile.repository, empire.repository)
})

test('registry v2 mirrors the complete EVENTo0 hierarchy as of 2026-09-21', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  assert.equal(registry.version, 2)
  assert.equal(registry.asOf, '2026-09-21')
  assert.equal(registry.owner, 'EVENTo0')
  assert.equal(registry.mirrorContracts.length, 1)
  assert.equal(registry.mirrorContracts[0].mode, 'derived-mirror-only')
  assert.equal(registry.mirrorContracts[0].mutationAuthority, 'none')
  assert.equal(registry.projects.length, 33)
  assert.equal(new Set(registry.projects.map((project) => project.repository)).size, 33)
  const counts = Object.fromEntries(['company-core', 'internal-engineering-lab', 'evento-ventures', 'ambiguous-owner-decision']
    .map((hierarchy) => [hierarchy, registry.projects.filter((project) => project.hierarchy === hierarchy).length]))
  assert.deepEqual(counts, {'company-core': 5, 'internal-engineering-lab': 8, 'evento-ventures': 19, 'ambiguous-owner-decision': 1})
})

test('authority contract prevents parallel portfolio truths', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const repositories = new Set(registry.projects.map((project) => project.repository))
  const canonicalAuthorities = new Set(['canonical', 'bounded-canonical', 'shared-capability'])
  const groups = Map.groupBy(registry.projects, (project) => project.productKey)

  for (const [productKey, projects] of groups) {
    const canonical = projects.filter((project) => canonicalAuthorities.has(project.authority))
    assert.ok(canonical.length <= 1, `${productKey} has parallel canonical authorities`)
    for (const project of projects) {
      assert.ok(project.authority, `${project.id} is missing authority`)
      if (project.canonicalRepo !== null) {
        assert.ok(repositories.has(project.canonicalRepo), `${project.id} points outside the owned snapshot`)
      }
      if (canonicalAuthorities.has(project.authority)) {
        assert.equal(project.canonicalRepo, project.repository)
      }
    }
  }

  const saeed = groups.get('saeed-game')
  assert.equal(saeed.length, 2)
  assert.ok(saeed.every((project) => project.authority === 'owner-decision-required'))
  assert.ok(saeed.every((project) => project.canonicalRepo === null))

  const acquisition = groups.get('evento-acquisition')
  assert.equal(acquisition.find((project) => project.id === 'evento-project-2').canonicalRepo, 'EVENTo0/Evento-project-development-v1')
})

test('new portfolio repositories retain evidence and safety boundaries', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const aithenax = registry.projects.find((project) => project.id === 'aithenax')
  const dataset = registry.projects.find((project) => project.id === 'uae-seed-dataset')
  assert.equal(aithenax.repository, 'EVENTo0/AithenaX')
  assert.equal(aithenax.status, 'active')
  assert.match(aithenax.notes, /no autonomous live-trading authority/i)
  assert.equal(dataset.authority, 'shared-capability')
  assert.match(dataset.notes, /not a standalone customer product/i)
})

test('OCTA Voice is G1-only and games remain runtime-evidence gated', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const voice = registry.projects.find((project) => project.id === 'octa-voice')
  assert.equal(voice.hierarchy, 'internal-engineering-lab')
  assert.equal(voice.status, 'g1-baseline')
  assert.match(voice.notes, /G2 prohibited/)
  for (const id of ['octopus', 'octorimal', 'aetheris']) {
    assert.equal(registry.projects.find((project) => project.id === id).status, 'runtime-evidence-required')
  }
})

test('OCTORIMAL is tracked as an independent product repository', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const octorimal = registry.projects.find((project) => project.id === 'octorimal')
  const empire = registry.projects.find((project) => project.id === 'aaa-empire')

  assert.equal(octorimal.repository, 'EVENTo0/OCTORIMAL')
  assert.equal(octorimal.kind, 'game-product')
  assert.equal(octorimal.status, 'runtime-evidence-required')
  assert.equal(octorimal.vercelProject, null)
  assert.equal(octorimal.supabaseProjectRef, null)
  assert.notEqual(octorimal.repository, empire.repository)
})
