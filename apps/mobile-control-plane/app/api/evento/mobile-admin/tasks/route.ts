import { NextRequest, NextResponse } from 'next/server'
import { authorizeMobileAdmin } from '@/lib/mobile-admin'
import { buildRemoteTask, createRemoteTaskIssue } from '@/lib/remote-task-queue'

export async function POST(request: NextRequest) {
  if (!authorizeMobileAdmin(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const task = buildRemoteTask(await request.json())
    const created = await createRemoteTaskIssue(task)
    return NextResponse.json({ ok: true, ...created }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create approved task' },
      { status: 400 },
    )
  }
}
