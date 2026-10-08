import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { continuityDraftConfig } from '../lib/continuity-draft-config.mjs'
import { createContinuityDraftHandler } from '../lib/continuity-drafts.mjs'

const snapshot = JSON.parse(await readFile(new URL('../data/evento-continuity.v1.json', import.meta.url), 'utf8'))
const repository = 'EVENTo0/Private-journal-fixture'
const enabledEnv = { CONTROL_PLANE_ENABLE_WRITES: 'true', EVENTO_CONTINUITY_DRAFTS_ENABLED: 'true', EVENTO_CONTINUITY_TASK_REPOSITORY: repository }
function post() {
  return new Request('https://owner.example/api/evento/continuity/drafts', {
    method: 'POST', headers: { origin: 'https://owner.example', 'x-empire-action': '1' },
    body: JSON.stringify({ projectId: 'ev-bot', adapter: 'codex', taskId: 'CONT-isolation-12345678', confirmation: 'save_continuity_draft' }),
  })
}
test('dashboard credential alone cannot enable drafts or contact GitHub', async () => {
  for (const token of [undefined, '']) {
    let calls = 0
    const handle = createContinuityDraftHandler({ snapshot, isAuthorized: () => true,
      config: continuityDraftConfig({ ...enabledEnv, GITHUB_TOKEN: 'dashboard-secret', EVENTO_CONTINUITY_GITHUB_TOKEN: token }),
      fetchImpl: async () => { calls++; throw new Error('unexpected provider access') },
    })
    const capabilities = await (await handle(new Request('https://owner.example/api/evento/continuity/drafts'))).json()
    assert.equal(capabilities.configured, false)
    assert.equal(capabilities.enabled, false)
    assert.equal((await handle(post())).status, 403)
    assert.equal(calls, 0)
  }
})
test('draft provider calls use only the dedicated credential', async () => {
  const calls = []
  const handle = createContinuityDraftHandler({ snapshot, isAuthorized: () => true,
    config: continuityDraftConfig({ ...enabledEnv, GITHUB_TOKEN: 'dashboard-secret', EVENTO_CONTINUITY_GITHUB_TOKEN: 'draft-secret' }),
    fetchImpl: async (url, init) => {
      calls.push(init)
      if (url.endsWith('/repos/' + repository)) return Response.json({ private: true, full_name: repository })
      if (url.endsWith('/issues/8')) {
        const handoff = (await import('../lib/continuity-handoff.mjs')).createContinuityHandoff(snapshot, 'ev-bot', 'codex', 'CONT-isolation-12345678')
        return Response.json({ number: 8, title: '[EVENTO CONTINUITY][DRAFT] CONT-isolation-12345678', body: JSON.stringify({ evento_continuity_draft_version: 1, state: 'planning', ...handoff }) })
      }
      if (init.method === 'GET') return Response.json([])
      return Response.json({ number: 8 }, { status: 201 })
    },
  })
  const response = await handle(post())
  assert.equal(response.status, 201)
  assert.equal(calls.length, 4)
  for (const call of calls) {
    assert.equal(new Headers(call.headers).get('authorization'), 'Bearer draft-secret')
    assert.ok(!JSON.stringify(call).includes('dashboard-secret'))
  }
  assert.ok(!(await response.text()).includes('draft-secret'))
})
