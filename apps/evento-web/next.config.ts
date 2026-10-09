import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Production keeps the strictest policy the app can run under: no external
 * origins at all, because the browser only ever talks to this app's own /api
 * routes.
 *
 * Development additionally allows `unsafe-eval` and websocket connections.
 * React's development build uses eval() for debugging features and the dev
 * server uses a websocket for hot reload; without these two exceptions
 * `next dev` serves pages that never hydrate. Neither exception is present in
 * a production response — the security contract tests assert that.
 */
function contentSecurityPolicy() {
  const scriptSrc = isProduction ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'"
  const connectSrc = isProduction ? "'self'" : "'self' ws: wss:"

  return [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    `connect-src ${connectSrc}`,
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
        ],
      },
    ]
  },
}

export default nextConfig
