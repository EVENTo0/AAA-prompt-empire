import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

const root = new URL('../', import.meta.url)

async function text(path) {
  return readFile(new URL(path, root), 'utf8')
}

/** Every route handler that mutates state or reads a session. */
const MUTATING_ROUTES = [
  'app/api/intake/route.ts',
  'app/api/account/login/route.ts',
  'app/api/account/signup/route.ts',
  'app/api/account/logout/route.ts',
]

test('no provider credential is exposed to the browser', async () => {
  const env = await text('.env.example')
  // Only declaration lines matter; the file's prose explains why the prefix is
  // banned and must be allowed to name it.
  const declared = env
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  for (const line of declared) {
    assert.ok(!line.startsWith('NEXT_PUBLIC_'), `${line} would be published to the client bundle`)
  }
  for (const name of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY']) {
    assert.ok(
      declared.some((line) => line.startsWith(`${name}=`)),
      `${name} must be documented`,
    )
  }

  // The ban also has to hold in code, not just in the template.
  for (const [path, body] of await sourceFiles()) {
    assert.ok(!/NEXT_PUBLIC_/.test(body), `${path} must not read a client-exposed environment variable`)
  }
})

test('a service-role key is never read by this application', async () => {
  const files = await sourceFiles()
  for (const [path, body] of files) {
    assert.ok(
      !/SERVICE_ROLE|service_role_key|SUPABASE_SECRET/.test(body),
      `${path} must not reference a service-role credential; authorization relies on row level security`,
    )
  }
})

test('provider access is confined to server-only modules', async () => {
  const supabase = await text('lib/supabase.ts')
  const session = await text('lib/session.ts')
  for (const [name, body] of [
    ['lib/supabase.ts', supabase],
    ['lib/session.ts', session],
    ['lib/rate-limit.ts', await text('lib/rate-limit.ts')],
    ['lib/http.ts', await text('lib/http.ts')],
  ]) {
    assert.match(body, /^import 'server-only'/m, `${name} must be marked server-only`)
  }
})

test('client components never import server-only modules', async () => {
  const files = await sourceFiles()
  for (const [path, body] of files) {
    if (!/^'use client'/m.test(body)) continue
    for (const forbidden of ['@/lib/supabase', '@/lib/session', '@/lib/rate-limit', '@/lib/http']) {
      assert.ok(!body.includes(forbidden), `${path} is a client component and must not import ${forbidden}`)
    }
  }
})

test('every mutating route rejects cross-origin requests', async () => {
  for (const path of MUTATING_ROUTES) {
    const body = await text(path)
    assert.match(body, /if \(!sameOrigin\(request\)\) return jsonResponse\(\{ error: 'cross-origin' \}, 403\)/, path)
  }
})

test('the origin check compares against the forwarded host, not request.url', async () => {
  const http = await text('lib/http.ts')
  assert.match(http, /x-forwarded-host/, 'request.url reports a normalized localhost authority in route handlers')
  assert.ok(!/new URL\(request\.url\)\.host/.test(http), 'request.url must not be used as the expected origin')
})

