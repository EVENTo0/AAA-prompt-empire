import 'server-only'

/**
 * Per-instance fixed-window limiter.
 *
 * Limitation, stated rather than hidden: this counter lives in the memory of a
 * single server instance. It raises the cost of casual form abuse, it is not a
 * distributed control, and it must not be treated as one. A production
 * deployment behind multiple instances needs an upstream edge/WAF rule or a
 * shared store; see ARCHITECTURE.md.
 */

type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()
const MAX_TRACKED_KEYS = 10_000

export type RateLimitVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitVerdict {
  const existing = windows.get(key)

  if (!existing || existing.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_KEYS) evictExpired(now)
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) }
  }

  existing.count += 1
  return { allowed: true }
}

function evictExpired(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
  // If every window is still live, drop the oldest entries so memory stays bounded.
  if (windows.size >= MAX_TRACKED_KEYS) {
    const overflow = windows.size - Math.floor(MAX_TRACKED_KEYS / 2)
    let removed = 0
    for (const key of windows.keys()) {
      windows.delete(key)
      if (++removed >= overflow) break
    }
  }
}

/** Best-effort client identity for throttling only — never for authorization. */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const real = request.headers.get('x-real-ip')?.trim()
  return `${scope}:${forwarded || real || 'unknown'}`
}

export function resetRateLimits() {
  windows.clear()
}
