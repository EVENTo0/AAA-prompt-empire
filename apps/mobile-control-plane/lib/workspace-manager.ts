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
  writeExecution: boolean
  writeActions: string[]
  projects: LocalWorkspaceSnapshot[]
  error?: string
}

function daemonConfig() {
  const daemonUrl = process.env.EVENTO_LOCAL_DAEMON_URL?.replace(/\/$/, '')
  const token = process.env.EVENTO_LOCAL_DAEMON_TOKEN
  const writeToken = process.env.EVENTO_LOCAL_DAEMON_WRITE_TOKEN
  return { daemonUrl, token, writeToken }
}

async function daemonFetch(path: string, init: RequestInit = {}) {
  const { daemonUrl, token } = daemonConfig()
  if (!daemonUrl || !token) throw new Error('Local daemon bridge is unconfigured')
  return fetch(daemonUrl + path, {
    ...init,
    headers: { Authorization: 'Bearer ' + token, ...(init.headers ?? {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })
}

export async function getWorkspaceManagerSnapshot(): Promise<WorkspaceManagerSnapshot> {
  const { daemonUrl, token } = daemonConfig()
  if (!daemonUrl || !token) return { source: 'unconfigured', daemonUrl: daemonUrl ?? null, writeExecution: false, writeActions: [], projects: [] }

  try {
    const [workspaceResponse, capabilityResponse] = await Promise.all([
      daemonFetch('/v1/workspaces'),
      daemonFetch('/v1/capabilities'),
    ])
    if (!workspaceResponse.ok) throw new Error('Workspace daemon returned ' + workspaceResponse.status)
    if (!capabilityResponse.ok) throw new Error('Capability daemon returned ' + capabilityResponse.status)
    const workspaces = await workspaceResponse.json()
    const capabilities = await capabilityResponse.json()
    return {
      source: 'daemon',
      daemonUrl,
      writeExecution: Boolean(capabilities.daemon?.write_execution),
      writeActions: capabilities.write_actions ?? [],
      projects: workspaces.projects ?? [],
    }
  } catch (error) {
    return { source: 'error', daemonUrl, writeExecution: false, writeActions: [], projects: [], error: error instanceof Error ? error.message : 'Daemon unavailable' }
  }
}

export type WorkspaceAction =
  | { action: 'create_worktree'; projectId: string; suffix: string }
  | { action: 'open_folder'; projectId: string }
  | { action: 'run_gate'; projectId: string }
  | { action: 'blender_open'; projectId: string; relativePath: string }
  | { action: 'unity_open'; projectId: string; relativePath: string }

function cleanSuffix(value: string) {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  if (!normalized || normalized.length > 48) throw new Error('Invalid worktree suffix')
  return normalized
}

export async function runWorkspaceAction(input: WorkspaceAction) {
  const { writeToken } = daemonConfig()
  if (!writeToken) throw new Error('Local write bridge is disabled')

  let payload: Record<string, unknown>
  if (input.action === 'create_worktree') {
    payload = {
      action: 'project-create-worktree',
      confirmation: 'project-create-worktree',
      project_id: input.projectId,
      branch: 'evento/' + input.projectId + '/' + cleanSuffix(input.suffix),
      base_ref: 'HEAD',
    }
  } else if (input.action === 'open_folder') {
    payload = { action: 'project-open-folder', confirmation: 'project-open-folder', project_id: input.projectId }
  } else if (input.action === 'run_gate') {
    if (input.projectId !== 'aaa-empire') throw new Error('Gate tool is not registered for this project')
    payload = {
      action: 'python-run-approved',
      confirmation: 'python-run-approved',
      script: 'validate_evento_control_plane.py',
      args: [],
    }
  } else if (input.action === 'blender_open') {
    payload = {
      action: 'blender-open-project',
      confirmation: 'blender-open-project',
      project_id: input.projectId,
      blend_file: input.relativePath,
    }
  } else {
    payload = {
      action: 'unity-open-project',
      confirmation: 'unity-open-project',
      project_id: input.projectId,
      unity_project: input.relativePath || '.',
    }
  }

  const response = await daemonFetch('/v1/actions/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-EVENTO-Write-Token': writeToken },
    body: JSON.stringify(payload),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Local action failed')
  return body
}
