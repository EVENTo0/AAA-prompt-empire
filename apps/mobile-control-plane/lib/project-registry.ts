import registry from '@/data/project-registry.json'

export type ProjectRegistryItem = {
  id: string
  name: string
  kind: string
  status: string
  saleStatus: string
  priority: string
  repository: string | null
  vercelProject: string | null
  supabaseProjectRef: string | null
  platforms: string[]
  workflows: string[]
  notes?: string
}

export type ProjectRegistry = {
  version: number
  projects: ProjectRegistryItem[]
}

export function getProjectRegistry(): ProjectRegistry {
  return registry as ProjectRegistry
}

export function summarizeRegistry() {
  const data = getProjectRegistry()
  return {
    version: data.version,
    total: data.projects.length,
    active: data.projects.filter((p) => p.status === 'active').length,
    saleReady: data.projects.filter((p) => ['ready', 'for-sale', 'published'].includes(p.saleStatus)).length,
    linkedRepos: data.projects.filter((p) => Boolean(p.repository)).length,
    linkedVercel: data.projects.filter((p) => Boolean(p.vercelProject)).length,
    linkedSupabase: data.projects.filter((p) => Boolean(p.supabaseProjectRef)).length,
  }
}
