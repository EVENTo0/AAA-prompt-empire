import registry from '@/data/project-registry.json'

export type ProjectRegistryItem = {
  id: string
  productKey: string
  name: string
  hierarchy: 'company-core' | 'internal-engineering-lab' | 'evento-ventures' | 'ambiguous-owner-decision'
  authority: 'canonical' | 'bounded-canonical' | 'legacy' | 'supporting' | 'shared-capability' | 'owner-decision-required'
  canonicalRepo: string | null
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
  asOf: string
  owner: string
  inventorySource: string
  mirrorContracts: Array<{
    consumer: string
    mode: 'derived-mirror-only'
    source: string
    freshness: string
    mutationAuthority: 'none'
  }>
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
    unresolvedAuthority: data.projects.filter((p) => p.authority === 'owner-decision-required').length,
    hierarchy: Object.fromEntries(
      ['company-core', 'internal-engineering-lab', 'evento-ventures', 'ambiguous-owner-decision']
        .map((name) => [name, data.projects.filter((p) => p.hierarchy === name).length]),
    ),
  }
}
