import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { configuredRepositories } from '@/lib/control-plane'

type ActionRequest =
  | { type: 'rerun_failed'; repo: string; runId: number; confirmation: string }
  | { type: 'dispatch_workflow'; repo: string; workflow: string; ref?: string; confirmation: string }
  | { type: 'vercel_deploy_hook'; project: string; confirmation: string }

function writesEnabled() {
  return process.env.CONTROL_PLANE_ENABLE_WRITES === 'true'
}

function githubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
    'X-GitHub-Api-Version': '2026-03-10',
  }
}

async function call(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fetchSite = request.headers.get('sec-fetch-site')
  if (request.headers.get('x-empire-action') !== '1' || (fetchSite && fetchSite !== 'same-origin')) {
    return NextResponse.json({ error: 'Invalid action origin.' }, { status: 403 })
  }
  if (!writesEnabled()) return NextResponse.json({ error: 'Write actions are disabled by policy.' }, { status: 403 })

  const body = await request.json().catch(() => null) as ActionRequest | null
  if (!body) return NextResponse.json({ error: 'Invalid action request.' }, { status: 400 })
  if (body.confirmation !== body.type) return NextResponse.json({ error: 'Explicit confirmation is required.' }, { status: 400 })

  try {
    if (body.type === 'rerun_failed') {
      if (!configuredRepositories().includes(body.repo)) throw new Error('Repository is not allowlisted')
      await call(`https://api.github.com/repos/${body.repo}/actions/runs/${body.runId}/rerun-failed-jobs`, {
        method: 'POST', headers: githubHeaders(),
      })
    }

    if (body.type === 'dispatch_workflow') {
      if (!configuredRepositories().includes(body.repo)) throw new Error('Repository is not allowlisted')
      const allowed = (process.env.CONTROL_PLANE_ALLOWED_WORKFLOWS ?? '').split(',').map((x) => x.trim()).filter(Boolean)
      if (!allowed.includes(body.workflow)) throw new Error('Workflow is not allowlisted')
      await call(`https://api.github.com/repos/${body.repo}/actions/workflows/${encodeURIComponent(body.workflow)}/dispatches`, {
        method: 'POST',
        headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: body.ref || 'main' }),
      })
    }

    if (body.type === 'vercel_deploy_hook') {
      const hooks = JSON.parse(process.env.VERCEL_DEPLOY_HOOKS_JSON || '{}') as Record<string, string>
      const hook = hooks[body.project]
      if (!hook || !hook.startsWith('https://api.vercel.com/')) throw new Error('Deploy hook is not allowlisted')
      await call(hook, { method: 'POST' })
    }

    console.info(JSON.stringify({ event: 'empire_control_plane_action', type: body.type, acceptedAt: new Date().toISOString() }))
    return NextResponse.json({ ok: true, acceptedAt: new Date().toISOString() }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 400 })
  }
}
