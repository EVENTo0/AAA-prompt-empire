import { randomUUID } from 'node:crypto'
import { services, engagements, stageIds } from '@/lib/content'
import { createReference, validateFields, type ValidationFailure } from '@/lib/intake-rules.mjs'

export { limits, REFERENCE_RE } from '@/lib/intake-rules.mjs'
export type { ValidationFailure } from '@/lib/intake-rules.mjs'

export const INTAKE_STAGE = 'intake'

/** Column set of public.project_requests — see supabase/migrations. */
export type IntakeRecord = {
  reference: string
  name: string
  email: string
  organization: string | null
  service_id: string
  engagement_id: string
  budget: string | null
  timeline: string | null
  summary: string
  locale: string
  stage: typeof INTAKE_STAGE
}

export function validateIntake(payload: unknown): { record: IntakeRecord } | { failures: ValidationFailure[] } {
  const { fields, failures } = validateFields(payload, {
    serviceIds: services.map((service) => service.id),
    engagementIds: engagements.map((engagement) => engagement.id),
  })

  if (failures.length > 0) return { failures }

  return {
    record: {
      reference: createReference(new Date(), randomUUID()),
      name: fields.name,
      email: fields.email,
      organization: fields.organization || null,
      service_id: fields.serviceId,
      engagement_id: fields.engagementId,
      budget: fields.budget || null,
      timeline: fields.timeline || null,
      summary: fields.summary,
      locale: fields.locale,
      stage: INTAKE_STAGE,
    },
  }
}

/** The intake stage must exist in the published delivery pipeline. */
export function intakeStageIsPublished() {
  return stageIds.includes(INTAKE_STAGE)
}
