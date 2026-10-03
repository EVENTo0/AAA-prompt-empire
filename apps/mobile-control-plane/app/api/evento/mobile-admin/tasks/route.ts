import { NextRequest, NextResponse } from 'next/server'
import { authorizeMobileAdmin } from '@/lib/mobile-admin'
import { applyRemoteTaskDecision, buildRemoteTask, createRemoteTaskIssue, listRemoteTaskIssues } from '@/lib/remote-task-queue'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!authorizeMobileAdmin(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      tasks: await listRemoteTaskIssues(),
    }, {
      headers: { 'Cache-Control': 'no-store, private' },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not list approved tasks' },
      { status: 400 },
    )
  }
}

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


export async function PATCH(request: NextRequest) {
  if (!authorizeMobileAdmin(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await applyRemoteTaskDecision(await request.json()))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not apply task decision' },
      { status: 400 },
    )
  }
}
