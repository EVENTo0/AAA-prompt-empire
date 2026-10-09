import 'server-only'
import { cookies } from 'next/headers'
import { currentUser, refreshSession, type TokenResponse } from '@/lib/supabase'
import { cookieNames } from '@/lib/locale-cookie'

const ACCESS_COOKIE = cookieNames.access
const REFRESH_COOKIE = cookieNames.refresh

/** Refresh tokens live longer than access tokens but still expire. */
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 14

const baseCookie = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const

export { cookieNames }

export type SessionUser = { id: string; email: string | null }

export async function writeSessionCookies(tokens: TokenResponse) {
  const store = await cookies()
  store.set(ACCESS_COOKIE, tokens.access_token, {
    ...baseCookie,
    maxAge: Math.max(60, Math.min(tokens.expires_in, 60 * 60)),
  })
  store.set(REFRESH_COOKIE, tokens.refresh_token, { ...baseCookie, maxAge: REFRESH_TTL_SECONDS })
}

export async function clearSessionCookies() {
  const store = await cookies()
  store.set(ACCESS_COOKIE, '', { ...baseCookie, maxAge: 0 })
  store.set(REFRESH_COOKIE, '', { ...baseCookie, maxAge: 0 })
}

export async function readAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value ?? null
}

/**
 * Returns a usable access token, transparently exchanging the refresh token
 * when the access token has expired. Returns null when the visitor has no
 * valid session — callers must treat that as anonymous, never as an error.
 */
export async function activeAccessToken(): Promise<string | null> {
  const store = await cookies()
  const access = store.get(ACCESS_COOKIE)?.value
  if (access) {
    const probe = await currentUser(access)
    if (probe.ok) return access
    if (probe.status !== 401 && probe.status !== 403) return null
  }

  const refresh = store.get(REFRESH_COOKIE)?.value
  if (!refresh) return null

  const renewed = await refreshSession(refresh)
  if (!renewed.ok) {
    await clearSessionCookies()
    return null
  }

  await writeSessionCookies(renewed.data)
  return renewed.data.access_token
}

export async function currentSessionUser(): Promise<SessionUser | null> {
  const token = await activeAccessToken()
  if (!token) return null
  const result = await currentUser(token)
  return result.ok ? { id: result.data.id, email: result.data.email } : null
}
