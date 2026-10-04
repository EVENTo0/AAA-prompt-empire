import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
async function text(path) { return readFile(new URL(path, root), 'utf8') }

test('remote task queue is gated and release is hard-disabled', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  const route = await text('app/api/evento/mobile-admin/tasks/route.ts')
  assert.match(lib, /EVENTO_REMOTE_TASKS_ENABLED/)
  assert.match(lib, /release: false/)
  assert.match(lib, /\['build','verify','preview'\]/)
  assert.match(lib, /\['auto','codex','claude-code'\]/)
  assert.match(route, /authorizeMobileAdmin/)
})

test('remote task issue body contains structured task JSON only', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  assert.match(lib, /body: JSON\.stringify\(task, null, 2\)/)
  assert.ok(!lib.includes('CONTROL_PLANE_ACCESS_KEY'))
})


test('remote task status supports audited PR-open handoff without release', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  assert.match(lib, /\[EVENTO TASK\]\[PR-OPEN\]/)
  assert.match(lib, /'pr-open'/)
  assert.match(lib, /release !== false/)
  assert.ok(!lib.includes('merge_pull_request'))
})


test('mobile review decisions are audit-only and cannot merge or release', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  const route = await text('app/api/evento/mobile-admin/tasks/route.ts')
  assert.match(lib, /request-revision/)
  assert.match(lib, /approve-merge-handoff/)
  assert.match(lib, /MERGE-HANDOFF-APPROVED/)
  assert.match(lib, /REVISION-REQUESTED/)
  assert.match(lib, /merge: false/)
  assert.match(lib, /deploy: false/)
  assert.match(lib, /release: false/)
  assert.match(route, /export async function PATCH/)
  assert.ok(!lib.includes('merge_pull_request'))
})

test('task listing surfaces evidence and PR handoff metadata', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  assert.match(lib, /EVENTO execution evidence/)
  assert.match(lib, /EVENTO PR handoff/)
  assert.match(lib, /evidenceSummary/)
  assert.match(lib, /prUrl/)
})


test('merge readiness is surfaced as audit metadata only', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  assert.match(lib, /EVENTO merge readiness/)
  assert.match(lib, /EVENTO_MERGE_READINESS_JSON=/)
  assert.match(lib, /mergeReadiness/)
  assert.match(lib, /mergeReadinessAt/)
  assert.ok(!lib.includes('merge_pull_request'))
})


test('protected merge state is visible but release remains false', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  assert.match(lib, /\[EVENTO TASK\]\[MERGED\]/)
  assert.match(lib, /'merged'/)
  assert.match(lib, /EVENTO protected merge/)
  assert.match(lib, /mergeSummary/)
  assert.ok(!lib.includes('deploy_production'))
})


test('post-merge verification and deploy readiness remain non-release gates', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  assert.match(lib, /MERGED-VERIFIED/)
  assert.match(lib, /merged-verified/)
  assert.match(lib, /EVENTO post-merge verification/)
  assert.match(lib, /EVENTO_POST_MERGE_JSON=/)
  assert.match(lib, /EVENTO deploy readiness/)
  assert.match(lib, /EVENTO_DEPLOY_READINESS_JSON=/)
  assert.match(lib, /postMergeVerification/)
  assert.match(lib, /deployReadiness/)
  assert.ok(!lib.includes('production_deploy'))
})


test('preview deploy evidence is surfaced without production release', async () => {
  const lib = await text('lib/remote-task-queue.ts')
  assert.match(lib, /PREVIEW-VERIFIED/)
  assert.match(lib, /preview-verified/)
  assert.match(lib, /EVENTO preview deploy/)
  assert.match(lib, /EVENTO_PREVIEW_DEPLOY_JSON=/)
  assert.match(lib, /previewDeploy/)
  assert.match(lib, /previewDeployAt/)
  assert.ok(!lib.includes('promote_preview'))
})
