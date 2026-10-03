import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { getWorkspaceManagerSnapshot } from '@/lib/workspace-manager'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getWorkspaceManagerSnapshot())
}
