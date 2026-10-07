import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createContinuityHandoff } from '../lib/continuity-handoff.mjs'

const snapshot = JSON.parse(await readFile(new URL('../data/evento-continuity.v1.json', import.meta.url), 'utf8'))
const canonical = JSON.parse(await readFile(new URL('../../../registry/evento-continuity.v1.json', import.meta.url), 'utf8'))
const id = 'CONT-12345678-abcd'

test('continuity mirror is the same 34-repository source snapshot', () => {
  assert.deepEqual(snapshot, canonical)
  assert.equal(snapshot.projects.filter(p => p.repository).length, 34)
  assert.equal(new Set(snapshot.projects.map(p => p.id)).size, snapshot.projects.length)
})
test('handoff is source-bound, safe and generated for each project', () => {
  for (const p of snapshot.projects) {
    const result = createContinuityHandoff(snapshot, p.id, 'codex', id)
    assert.equal(result.execution, 'handoff-only')
    assert.equal(result.context.source_ref, p.source_ref)
    assert.equal(result.context.revision, snapshot.revision)
    assert.equal(result.task.deployment_trigger, null)
    assert.ok(result.task.forbidden_actions.includes('self-approval'))
    assert.ok(result.prompt.includes('DEFERRED'))
    assert.equal(result.task.status, 'planning')
  }
})
test('unknown project and provider are rejected', () => {
  assert.throws(() => createContinuityHandoff(snapshot, 'unknown', 'codex', id), /Unknown project/)
  assert.throws(() => createContinuityHandoff(snapshot, 'ev-bot', 'unknown', id), /Unknown agent/)
})
test('execution and release activation cannot be smuggled into a handoff', () => {
  for (const key of ['external_execution_enabled', 'production_release_enabled']) {
    const modified = structuredClone(snapshot); modified.policy[key] = true
    assert.throws(() => createContinuityHandoff(modified, 'ev-bot', 'codex', id), /authority/)
  }
})
test('protected company context cannot be labeled as a package', () => {
  const result = createContinuityHandoff(snapshot, 'evento-one', 'claude-code', id)
  assert.equal(result.context.protected_project, true)
  assert.equal(result.task.risk, 'high')
})
test('invalid task identifiers and command injection text are rejected', () => {
  assert.throws(() => createContinuityHandoff(snapshot, 'ev-bot', 'codex', 'CONT-$(rm -rf)'))
})
