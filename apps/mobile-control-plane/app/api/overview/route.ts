import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { buildOverview } from '@/lib/control-plane'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await buildOverview(), {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  })
}
