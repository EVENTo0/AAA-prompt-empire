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

test('EVENTO web, mobile, and Empire remain separate tracked systems', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const evento = registry.projects.find((project) => project.id === 'evento-core')
  const eventoMobile = registry.projects.find((project) => project.id === 'evento-mobile')
  const empire = registry.projects.find((project) => project.id === 'aaa-empire')

  assert.equal(evento.vercelProject, 'evento-empire')
  assert.equal(evento.supabaseProjectRef, 'jaxhaiaftpegcodkzaus')
  assert.equal(evento.repository, null)

  assert.equal(eventoMobile.repository, 'EVENTo0/evento-mobile')
  assert.equal(eventoMobile.supabaseProjectRef, 'jaxhaiaftpegcodkzaus')
  assert.equal(eventoMobile.vercelProject, null)
  assert.deepEqual(eventoMobile.platforms, ['android', 'ios'])
  assert.ok(eventoMobile.workflows.includes('phone-dev-rc3-v2.yml'))

  assert.equal(empire.repository, 'EVENTo0/AAA-prompt-empire')
  assert.notEqual(evento.id, eventoMobile.id)
  assert.notEqual(eventoMobile.repository, empire.repository)
})

test('OCTORIMAL is tracked as an independent product repository', async () => {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const octorimal = registry.projects.find((project) => project.id === 'octorimal')
  const empire = registry.projects.find((project) => project.id === 'aaa-empire')

  assert.equal(octorimal.repository, 'EVENTo0/OCTORIMAL')
  assert.equal(octorimal.kind, 'game-product')
  assert.equal(octorimal.status, 'active')
  assert.equal(octorimal.vercelProject, null)
  assert.equal(octorimal.supabaseProjectRef, null)
  assert.notEqual(octorimal.repository, empire.repository)
})
