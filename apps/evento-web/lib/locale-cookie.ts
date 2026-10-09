/**
 * Cookie names shared between middleware (edge runtime) and server code.
 * Kept free of `server-only` and `next/headers` imports so middleware can use it.
 */
export const cookieNames = {
  access: 'evento_at',
  refresh: 'evento_rt',
  locale: 'evento_locale',
} as const

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
