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