test('credential endpoints are rate limited', async () => {
  for (const path of ['app/api/intake/route.ts', 'app/api/account/login/route.ts', 'app/api/account/signup/route.ts']) {
    const body = await text(path)
    assert.match(body, /rateLimit\(clientKey\(request, '[a-z]+'\)/, `${path} must throttle attempts`)
    assert.match(body, /429/, `${path} must answer 429 when throttled`)
  }
})

test('authentication failures never leak whether an account exists', async () => {
  const login = await text('app/api/account/login/route.ts')
  const signup = await text('app/api/account/signup/route.ts')
  assert.ok(
    !/result\.error/.test(login.split('writeSessionCookies')[0]),
    'upstream auth wording must not be forwarded to the client',
  )
  assert.match(login, /error: 'invalid-credentials'/)
  assert.match(signup, /needsConfirmation: true/, 'an already-registered address must get the same answer as a new one')
})

test('session cookies are HttpOnly, SameSite=Strict and expire', async () => {
  const session = await text('lib/session.ts')
  assert.match(session, /httpOnly: true/)
  assert.match(session, /sameSite: 'strict'/)
  assert.match(session, /secure: process\.env\.NODE_ENV === 'production'/)
  assert.match(session, /maxAge/)
})

test('signing out clears cookies even when upstream revocation fails', async () => {
  const logout = await text('app/api/account/logout/route.ts')
  const clearIndex = logout.indexOf('clearSessionCookies()')
  assert.ok(clearIndex > 0, 'logout must clear cookies')
  assert.ok(
    !/await signOut\(token\)\s*\n\s*return/.test(logout),
    'cookie clearing must not be skipped when revocation throws or fails',
  )
})

test('the service worker never caches API responses or the account area', async () => {
  const sw = await text('public/sw.js')
  assert.match(sw, /pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /pathname\.includes\('\/account'\)/)
  assert.match(sw, /request\.mode === 'navigate'/)
  // Navigations must be network-first so a cached page is never presented as
  // live evidence.
  const navBlock = sw.slice(sw.indexOf("request.mode === 'navigate'"))
  assert.ok(
    navBlock.indexOf('fetch(request)') < navBlock.indexOf('caches.match'),
    'navigation handling must try the network before the offline copy',
  )
})

test('the response security headers stay locked down', async () => {
  const config = await text('next.config.ts')
  for (const directive of [
    "default-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]) {
    assert.ok(config.includes(directive), `CSP must keep ${directive}`)
  }
  assert.match(config, /X-Content-Type-Options/)
  assert.match(config, /Strict-Transport-Security/)
  assert.match(config, /poweredByHeader: false/)
})

test('the production CSP allows no eval and no external connections', async () => {
  // The development policy is deliberately looser so `next dev` can hydrate;
  // the shipped policy must not inherit those exceptions. The flag is read at
  // module load, so it has to be set before the first import of the config.
  process.env.NODE_ENV = 'production'
  const { default: config } = await import('../next.config.ts')
  const headers = await config.headers()
  const csp = headers[0].headers.find((header) => header.key === 'Content-Security-Policy').value

  assert.ok(!csp.includes('unsafe-eval'), `production CSP must not allow eval: ${csp}`)
  assert.ok(!/connect-src[^;]*ws/.test(csp), `production CSP must not allow websockets: ${csp}`)
  assert.match(csp, /connect-src 'self'(;|$)/, 'the browser may only call this app')
})

test('the account area is excluded from search indexing', async () => {
  const robots = await text('app/robots.ts')
  assert.match(robots, /\/ar\/account/)
  assert.match(robots, /\/en\/account/)
  assert.match(robots, /'\/api\/'/)
  const account = await text('app/[locale]/account/page.tsx')
  assert.match(account, /robots: \{ index: false, follow: false \}/)
})

test('the database migration is not silently applied and keeps RLS on', async () => {
  const migration = await text('supabase/migrations/0001_project_requests.sql')
  assert.match(migration, /STATUS: NOT APPLIED/, 'the migration must state that it has not been run')
  assert.match(migration, /enable row level security/)
  assert.match(migration, /new\.owner_id := auth\.uid\(\)/, 'ownership must be assigned server-side')
  assert.match(migration, /using \(owner_id = auth\.uid\(\)\)/, 'clients may read only their own requests')
  assert.ok(
    !/for (update|delete)/i.test(migration),
    'clients must not be granted update or delete on submitted requests',
  )
})

async function sourceFiles() {
  const out = []
  for (const dir of ['app', 'components', 'lib']) {
    for (const entry of await readdir(new URL(`${dir}/`, root), { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue
      if (!/\.(ts|tsx|mjs)$/.test(entry.name)) continue
      const path = `${entry.parentPath ?? entry.path}/${entry.name}`
      out.push([path, await readFile(path, 'utf8')])
    }
  }
  return out
}
