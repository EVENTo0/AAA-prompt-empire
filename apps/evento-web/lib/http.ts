import 'server-only'

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
}

/**
 * Cookie-authenticated mutations must originate from this site. `Origin` is
 * set by browsers on every cross-site POST, so a missing or mismatched value
 * is rejected rather than assumed friendly.
 *
 * The comparison uses the forwarded/Host header rather than `request.url`:
 * inside a route handler Next.js reports `request.url` with a normalized
 * `localhost` authority, which does not match the real Origin the browser
 * sends and would reject every legitimate request.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    const expected = host.split(',')[0].trim().toLowerCase()
    return new URL(origin).host.toLowerCase() === expected
  } catch {
    return false
  }
}

export async function readJsonBody(request: Request, maxBytes = 16 * 1024): Promise<unknown | null> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > maxBytes) return null
  const text = await request.text()
  if (text.length > maxBytes) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}
