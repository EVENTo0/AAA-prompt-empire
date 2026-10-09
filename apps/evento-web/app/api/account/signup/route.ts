import { jsonResponse, readJsonBody, sameOrigin } from '@/lib/http'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { accountsEnabled, signInWithPassword, signUp } from '@/lib/supabase'
import { writeSessionCookies } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIN_PASSWORD_LENGTH = 12
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonResponse({ error: 'cross-origin' }, 403)
  if (!accountsEnabled()) return jsonResponse({ error: 'not-configured' }, 503)

  const verdict = rateLimit(clientKey(request, 'signup'), 4, 60 * 60 * 1000)
  if (!verdict.allowed) {
    return jsonResponse({ error: 'rate-limited' }, 429, { 'Retry-After': String(verdict.retryAfterSeconds) })
  }

  const body = (await readJsonBody(request, 4096)) as { email?: unknown; password?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!EMAIL_RE.test(email) || email.length > 254) return jsonResponse({ error: 'invalid-email' }, 422)
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 200) {
    return jsonResponse({ error: 'weak-password' }, 422)
  }

  const created = await signUp(email, password)
  if (!created.ok) {
    if (created.status === 504) return jsonResponse({ error: 'timeout' }, 504)
    if (created.status >= 500) return jsonResponse({ error: 'upstream' }, 502)
    // Includes "already registered". Returning a generic confirmation keeps
    // the endpoint from confirming which addresses exist.
    return jsonResponse({ ok: true, needsConfirmation: true })
  }

  // When the project does not require email confirmation the credentials work
  // immediately, so sign the client straight in. Otherwise ask them to confirm.
  const session = await signInWithPassword(email, password)
  if (!session.ok) return jsonResponse({ ok: true, needsConfirmation: true })

  await writeSessionCookies(session.data)
  return jsonResponse({ ok: true, needsConfirmation: false }, 201)
}
