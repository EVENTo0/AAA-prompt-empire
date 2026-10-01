import pilots from '@/data/evento-modernization-pilots.json'
import agents from '@/data/evento-agent-capabilities.json'

export type EventoPilot = {
  project_id: string
  repository: string
  role: string
  phase: string
  required_lanes: string[]
}

export function getEventoModernizationSnapshot() {
  const data = pilots as {
    version: number
    policy: {
      max_active: number
      max_supporting: number
      release_separate_from_build: boolean
      evidence_before_status: boolean
    }
    pilots: EventoPilot[]
  }

  const capabilityData = agents as {
    agents: Array<{
      id: string
      strengths: string[]
      modes: string[]
      can_write: boolean
      can_release: boolean
    }>
  }

  return {
    version: data.version,
    policy: data.policy,
    pilots: data.pilots,
    agents: capabilityData.agents,
    commands: ['CONTINUE', 'PLAN', 'BUILD', 'VERIFY', 'PREVIEW', 'LEARN', 'RELEASE'] as const,
  }
}
