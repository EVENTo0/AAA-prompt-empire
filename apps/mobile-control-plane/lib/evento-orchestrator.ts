import { getProjectRegistry, type ProjectRegistryItem } from '@/lib/project-registry'

export type CommandMode = 'continue' | 'plan' | 'build' | 'verify' | 'preview' | 'learn' | 'release'

export type EventoCommand = {
  projectId?: string
  prompt: string
  mode: CommandMode
}

export type EventoPlan = {
  project: Pick<ProjectRegistryItem, 'id' | 'name' | 'priority' | 'status' | 'repository' | 'platforms'>
  mode: CommandMode
  objective: string
  risk: 'low' | 'medium' | 'high' | 'critical'
  route: string[]
  requiredEvidence: string[]
  allowedToExecute: boolean
  releaseProtected: boolean
  nextAction: string
  notes: string[]
}

const activeLimit = 3
const supportingLimit = 5

function score(project: ProjectRegistryItem) {
  const priority = project.priority === 'P0' ? 100 : project.priority === 'P1' ? 60 : project.priority === 'P2' ? 30 : 10
  const active = project.status === 'active' ? 20 : 0
  const linked = project.repository ? 8 : 0
  return priority + active + linked
}

function selectProject(projectId?: string) {
  const projects = getProjectRegistry().projects
  if (projectId) {
    const project = projects.find((item) => item.id === projectId)
    if (!project) throw new Error('Unknown EVENTO project')
    return project
  }
  return [...projects].sort((a, b) => score(b) - score(a))[0]
}

function classifyRisk(mode: CommandMode, prompt: string) {
  if (mode === 'release' || /production|prod|secret|payment|billing|delete|migration/i.test(prompt)) return 'critical' as const
  if (mode === 'build' || /database|rls|auth|ios|android|unity|deploy/i.test(prompt)) return 'high' as const
  if (mode === 'verify' || mode === 'preview') return 'medium' as const
  return 'low' as const
}

function evidenceFor(project: ProjectRegistryItem, mode: CommandMode) {
  const evidence = ['exact task contract', 'source commit or immutable project state']
  if (project.repository) evidence.push('GitHub branch/PR head')
  if (mode === 'build' || mode === 'verify' || mode === 'preview' || mode === 'release') evidence.push('applicable automated tests')
  if (project.platforms.some((p) => ['android', 'ios'].includes(p))) evidence.push('mobile build evidence', 'physical-device gate before production release')
  if (project.platforms.includes('web')) evidence.push('inspectable preview evidence')
  if (project.platforms.some((p) => ['windows', 'steam', 'meta-quest'].includes(p))) evidence.push('desktop/runtime build evidence')
  return evidence
}

function routeFor(project: ProjectRegistryItem, mode: CommandMode) {
  const route = ['EVENTO Memory', 'Context Pack', 'EVENTO Agent Contract']
  if (project.repository) route.push('Git worktree / branch')
  if (mode === 'plan') route.push('Planner')
  else if (mode === 'verify') route.push('Independent QA/Reviewer')
  else if (mode === 'learn') route.push('Memory Reviewer')
  else route.push('Capability Router', 'Best-fit execution agent')
  route.push('Evidence Pack')
  return route
}

export function buildEventoPlan(command: EventoCommand): EventoPlan {
  if (!command.prompt.trim()) throw new Error('Command prompt is required')
  const project = selectProject(command.projectId)
  const registry = getProjectRegistry()
  const active = registry.projects.filter((item) => item.status === 'active').length
  const risk = classifyRisk(command.mode, command.prompt)
  const releaseProtected = command.mode === 'release' || risk === 'critical'
  const writesEnabled = process.env.CONTROL_PLANE_ENABLE_WRITES === 'true'
  const allowedToExecute = writesEnabled && !releaseProtected && ['build', 'verify', 'preview', 'learn'].includes(command.mode)

  const notes = [
    'Portfolio guard: ' + active + '/' + activeLimit + ' active; supporting cap ' + supportingLimit + '.',
    'Reuse existing memory, skills, templates and assets before creating new capability.',
    'Unknown routing or missing evidence fails closed.',
  ]
  if (active > activeLimit) notes.push('Portfolio is above the active-project cap; do not promote additional work.')
  if (releaseProtected) notes.push('Release/critical actions require an explicit protected approval and are never implied by CONTINUE.')
  if (!writesEnabled) notes.push('Control plane writes are disabled; this command is plan-only until server-side write capability is enabled.')

  return {
    project: {
      id: project.id,
      name: project.name,
      priority: project.priority,
      status: project.status,
      repository: project.repository,
      platforms: project.platforms,
    },
    mode: command.mode,
    objective: command.prompt.trim(),
    risk,
    route: routeFor(project, command.mode),
    requiredEvidence: evidenceFor(project, command.mode),
    allowedToExecute,
    releaseProtected,
    nextAction: allowedToExecute
      ? 'Create an isolated task branch/worktree, execute the bounded task, then return an Evidence Pack.'
      : 'Build the Context Pack and execution plan; do not mutate production or repositories from this request.',
    notes,
  }
}
