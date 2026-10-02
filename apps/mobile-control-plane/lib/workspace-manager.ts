export type LocalWorkspaceSnapshot = {
  project_id: string
  repository: string
  role: string
  local_path_env: string
  configured: boolean
  workspace: null | {
    path: string
    exists: boolean
    is_git: boolean
    branch: string | null
    head: string | null
    dirty: boolean | null
    worktrees: string[]
  }
}

export type WorkspaceManagerSnapshot = {
  source: 'daemon' | 'unconfigured' | 'error'
  daemonUrl: string | null
  projects: LocalWorkspaceSnapshot[]
  error?: string
}

export async function getWorkspaceManagerSnapshot(): Promise<WorkspaceManagerSnapshot> {
  const daemonUrl = process.env.EVENTO_LOCAL_DAEMON_URL?.replace(/\/$/, '')
  const token = process.env.EVENTO_LOCAL_DAEMON_TOKEN
  if (!daemonUrl || !token) return { source: 'unconfigured', daemonUrl: daemonUrl ?? null, projects: [] }

  try {
    const response = await fetch(daemonUrl + '/v1/workspaces', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) throw new Error('Daemon returned ' + response.status)
    const payload = await response.json()
    return { source: 'daemon', daemonUrl, projects: payload.projects ?? [] }
  } catch (error) {
    return { source: 'error', daemonUrl, projects: [], error: error instanceof Error ? error.message : 'Daemon unavailable' }
  }
}
