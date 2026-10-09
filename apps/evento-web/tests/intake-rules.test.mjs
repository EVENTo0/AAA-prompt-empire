import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createReference, limits, REFERENCE_RE, validateFields } from '../lib/intake-rules.mjs'

const root = new URL('../', import.meta.url)
const catalog = JSON.parse(await readFile(new URL('data/service-catalog.json', root), 'utf8'))

const allowed = {
  serviceIds: catalog.services.map((service) => service.id),
  engagementIds: catalog.engagements.map((engagement) => engagement.id),
}

const valid = {
  name: 'Client Name',
  email: 'Client@Example.COM',
  serviceId: allowed.serviceIds[0],
  engagementId: allowed.engagementIds[0],
  summary: 'x'.repeat(limits.summary.min),
  locale: 'en',
}

function fields(payload) {
  return validateFields(payload, allowed)
}

test('a complete request passes and is normalized', () => {
  const { fields: out, failures } = fields(valid)
  assert.deepEqual(failures, [])
  assert.equal(out.email, 'client@example.com', 'email is lowercased for stable lookups')
  assert.equal(out.locale, 'en')
})

test('missing required fields are reported individually', () => {
  const { failures } = fields({})
  const reported = failures.filter((f) => f.code === 'required').map((f) => f.field).sort()
  assert.deepEqual(reported, ['email', 'engagementId', 'name', 'serviceId', 'summary'])
})

test('a summary that is too thin to assess is rejected', () => {
  const { failures } = fields({ ...valid, summary: 'too short to assess' })
  assert.ok(failures.some((f) => f.field === 'summary' && f.code === 'too_short'))
})

test('oversized fields are rejected rather than silently truncated', () => {
  const { failures } = fields({
    ...valid,
    name: 'n'.repeat(limits.name.max + 1),
    summary: 's'.repeat(limits.summary.max + 1),
  })
  assert.ok(failures.some((f) => f.field === 'name' && f.code === 'too_long'))
  assert.ok(failures.some((f) => f.field === 'summary' && f.code === 'too_long'))
})

test('malformed email addresses are rejected', () => {
  for (const email of ['plain', 'no@tld', 'spaces in@example.com', '@example.com', 'a@b.c']) {
    const { failures } = fields({ ...valid, email })
    assert.ok(
      failures.some((f) => f.field === 'email'),
      `${email} must be rejected`,
    )
  }
})

test('ordinary email addresses are accepted', () => {
  for (const email of ['a@b.co', 'first.last+tag@sub.example.org', 'user_name@example.co.uk']) {
    const { failures } = fields({ ...valid, email })
    assert.deepEqual(
      failures.filter((f) => f.field === 'email'),
      [],
      `${email} must be accepted`,
    )
  }
})

test('service and engagement ids outside the published catalog are rejected', () => {
  const { failures } = fields({ ...valid, serviceId: 'made-up', engagementId: 'made-up' })
  assert.ok(failures.some((f) => f.field === 'serviceId' && f.code === 'invalid'))
  assert.ok(failures.some((f) => f.field === 'engagementId' && f.code === 'invalid'))
})

test('an unknown locale falls back to the default rather than failing the request', () => {
  const { fields: out, failures } = fields({ ...valid, locale: 'fr' })
  assert.deepEqual(failures, [])
  assert.equal(out.locale, 'ar')
})

test('non-string input cannot smuggle values past validation', () => {
  const { failures } = fields({ ...valid, name: { toString: () => 'evil' }, summary: 12345 })
  assert.ok(failures.some((f) => f.field === 'name' && f.code === 'required'))
  assert.ok(failures.some((f) => f.field === 'summary' && f.code === 'required'))
})

test('optional fields may be omitted entirely', () => {
  const { failures } = fields({ ...valid, organization: '', budget: '', timeline: '' })
  assert.deepEqual(failures, [])
})

test('references are well formed, uppercase and free of personal data', () => {
  const reference = createReference(new Date('2026-03-04T00:00:00Z'), '9f8e7d6c-5b4a-3210-9876-543210fedcba')
  assert.match(reference, REFERENCE_RE)
  assert.equal(reference, 'EV-2026-9F8E7D')
})

test('distinct uuids produce distinct references', () => {
  const now = new Date('2026-01-01T00:00:00Z')
  const a = createReference(now, crypto.randomUUID())
  const b = createReference(now, crypto.randomUUID())
  assert.notEqual(a, b)
})
