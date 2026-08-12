import { jsonResponse, readJsonBody, sameOrigin } from '@/lib/http'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { accountsEnabled, signInWithPassword } from '@/lib/supabase'
import { writeSessionCookies } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonResponse({ error: 'cross-origin' }, 403)
  if (!accountsEnabled()) return jsonResponse({ error: 'not-configured' }, 503)

  const verdict = rateLimit(clientKey(request, 'login'), 8, 10 * 60 * 1000)
  if (!verdict.allowed) {
    return jsonResponse({ error: 'rate-limited' }, 429, { 'Retry-After': String(verdict.retryAfterSeconds) })
  }

  const body = (await readJsonBody(request, 4096)) as { email?: unknown; password?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || !password) return jsonResponse({ error: 'invalid-credentials' }, 400)

  const result = await signInWithPassword(email, password)
  if (!result.ok) {
    // Upstream wording is never forwarded: it can distinguish "unknown user"
    // from "wrong password" and enable account enumeration.
    if (result.status === 504) return jsonResponse({ error: 'timeout' }, 504)
    if (result.status >= 500) return jsonResponse({ error: 'upstream' }, 502)
    return jsonResponse({ error: 'invalid-credentials' }, 401)
  }

  await writeSessionCookies(result.data)
  return jsonResponse({ ok: true })
}
