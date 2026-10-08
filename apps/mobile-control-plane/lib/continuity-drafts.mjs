import { createContinuityHandoff } from './continuity-handoff.mjs'

const pending = new Map()
const allowedKeys = new Set(['projectId', 'adapter', 'taskId', 'confirmation'])
const repoPattern = /^EVENTo0\/[A-Za-z0-9_.-]+$/
const reply = (status, value) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store, private' } })

/** Private draft journal only. Never submits an approved remote task. */
export function createContinuityDraftHandler({ snapshot, isAuthorized, config, fetchImpl = fetch }) {
  const configured = Boolean(config.token && repoPattern.test(config.repository || ''))
  const enabled = configured && config.writesEnabled === true && config.draftsEnabled === true
  async function github(path, method = 'GET', body) {
    const response = await fetchImpl(`https://api.github.com/repos/${config.repository}${path}`, {
      method, cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2026-03-10' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!response.ok) throw new Error('GitHub journal request failed')
    return response.json()
  }
  async function persist(handoff) {
    const repository = await github('')
    if (repository.private !== true || repository.full_name !== config.repository) return reply(409, { error: 'A private owner repository is required. No draft was written.' })
    const title = `[EVENTO CONTINUITY][DRAFT] ${handoff.task.task_id}`
    // Reconcile recent retries. Never automatically retry an ambiguous POST.
    const recent = await github('/issues?state=all&per_page=100&sort=created&direction=desc')
    if (!Array.isArray(recent)) throw new Error('Invalid journal list')
    let issue = recent.find(item => !item.pull_request && item.title === title)
    const reused = Boolean(issue)
    if (issue) {
      const saved = JSON.parse(issue.body)
      if (JSON.stringify({ task: saved.task, context: saved.context, prompt: saved.prompt, execution: saved.execution }) !== JSON.stringify(handoff)) return reply(409, { error: 'Task id already belongs to a different draft. Prepare a new task.' })
    }
    if (!issue) issue = await github('/issues', 'POST', { title, body: JSON.stringify({ evento_continuity_draft_version: 1, state: 'planning', ...handoff }, null, 2) })
    if (!Number.isSafeInteger(issue.number) || issue.number <= 0) throw new Error('Invalid journal receipt')
    // A successful create response is not proof of durable persistence.
    // Read the issue independently and verify the canonical payload before issuing a receipt.
    const confirmed = await github(`/issues/${issue.number}`)
    if (confirmed.number !== issue.number || confirmed.title !== title || typeof confirmed.body !== 'string') throw new Error('Journal read-back mismatch')
    const saved = JSON.parse(confirmed.body)
    const canonical = { task: handoff.task, context: handoff.context, prompt: handoff.prompt, execution: handoff.execution }
    if (saved.evento_continuity_draft_version !== 1 || saved.state !== 'planning' || saved.task?.status !== 'planning' ||
        JSON.stringify({ task: saved.task, context: saved.context, prompt: saved.prompt, execution: saved.execution }) !== JSON.stringify(canonical)) {
      throw new Error('Journal read-back mismatch')
    }
    return reply(reused ? 200 : 201, { ok: true, taskId: handoff.task.task_id, state: 'planning', execution: 'handoff-only', reused, issue: { number: issue.number, url: `https://github.com/${config.repository}/issues/${issue.number}` } })
  }
  return async function handle(request) {
    if (!(await isAuthorized())) return reply(401, { error: 'Unauthorized' })
    if (request.method === 'GET') return reply(200, { configured, enabled, execution: 'handoff-only', state: 'planning', privateRepositoryRequired: true })
    if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' })
    if (request.headers.get('x-empire-action') !== '1' || request.headers.get('origin') !== new URL(request.url).origin || (request.headers.get('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) return reply(403, { error: 'Invalid action origin' })
    if (!enabled) return reply(403, { error: 'Private draft journal is disabled or unconfigured' })
    try {
      const reader = request.body?.getReader()
      if (!reader) return reply(400, { error: 'Missing request body' })
      let text = ''; let bytes = 0; const decoder = new TextDecoder()
      for (;;) {
        const part = await reader.read(); if (part.done) break
        bytes += part.value.byteLength
        if (bytes > 4096) { await reader.cancel(); return reply(413, { error: 'Request is too large' }) }
        text += decoder.decode(part.value, { stream: true })
      }
      text += decoder.decode()
      const body = JSON.parse(text)
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !allowedKeys.has(k)) || ['projectId', 'adapter', 'taskId'].some(k => typeof body[k] !== 'string')) return reply(400, { error: 'Invalid draft request' })
      if (body.confirmation !== 'save_continuity_draft') return reply(400, { error: 'Explicit confirmation is required' })
      const handoff = createContinuityHandoff(snapshot, body.projectId, body.adapter, body.taskId)
      const key = `${config.repository}:${body.taskId}`
      const identity = JSON.stringify(handoff)
      if (pending.has(key)) {
        const active = pending.get(key)
        if (active.identity !== identity) return reply(409, { error: 'Task id is already in use for another draft' })
        return (await active.operation).clone()
      }
      const operation = persist(handoff); pending.set(key, { identity, operation })
      try { return (await operation).clone() } finally { pending.delete(key) }
    } catch { return reply(400, { error: 'Draft could not be saved. Check the private journal before retrying; execution was not authorized.' }) }
  }
}
