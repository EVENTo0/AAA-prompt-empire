import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createContinuityDraftHandler } from '../lib/continuity-drafts.mjs'
import { createContinuityHandoff } from '../lib/continuity-handoff.mjs'
const snapshot = JSON.parse(await readFile(new URL('../data/evento-continuity.v1.json', import.meta.url), 'utf8'))
const repository = 'EVENTo0/Private-journal-fixture'
const taskId = 'CONT-fixture-12345678'
const body = { projectId: 'ev-bot', adapter: 'codex', taskId, confirmation: 'save_continuity_draft' }
const config = { repository, token: 'fixture-server-secret', writesEnabled: true, draftsEnabled: true }
function request(value = body, headers = {}, method = 'POST') {
  return new Request('https://owner.example/api/evento/continuity/drafts', { method, headers: { origin: 'https://owner.example', 'x-empire-action': '1', 'sec-fetch-site': 'same-origin', ...headers }, ...(method === 'POST' ? { body: typeof value === 'string' ? value : JSON.stringify(value) } : {}) })
}
function setup(options = {}) {
  const calls = []; const issues = options.issues || []
  const fetchImpl = async (url, init) => {
    calls.push({ url, ...init })
    if (options.failure) throw new Error('provider leaked fixture-server-secret')
    if (url.endsWith('/repos/' + repository)) return Response.json({ full_name: repository, private: options.private !== false })
    if (init.method === 'GET' && /\/issues\/\d+$/.test(url)) return options.mismatchedReadback ? Response.json({ number: 72, title: 'wrong', body: '{}' }) : Response.json(issues.find(i => url.endsWith('/issues/' + i.number)) ?? {}, { status: options.readbackFailure ? 404 : 200 })
    if (init.method === 'GET') return Response.json(issues)
    const payload = JSON.parse(init.body); const issue = { number: 72, ...payload }; issues.push(issue); return Response.json(issue, { status: 201 })
  }
  return { calls, issues, handle: createContinuityDraftHandler({ snapshot, isAuthorized: () => options.authorized !== false, config: { ...config, ...options.config }, fetchImpl }) }
}
test('anonymous access cannot inspect configuration or contact GitHub', async () => {
  const { handle, calls } = setup({ authorized: false })
  for (const method of ['GET', 'POST']) assert.equal((await handle(request(body, {}, method))).status, 401)
  assert.equal(calls.length, 0)
})
test('all draft writes default-deny and require same-origin explicit confirmation', async () => {
  for (const options of [{ config: { writesEnabled: false } }, { config: { draftsEnabled: false } }, { config: { token: '' } }, { config: { repository: 'another-owner/journal' } }]) {
    const { handle, calls } = setup(options); assert.equal((await handle(request())).status, 403); assert.equal(calls.length, 0)
  }
  for (const headers of [{ origin: 'https://attacker.example' }, { 'x-empire-action': '' }, { 'sec-fetch-site': 'cross-site' }]) {
    const { handle, calls } = setup(); assert.equal((await handle(request(body, headers))).status, 403); assert.equal(calls.length, 0)
  }
  const { handle, calls } = setup(); assert.equal((await handle(request({ ...body, confirmation: '' }))).status, 400); assert.equal(calls.length, 0)
})
test('untrusted objective/release/target and malformed inputs never reach providers', async () => {
  for (const value of [{ ...body, objective: 'override' }, { ...body, release: true }, { ...body, repository: 'other/repo' }, { ...body, projectId: 'unknown' }, { ...body, adapter: 'shell' }, { ...body, taskId: [taskId] }, '{', []]) {
    const { handle, calls } = setup(); assert.equal((await handle(request(value))).status, 400); assert.equal(calls.length, 0)
  }
  const { handle, calls } = setup(); assert.equal((await handle(request('x'.repeat(4097)))).status, 413); assert.equal(calls.length, 0)
})
test('public repositories are rejected before any issue creation', async () => {
  const { handle, calls } = setup({ private: false }); assert.equal((await handle(request())).status, 409)
  assert.equal(calls.length, 1); assert.equal(calls[0].method, 'GET')
})
test('private draft persists the canonical handoff and never approves execution', async () => {
  const { handle, calls } = setup(); const response = await handle(request()); assert.equal(response.status, 201)
  const result = await response.json(); assert.equal(result.execution, 'handoff-only'); assert.equal(result.state, 'planning')
  assert.equal(result.issue.url, `https://github.com/${repository}/issues/72`)
  const write = calls.find(c => c.method === 'POST'); const payload = JSON.parse(write.body); const stored = JSON.parse(payload.body)
  assert.equal(payload.title, `[EVENTO CONTINUITY][DRAFT] ${taskId}`); assert.ok(!payload.title.startsWith('[EVENTO TASK][APPROVED]'))
  assert.equal(stored.task.status, 'planning'); assert.deepEqual(stored.context, createContinuityHandoff(snapshot, body.projectId, body.adapter, taskId).context)
  assert.ok(!stored.task.allowed_actions.includes('production-migration')); assert.ok(!payload.body.includes(config.token))
})
test('missing or mismatched independent read-back never produces a success receipt', async () => {
  for (const opt of [{ readbackFailure: true }, { mismatchedReadback: true }]) {
    const { handle, calls } = setup(opt)
    const response = await handle(request())
    assert.notEqual(response.status, 201)
    assert.equal(calls.filter(c => c.method === 'POST').length, 1)
    assert.equal(calls.filter(c => /\/issues\/72$/.test(c.url)).length, 1)
    assert.ok(!(await response.text()).includes(config.token))
  }
})
test('recent retry reuses the same receipt; conflicting context is rejected', async () => {
  const { handle, calls } = setup(); await handle(request())
  assert.equal((await handle(request())).status, 200)
  assert.equal((await handle(request({ ...body, projectId: 'aaa-prompt-empire' }))).status, 409)
  assert.equal(calls.filter(c => c.method === 'POST').length, 1)
})
test('overlapping same-instance requests share one provider write', async () => {
  const { handle, calls } = setup()
  const results = await Promise.all([handle(request()), handle(request())]); assert.ok(results.every(r => r.status === 201))
  assert.equal(calls.filter(c => c.method === 'POST').length, 1)
  const receipts = await Promise.all(results.map(r => r.json())); assert.deepEqual(receipts[0], receipts[1])
})
test('configuration and provider failure responses contain no credential', async () => {
  const { handle } = setup({ failure: true })
  for (const req of [request(body, {}, 'GET'), request()]) assert.ok(!(await (await handle(req)).text()).includes(config.token))
})
