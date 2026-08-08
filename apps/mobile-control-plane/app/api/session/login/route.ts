import { NextResponse } from 'next/server'
import { authConfigured, createSessionValue, sessionCookie, validateAccessKey } from '@/lib/auth'

export async function POST(request: Request) {
  if (!authConfigured()) {
    return NextResponse.json({ error: 'Control Plane authentication is not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({})) as { key?: string }
  if (!body.key || !validateAccessKey(body.key)) {
    await new Promise((resolve) => setTimeout(resolve, 350))
    return NextResponse.json({ error: 'Invalid access key.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookie.name, createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: sessionCookie.ttl,
    priority: 'high',
  })
  return response
}
