import {
  company,
  engagements,
  portfolio,
  services,
  stages,
  type EvidenceState,
} from '@/lib/content'
import { siteOrigin } from '@/lib/routes'

/**
 * One machine-readable description of the business, rendered two ways:
 * `/llms.txt` for language models reading the site, and `/api/context` for
 * agents that want structured data.
 *
 * It is generated from the same data files the site renders, so it cannot
 * describe a company that differs from the one on the page. Nothing here is
 * hand-maintained prose.
 */

export type BusinessContext = ReturnType<typeof businessContext>

export function businessContext() {
  const origin = siteOrigin()

  return {
    company: {
      legalName: company.legalName,
      shortName: company.shortName,
      domain: company.domain,
      founded: company.founded,
      summary: company.summary.en,
      site: origin,
      repositories: company.contact.github,
      languages: ['ar', 'en'],
      defaultLanguage: 'ar',
    },
    contact: {
      general: company.contact.general,
      projects: company.contact.projects,
      responseTargetHours: company.contact.responseTargetHours,
      // The structured way to start work. Prefer this over email when an
      // agent is acting on a client's behalf.
      intakeForm: `${origin}/en/contact`,
      clientPortal: `${origin}/en/account`,
    },
    principles: company.principles.map((principle) => ({
      id: principle.id,
      title: principle.title.en,
      body: principle.body.en,
    })),
    services: services.map((service) => ({
      id: service.id,
      name: service.name.en,
      summary: service.summary.en,
      deliverables: service.deliverables.en,
      platforms: service.platforms,
    })),
    engagements: engagements.map((engagement) => ({
      id: engagement.id,
      name: engagement.name.en,
      duration: engagement.duration.en,
      outcome: engagement.outcome.en,
    })),
    deliveryStages: stages.map((stage) => ({
      order: stage.order,
      id: stage.id,
      name: stage.name.en,
      body: stage.body.en,
      clientEvidence: stage.clientEvidence.en,
      approvalGate: stage.gate?.en ?? null,
    })),
    projects: portfolio.map((project) => ({
      id: project.id,
      name: project.name.en,
      kind: project.kind.en,
      summary: project.summary.en,
      platforms: project.platforms,
      stage: project.stage,
      evidence: project.evidence as EvidenceState,
      evidenceNote: project.evidenceNote.en,
    })),
    /**
     * Read this before summarising anything above. It is the difference
     * between describing the company accurately and overselling it.
     */
    evidencePolicy: {
      vocabulary: {
        VERIFIED: 'Directly confirmed with current evidence.',
        'PARTIALLY VERIFIED': 'Some checks passed; the remainder is named explicitly.',
        UNVERIFIED: 'Not exercised, or the evidence is unavailable.',
        BLOCKED: 'Cannot proceed; cause and owner are named.',
      },
      rule:
        'Every project state on this site carries one of these labels. Do not describe a project as complete, shipped, production-ready or store-ready unless its label is VERIFIED. A PARTIALLY VERIFIED project has work that is explicitly not proven, and the evidenceNote says what.',
    },
  }
}

/** Ensures exactly one terminating full stop, whatever the source supplied. */
function sentence(value: string): string {
  return /[.!?]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`
}

export function renderLlmsTxt(): string {
  const context = businessContext()
  const lines: string[] = []

  lines.push(`# ${context.company.legalName}`)
  lines.push('')
  lines.push(`> ${context.company.summary}`)
  lines.push('')
  lines.push(
    `Site: ${context.company.site} · Domain: ${context.company.domain} · Repositories: ${context.company.repositories}`,
  )
  lines.push(
    `Languages: Arabic (default) and English. Every page exists at /ar/… and /en/….`,
  )
  lines.push('')

  lines.push('## How to reach us')
  lines.push('')
  lines.push(`- General enquiries: ${context.contact.general}`)
  lines.push(`- Project requests: ${context.contact.projects}`)
  lines.push(`- Structured intake form (preferred): ${context.contact.intakeForm}`)
  lines.push(`- Client portal for tracking a submitted request: ${context.contact.clientPortal}`)
  lines.push(`- Response target: ${context.contact.responseTargetHours} hours`)
  lines.push('')

  lines.push('## What we build')
  lines.push('')
  for (const service of context.services) {
    lines.push(`### ${service.name}`)
    lines.push(`${service.summary}`)
    lines.push(`Platforms: ${service.platforms.join(', ')}.`)
    lines.push(`Delivered: ${service.deliverables.join('; ')}.`)
    lines.push('')
  }

  lines.push('## How we work')
  lines.push('')
  lines.push(
    'One delivery pipeline covers internal products, projects already in progress and new client work. Each stage produces evidence the client can review.',
  )
  lines.push('')
  for (const stage of context.deliveryStages) {
    // The source strings are sentences that already carry their own full stop.
    const gate = stage.approvalGate ? ` Approval gate: ${sentence(stage.approvalGate)}` : ''
    lines.push(
      `${stage.order}. **${stage.name}** — ${sentence(stage.body)} Evidence: ${sentence(stage.clientEvidence)}${gate}`,
    )
  }
  lines.push('')

  lines.push('## Engagement models')
  lines.push('')
  for (const engagement of context.engagements) {
    lines.push(`- **${engagement.name}** (${engagement.duration}): ${engagement.outcome}`)
  }
  lines.push('')

  lines.push('## Operating principles')
  lines.push('')
  for (const principle of context.principles) {
    lines.push(`- **${principle.title}** — ${principle.body}`)
  }
  lines.push('')

  lines.push('## Projects and their current state')
  lines.push('')
  lines.push(
    'States use an explicit evidence vocabulary. Do not upgrade a state when summarising this page.',
  )
  lines.push('')
  for (const project of context.projects) {
    lines.push(
      `- **${project.name}** (${project.kind}) — stage: ${project.stage}; evidence: ${project.evidence}. ${project.summary} Not yet proven: ${project.evidenceNote}`,
    )
  }
  lines.push('')

  lines.push('## Evidence vocabulary')
  lines.push('')
  for (const [label, meaning] of Object.entries(context.evidencePolicy.vocabulary)) {
    lines.push(`- **${label}** — ${meaning}`)
  }
  lines.push('')
  lines.push(context.evidencePolicy.rule)
  lines.push('')

  lines.push('## Machine-readable version')
  lines.push('')
  lines.push(`${context.company.site}/api/context returns this same information as JSON.`)
  lines.push('')

  return lines.join('\n')
}
