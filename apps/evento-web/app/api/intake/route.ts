import { validateIntake } from '@/lib/intake'
import { jsonResponse, readJsonBody, sameOrigin } from '@/lib/http'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { accountsEnabled, insertProjectRequest } from '@/lib/supabase'
import { activeAccessToken } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonResponse({ error: 'cross-origin' }, 403)

  const verdict = rateLimit(clientKey(request, 'intake'), MAX_PER_WINDOW, WINDOW_MS)
  if (!verdict.allowed) {
    return jsonResponse({ error: 'rate-limited' }, 429, { 'Retry-After': String(verdict.retryAfterSeconds) })
  }

  const body = await readJsonBody(request)
  if (body === null) return jsonResponse({ error: 'invalid-body' }, 400)

  const validated = validateIntake(body)
  if ('failures' in validated) return jsonResponse({ error: 'validation', failures: validated.failures }, 422)

  if (!accountsEnabled()) {
    // Honest degradation: the form must never report a stored request when no
    // store is connected.
    return jsonResponse({ error: 'not-configured' }, 503)
  }

  // A signed-in client gets the row bound to their account so it appears in
  // their portal; anonymous submissions are still accepted.
  const token = (await activeAccessToken()) ?? undefined
  const result = await insertProjectRequest(validated.record, token)

  if (!result.ok) {
    return jsonResponse({ error: 'store-unavailable' }, result.status === 504 ? 504 : 502)
  }

  return jsonResponse({ reference: validated.record.reference, stage: validated.record.stage }, 201)
}
