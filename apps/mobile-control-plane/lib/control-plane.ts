export type Health = 'healthy' | 'degraded' | 'failing' | 'unconfigured'

export type WorkflowRun = {
  id: number
  name: string
  status: string
  conclusion: string | null
  branch: string | null
  event: string
  url: string
  createdAt: string
}

export type RepoSnapshot = {
  fullName: string
  private: boolean
  defaultBranch: string
  url: string
  openPrs: number
  prs: Array<{ number: number; title: string; url: string; draft: boolean }>
  workflows: WorkflowRun[]
  agents: number
  agentNames: string[]
  health: Health
  error?: string
}

export type DeploymentSnapshot = {
  id: string
  project: string
  state: string
  target: string | null
  url: string
  createdAt: string
  source: 'vercel'
}

export type SupabaseSnapshot = {
  ref: string
  name: string
  status: string
  region?: string
  services: Array<{ name: string; healthy: boolean; status: string }>
  health: Health
  error?: string
}

export type CatalogProject = {
  id: string
  name: string
  status: string
  category?: string
  price?: string
  previewUrl?: string
  updatedAt?: string
}

export type Overview = {
  generatedAt: string
  mode: 'live' | 'degraded' | 'unconfigured'
  repos: RepoSnapshot[]
  deployments: DeploymentSnapshot[]
  supabase: SupabaseSnapshot[]
  catalog: CatalogProject[]
  integrations: Record<string, Health>
  capabilities: { writes: boolean; allowedWorkflows: string[] }
}

const githubHeaders = () => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
  'X-GitHub-Api-Version': '2026-03-10',
})

function parseCsv(value?: string) {
  return (value ?? '').split(',').map((x) => x.trim()).filter(Boolean)
}

async function jsonFetch<T>(url: string, init: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return (await response.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

async function githubRepo(fullName: string): Promise<RepoSnapshot> {
  const base = `https://api.github.com/repos/${fullName}`
  try {
    const [repo, prs, runs, codexAgents, claudeAgents] = await Promise.all([
      jsonFetch<any>(base, { headers: githubHeaders() }),
      jsonFetch<any[]>(`${base}/pulls?state=open&per_page=20`, { headers: githubHeaders() }),
      jsonFetch<{ workflow_runs: any[] }>(`${base}/actions/runs?per_page=12`, { headers: githubHeaders() }),
      jsonFetch<any[]>(`${base}/contents/.codex/agents`, { headers: githubHeaders() }).catch(() => []),
      jsonFetch<any[]>(`${base}/contents/.claude/agents`, { headers: githubHeaders() }).catch(() => []),
    ])

    const workflows = runs.workflow_runs.map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      event: run.event,
      url: run.html_url,
      createdAt: run.created_at,
    }))

    const failing = workflows.some((run) => run.status === 'completed' && !['success', 'neutral', 'skipped'].includes(run.conclusion ?? ''))
    return {
      fullName,
      private: Boolean(repo.private),
      defaultBranch: repo.default_branch,
      url: repo.html_url,
      openPrs: prs.length,
      prs: prs.slice(0, 5).map((pr) => ({ number: pr.number, title: pr.title, url: pr.html_url, draft: Boolean(pr.draft) })),
      workflows,
      agents: new Set([...codexAgents, ...claudeAgents].filter((x) => x.type === 'file').map((x) => x.name)).size,
      agentNames: [...new Set([...codexAgents, ...claudeAgents].filter((x) => x.type === 'file').map((x) => String(x.name).replace(/\.md$/, '')))].sort().slice(0, 30),
      health: failing ? 'failing' : 'healthy',
    }
  } catch (error) {
    return {
      fullName,
      private: true,
      defaultBranch: 'unknown',
      url: `https://github.com/${fullName}`,
      openPrs: 0,
      prs: [],
      workflows: [],
      agents: 0,
      agentNames: [],
      health: 'degraded',
      error: error instanceof Error ? error.message : 'GitHub request failed',
    }
  }
}

