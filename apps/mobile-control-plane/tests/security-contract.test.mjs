import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)

async function text(path) { return readFile(new URL(path, root), 'utf8') }

test('provider secrets are never declared as NEXT_PUBLIC variables', async () => {
  const env = await text('.env.example')
  for (const name of ['GITHUB_TOKEN','VERCEL_TOKEN','SUPABASE_ACCESS_TOKEN','EVENTO_CATALOG_TOKEN','CONTROL_PLANE_ACCESS_KEY','CONTROL_PLANE_SESSION_SECRET','EVENTO_LOCAL_DAEMON_TOKEN','EVENTO_LOCAL_DAEMON_WRITE_TOKEN']) {
    assert.ok(env.includes(`${name}=`), `${name} must be documented`)
    assert.ok(!env.includes(`NEXT_PUBLIC_${name}`), `${name} must remain server-only`)
  }
})

test('write actions default to disabled and require explicit confirmation', async () => {
  const env = await text('.env.example')
  const route = await text('app/api/actions/route.ts')
  assert.match(env, /CONTROL_PLANE_ENABLE_WRITES=false/)
  assert.match(route, /body\.confirmation !== body\.type/)
  assert.match(route, /configuredRepositories\(\)\.includes\(body\.repo\)/)
})

test('PWA service worker never caches API responses', async () => {
  const sw = await text('public/sw.js')
  assert.match(sw, /pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /request\.mode === 'navigate'/)
  assert.match(sw, /caches\.match\('\/offline'\)/)
})


test('workspace action bridge keeps local write credentials server-only and allowlists actions', async () => {
  const env = await text('.env.example')
  const route = await text('app/api/evento/workspaces/action/route.ts')
  assert.ok(!env.includes('NEXT_PUBLIC_EVENTO_LOCAL_DAEMON_TOKEN'))
  assert.ok(!env.includes('NEXT_PUBLIC_EVENTO_LOCAL_DAEMON_WRITE_TOKEN'))
  assert.match(route, /const allowed = new Set/)
  assert.match(route, /create_worktree/)
  assert.match(route, /open_folder/)
  assert.match(route, /blender_open/)
  assert.match(route, /unity_open/)
})
