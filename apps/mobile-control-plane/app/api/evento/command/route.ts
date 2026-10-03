import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { buildEventoPlan, type CommandMode } from '@/lib/evento-orchestrator'

const modes = new Set<CommandMode>(['continue','plan','build','verify','preview','learn','release'])

export async function POST(request: NextRequest) {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const prompt = typeof body.prompt === 'string' ? body.prompt : ''
    const mode = modes.has(body.mode) ? body.mode as CommandMode : 'continue'
    const projectId = typeof body.projectId === 'string' && body.projectId ? body.projectId : undefined
    const plan = buildEventoPlan({ prompt, mode, projectId })

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      execution: plan.allowedToExecute ? 'authorized-by-contract' : 'plan-only',
      plan,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create EVENTO command plan' },
      { status: 400 },
    )
  }
}
