import { getProjectRegistry } from '@/lib/project-registry'

export type RemoteTaskMode = 'build' | 'verify' | 'preview'
export type RemoteTaskAgent = 'auto' | 'codex' | 'claude-code'

export type RemoteTaskEnvelope = {
  evento_task_version: 1
  state: 'approved'
  project_id: string
  repository: string
  objective: string
  mode: RemoteTaskMode
  preferred_agent: RemoteTaskAgent
  release: false
  approved_at: string
  approved_via: 'android-admin'
}

function taskRepo() {
  return process.env.EVENTO_TASK_REPOSITORY || 'EVENTo0/AAA-prompt-empire'
}

function githubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2026-03-10',
  }
}

export function remoteTasksEnabled() {
  return process.env.EVENTO_REMOTE_TASKS_ENABLED === 'true' && Boolean(process.env.GITHUB_TOKEN)
}

export function buildRemoteTask(input: {
  projectId?: string
  objective?: string
  mode?: string
  preferredAgent?: string
}): RemoteTaskEnvelope {
  const objective = typeof input.objective === 'string' ? input.objective.trim() : ''
  if (!objective || objective.length > 4000) throw new Error('Objective is required and must be 4000 characters or less')

  const mode: RemoteTaskMode = ['build','verify','preview'].includes(input.mode ?? '')
    ? input.mode as RemoteTaskMode
    : 'build'
  const preferredAgent: RemoteTaskAgent = ['auto','codex','claude-code'].includes(input.preferredAgent ?? '')
    ? input.preferredAgent as RemoteTaskAgent
    : 'auto'

  const project = getProjectRegistry().projects.find((item) => item.id === input.projectId)
  if (!project || !project.repository) throw new Error('Project must be registered with a repository')

  return {
    evento_task_version: 1,
    state: 'approved',
    project_id: project.id,
    repository: project.repository,
    objective,
    mode,
    preferred_agent: preferredAgent,
    release: false,
    approved_at: new Date().toISOString(),
    approved_via: 'android-admin',
  }
}

export async function createRemoteTaskIssue(task: RemoteTaskEnvelope) {
  if (!remoteTasksEnabled()) throw new Error('Remote task queue is disabled')
  const repository = taskRepo()
  const response = await fetch(`https://api.github.com/repos/${repository}/issues`, {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify({
      title: `[EVENTO TASK][APPROVED] ${task.project_id}: ${task.objective.slice(0, 96)}`,
      body: JSON.stringify(task, null, 2),
    }),
    cache: 'no-store',
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload?.message || `GitHub issue creation failed: ${response.status}`)
  return {
    number: payload.number as number,
    url: payload.html_url as string,
    title: payload.title as string,
    task,
  }
}
