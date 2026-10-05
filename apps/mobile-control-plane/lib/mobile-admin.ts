import { timingSafeEqual } from 'node:crypto'
import { getProjectRegistry, summarizeRegistry } from '@/lib/project-registry'
import { buildEventoPlan, type CommandMode } from '@/lib/evento-orchestrator'

const SAFE_MOBILE_MODES = new Set<CommandMode>(['plan','verify','preview'])

function mobileSecret() {
  const value = process.env.EVENTO_ADMIN_MOBILE_TOKEN
  return value && value.length >= 32 ? value : null
}

function equalText(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function authorizeMobileAdmin(header: string | null) {
  const secret = mobileSecret()
  if (!secret || !header?.startsWith('Bearer ')) return false
  return equalText(header.slice('Bearer '.length), secret)
}

export function mobileOverview() {
  const registry = getProjectRegistry()
  return {
    generatedAt: new Date().toISOString(),
    summary: summarizeRegistry(),
    projects: registry.projects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      priority: project.priority,
      repository: project.repository,
      platforms: project.platforms,
      saleStatus: project.saleStatus,
    })),
  }
}

export function mobileCommand(input: { mode?: string; prompt?: string; projectId?: string }) {
  const mode = SAFE_MOBILE_MODES.has(input.mode as CommandMode)
    ? input.mode as CommandMode
    : 'plan'
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : ''
  if (!prompt) throw new Error('Command prompt is required')

  const plan = buildEventoPlan({
    mode,
    prompt,
    projectId: typeof input.projectId === 'string' && input.projectId ? input.projectId : undefined,
  })

  return {
    generatedAt: new Date().toISOString(),
    summary: `${plan.mode.toUpperCase()} · ${plan.project.name} · ${plan.risk}`,
    execution: 'plan-only',
    plan,
    mobilePolicy: {
      allowedModes: ['plan','verify','preview'],
      repositoryWrites: false,
      desktopActions: false,
      release: false,
    },
  }
}
