import { NextRequest, NextResponse } from 'next/server'
import { authorizeMobileAdmin, mobileOverview } from '@/lib/mobile-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!authorizeMobileAdmin(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(mobileOverview(), {
    headers: { 'Cache-Control': 'no-store, private' },
  })
}
