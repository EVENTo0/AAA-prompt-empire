import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { runWorkspaceAction, type WorkspaceAction } from '@/lib/workspace-manager'

const allowed = new Set(['create_worktree','open_folder','run_gate','blender_open','unity_open'])

export async function POST(request: NextRequest) {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!allowed.has(body.action)) return NextResponse.json({ error: 'Action not allowed' }, { status: 403 })

    const projectId = typeof body.projectId === 'string' ? body.projectId : ''
    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

    const input = {
      action: body.action,
      projectId,
      suffix: typeof body.suffix === 'string' ? body.suffix : 'next',
      relativePath: typeof body.relativePath === 'string' ? body.relativePath : '.',
    } as WorkspaceAction

    return NextResponse.json({ ok: true, result: await runWorkspaceAction(input) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Workspace action failed' }, { status: 400 })
  }
}
