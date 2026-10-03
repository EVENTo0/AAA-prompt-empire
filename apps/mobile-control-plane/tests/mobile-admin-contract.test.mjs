import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
async function text(path) { return readFile(new URL(path, root), 'utf8') }

test('mobile admin API uses a dedicated bearer secret and remains plan-only', async () => {
  const lib = await text('lib/mobile-admin.ts')
  const overview = await text('app/api/evento/mobile-admin/overview/route.ts')
  const command = await text('app/api/evento/mobile-admin/command/route.ts')

  assert.match(lib, /EVENTO_ADMIN_MOBILE_TOKEN/)
  assert.match(lib, /timingSafeEqual/)
  assert.match(lib, /\['plan','verify','preview'\]/)
  assert.match(lib, /repositoryWrites: false/)
  assert.match(lib, /desktopActions: false/)
  assert.match(lib, /release: false/)
  assert.match(lib, /execution: 'plan-only'/)
  assert.match(overview, /authorizeMobileAdmin/)
  assert.match(command, /authorizeMobileAdmin/)
  assert.ok(!overview.includes('isAuthorized('))
  assert.ok(!command.includes('isAuthorized('))
})
