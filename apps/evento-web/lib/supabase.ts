import 'server-only'

/**
 * Minimal server-side Supabase REST adapter.
 *
 * The app deliberately talks to the Auth and PostgREST endpoints with `fetch`
 * instead of pulling in a client SDK:
 *
 * 1. no provider key is ever shipped to the browser, so the CSP can stay at
 *    `connect-src 'self'`;
 * 2. the dependency surface of a public marketing site stays at zero runtime
 *    packages beyond the framework;
 * 3. row level security remains the single authorization mechanism, because
 *    every request carries the end user's own access token and never a
 *    service-role key.
 */

const AUTH_TIMEOUT_MS = 8_000

export type SupabaseConfig = {
  url: string
  publishableKey: string
}

export function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim()
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !publishableKey) return null
  if (!isAllowedEndpoint(url)) return null
  return { url: url.replace(/\/$/, ''), publishableKey }
}

/**
 * Production traffic must be HTTPS — access tokens travel on these requests.
 * Plaintext loopback is accepted only outside production, so the auth and
 * intake flows can be exercised against a local protocol stub in development
 * and CI without relaxing anything that ships.
 */
export function isAllowedEndpoint(candidate: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return false
  }
  if (parsed.protocol === 'https:') return true
  if (process.env.NODE_ENV === 'production') return false
  return parsed.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)
}

export function accountsEnabled() {
  return supabaseConfig() !== null
}

export type SupabaseResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

async function request<T>(
  path: string,
  init: RequestInit & { accessToken?: string },
): Promise<SupabaseResult<T>> {
  const config = supabaseConfig()
  if (!config) return { ok: false, status: 503, error: 'not-configured' }

  const { accessToken, headers, ...rest } = init
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.url}${path}`, {
      ...rest,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${accessToken ?? config.publishableKey}`,
        'Content-Type': 'application/json',
        ...(headers as Record<string, string> | undefined),
      },
    })

    const text = await response.text()
    const payload = text ? (JSON.parse(text) as unknown) : null

    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && payload !== null
          ? String(
              (payload as Record<string, unknown>).error_description ??
                (payload as Record<string, unknown>).msg ??
                (payload as Record<string, unknown>).message ??
                (payload as Record<string, unknown>).error ??
                'request-failed',
            )
          : 'request-failed'
      return { ok: false, status: response.status, error: message }
    }

    return { ok: true, data: payload as T }
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError'
    return { ok: false, status: aborted ? 504 : 502, error: aborted ? 'timeout' : 'upstream-unreachable' }
  } finally {
    clearTimeout(timer)
  }
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; email: string | null }
}

export function signUp(email: string, password: string) {
  return request<{ id?: string; user?: { id: string } }>('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function signInWithPassword(email: string, password: string) {
  return request<TokenResponse>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function refreshSession(refreshToken: string) {
  return request<TokenResponse>('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function signOut(accessToken: string) {
  return request<null>('/auth/v1/logout', { method: 'POST', accessToken, body: '{}' })
}

export function currentUser(accessToken: string) {
  return request<{ id: string; email: string | null }>('/auth/v1/user', { method: 'GET', accessToken })
}

export type ProjectRequestRow = {
  id: string
  reference: string
  created_at: string
  service_id: string
  engagement_id: string
  stage: string
  summary: string
  organization: string | null
}

export function insertProjectRequest(
  row: Record<string, unknown>,
  accessToken?: string,
): Promise<SupabaseResult<ProjectRequestRow[]>> {
  return request<ProjectRequestRow[]>('/rest/v1/project_requests', {
    method: 'POST',
    accessToken,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
}

export function listOwnProjectRequests(accessToken: string) {
  const select = 'id,reference,created_at,service_id,engagement_id,stage,summary,organization'
  return request<ProjectRequestRow[]>(
    `/rest/v1/project_requests?select=${select}&order=created_at.desc&limit=50`,
    { method: 'GET', accessToken },
  )
}
