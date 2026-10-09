/**
 * Pure intake validation rules.
 *
 * Kept as dependency-free ESM (with an adjacent .d.mts declaration) so the
 * contract test suite can exercise the real logic with `node --test`, without
 * a compile step and without importing framework or path-alias modules.
 */

export const limits = {
  name: { min: 2, max: 120 },
  email: { max: 254 },
  organization: { max: 160 },
  budget: { max: 80 },
  timeline: { max: 80 },
  summary: { min: 40, max: 4000 },
}

/**
 * Shape check only, no deliverability guessing: wrongly rejecting a valid
 * address loses a client, which is worse than accepting one we later fail to
 * reach.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const REFERENCE_RE = /^EV-\d{4}-[0-9A-F]{6}$/

function asText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function checkLength(field, value, bounds, required, failures) {
  if (!value) {
    if (required) failures.push({ field, code: 'required' })
    return
  }
  if (bounds.min !== undefined && value.length < bounds.min) failures.push({ field, code: 'too_short' })
  if (value.length > bounds.max) failures.push({ field, code: 'too_long' })
}

/**
 * @param {unknown} payload raw request body
 * @param {{ serviceIds: string[], engagementIds: string[] }} allowed
 */
export function validateFields(payload, allowed) {
  const failures = []
  const body = typeof payload === 'object' && payload !== null ? payload : {}

  const fields = {
    name: asText(body.name),
    email: asText(body.email).toLowerCase(),
    organization: asText(body.organization),
    serviceId: asText(body.serviceId),
    engagementId: asText(body.engagementId),
    budget: asText(body.budget),
    timeline: asText(body.timeline),
    summary: asText(body.summary),
    locale: asText(body.locale) === 'en' ? 'en' : 'ar',
  }

  checkLength('name', fields.name, limits.name, true, failures)
  checkLength('email', fields.email, limits.email, true, failures)
  if (fields.email && !EMAIL_RE.test(fields.email)) failures.push({ field: 'email', code: 'invalid' })
  checkLength('organization', fields.organization, limits.organization, false, failures)
  checkLength('budget', fields.budget, limits.budget, false, failures)
  checkLength('timeline', fields.timeline, limits.timeline, false, failures)
  checkLength('summary', fields.summary, limits.summary, true, failures)

  if (!fields.serviceId) failures.push({ field: 'serviceId', code: 'required' })
  else if (!allowed.serviceIds.includes(fields.serviceId)) failures.push({ field: 'serviceId', code: 'invalid' })

  if (!fields.engagementId) failures.push({ field: 'engagementId', code: 'required' })
  else if (!allowed.engagementIds.includes(fields.engagementId)) {
    failures.push({ field: 'engagementId', code: 'invalid' })
  }

  return { fields, failures }
}

/** Human-quotable, collision-resistant, and carries no personal data. */
export function createReference(now, uuid) {
  const year = now.getUTCFullYear()
  const suffix = uuid.replace(/-/g, '').slice(0, 6).toUpperCase()
  return `EV-${year}-${suffix}`
}
