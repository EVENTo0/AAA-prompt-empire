import { jsonResponse, sameOrigin } from '@/lib/http'
import { clearSessionCookies, readAccessToken } from '@/lib/session'
import { accountsEnabled, signOut } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonResponse({ error: 'cross-origin' }, 403)

  const token = await readAccessToken()
  // Cookies are cleared even if upstream revocation fails, so the browser is
  // never left holding a session the user asked to end.
  if (token && accountsEnabled()) await signOut(token)
  await clearSessionCookies()

  return jsonResponse({ ok: true })
}
