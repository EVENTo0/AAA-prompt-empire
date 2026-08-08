import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { getProjectRegistry, summarizeRegistry } from '@/lib/project-registry'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: summarizeRegistry(),
    ...getProjectRegistry(),
  }, {
    headers: {
      'Cache-Control': 'no-store, private',
    },
  })
}