async function vercelDeployments(): Promise<DeploymentSnapshot[]> {
  const token = process.env.VERCEL_TOKEN
  if (!token) return []
  const team = process.env.VERCEL_TEAM_ID ? `&teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : ''
  const payload = await jsonFetch<{ deployments: any[] }>(`https://api.vercel.com/v6/deployments?limit=25${team}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return payload.deployments.map((d) => ({
    id: d.uid,
    project: d.name,
    state: d.state ?? d.readyState ?? 'UNKNOWN',
    target: d.target ?? null,
    url: `https://${d.url}`,
    createdAt: new Date(d.createdAt).toISOString(),
    source: 'vercel' as const,
  }))
}

async function supabaseProjects(): Promise<SupabaseSnapshot[]> {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) return []
  const headers = { Authorization: `Bearer ${token}` }
  const refs = parseCsv(process.env.SUPABASE_PROJECT_REFS)
  const projects = await jsonFetch<any[]>('https://api.supabase.com/v1/projects', { headers })
  const selected = refs.length ? projects.filter((p) => refs.includes(p.ref)) : projects

  return Promise.all(selected.slice(0, 12).map(async (project) => {
    try {
      const services = await jsonFetch<any[]>(
        `https://api.supabase.com/v1/projects/${project.ref}/health?services=auth&services=rest&services=db&timeout_ms=5000`,
        { headers },
      )
      const normalized = services.map((s) => ({ name: s.name, healthy: Boolean(s.healthy), status: s.status ?? 'unknown' }))
      return {
        ref: project.ref,
        name: project.name,
        status: project.status,
        region: project.region,
        services: normalized,
        health: normalized.every((s) => s.healthy) ? 'healthy' as const : 'degraded' as const,
      }
    } catch (error) {
      return {
        ref: project.ref,
        name: project.name,
        status: project.status,
        region: project.region,
        services: [],
        health: 'degraded' as const,
        error: error instanceof Error ? error.message : 'Supabase health request failed',
      }
    }
  }))
}

async function eventoCatalog(): Promise<CatalogProject[]> {
  const url = process.env.EVENTO_CATALOG_URL
  if (!url) return []
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (process.env.EVENTO_CATALOG_TOKEN) headers.Authorization = `Bearer ${process.env.EVENTO_CATALOG_TOKEN}`
  const result = await jsonFetch<{ projects?: CatalogProject[] }>(url, { headers })
  return (result.projects ?? []).slice(0, 50)
}

export function configuredRepositories() {
  return parseCsv(process.env.CONTROL_PLANE_REPOSITORIES)
}

export async function buildOverview(): Promise<Overview> {
  const reposConfigured = configuredRepositories()
  const [repos, deploymentsResult, supabaseResult, catalogResult] = await Promise.all([
    process.env.GITHUB_TOKEN ? Promise.all(reposConfigured.map(githubRepo)) : Promise.resolve([]),
    vercelDeployments().catch(() => []),
    supabaseProjects().catch(() => []),
    eventoCatalog().catch(() => []),
  ])

  const integrations: Record<string, Health> = {
    github: process.env.GITHUB_TOKEN ? (repos.some((r) => r.health === 'degraded') ? 'degraded' : 'healthy') : 'unconfigured',
    vercel: process.env.VERCEL_TOKEN ? (deploymentsResult.length ? 'healthy' : 'degraded') : 'unconfigured',
    supabase: process.env.SUPABASE_ACCESS_TOKEN ? (supabaseResult.some((p) => p.health !== 'healthy') ? 'degraded' : 'healthy') : 'unconfigured',
    eventoCatalog: process.env.EVENTO_CATALOG_URL ? (catalogResult.length ? 'healthy' : 'degraded') : 'unconfigured',
  }

  const states = Object.values(integrations)
  const mode: Overview['mode'] = states.every((s) => s === 'unconfigured')
    ? 'unconfigured'
    : states.some((s) => s === 'degraded' || s === 'failing')
      ? 'degraded'
      : 'live'

  return {
    generatedAt: new Date().toISOString(),
    mode,
    repos,
    deployments: deploymentsResult,
    supabase: supabaseResult,
    catalog: catalogResult,
    integrations,
    capabilities: {
      writes: process.env.CONTROL_PLANE_ENABLE_WRITES === 'true',
      allowedWorkflows: parseCsv(process.env.CONTROL_PLANE_ALLOWED_WORKFLOWS),
    },
  }
}
