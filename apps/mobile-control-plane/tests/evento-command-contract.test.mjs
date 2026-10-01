import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
async function text(path) { return readFile(new URL(path, root), 'utf8') }

test('EVENTO command endpoint is authenticated and release remains protected', async () => {
  const route = await text('app/api/evento/command/route.ts')
  const orchestrator = await text('lib/evento-orchestrator.ts')
  assert.match(route, /isAuthorized/)
  assert.match(orchestrator, /releaseProtected/)
  assert.match(orchestrator, /command\.mode === 'release'/)
  assert.match(orchestrator, /CONTROL_PLANE_ENABLE_WRITES/)
  assert.match(orchestrator, /Unknown routing or missing evidence fails closed/)
})

test('EVENTO command plan requires evidence and isolated execution', async () => {
  const orchestrator = await text('lib/evento-orchestrator.ts')
  assert.match(orchestrator, /requiredEvidence/)
  assert.match(orchestrator, /Git worktree \/ branch/)
  assert.match(orchestrator, /Evidence Pack/)
  assert.match(orchestrator, /physical-device gate before production release/)
})

test('connector registry keeps releases disabled by default', async () => {
  const connectors = JSON.parse(await readFile(new URL('../../../registry/evento-connectors.json', import.meta.url), 'utf8'))
  assert.equal(connectors.policy.raw_secrets_in_browser, false)
  assert.equal(connectors.policy.unknown_connector, 'deny')
  for (const connector of connectors.connectors) assert.equal(connector.release, false)
})
