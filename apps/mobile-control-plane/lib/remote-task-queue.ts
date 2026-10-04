import { getProjectRegistry } from '@/lib/project-registry'

export type RemoteTaskMode = 'build' | 'verify' | 'preview'
export type RemoteTaskAgent = 'auto' | 'codex' | 'claude-code'
export type RemoteTaskState = 'approved' | 'local-built' | 'pr-open' | 'revision-requested' | 'merge-handoff-approved' | 'merged' | 'merged-verified' | 'preview-verified' | 'preview-accepted' | 'production-handoff-approved' | 'production-verified' | 'production-rolled-back'

export type RemoteTaskEnvelope = {
  evento_task_version: 1
  state: 'approved'
  project_id: string
  repository: string
  objective: string
  mode: RemoteTaskMode
  preferred_agent: RemoteTaskAgent
  release: false
  approved_at: string
  approved_via: 'android-admin'
}

function taskStateFromTitle(title: string): RemoteTaskState | null {
  if (title.startsWith('[EVENTO TASK][PRODUCTION-VERIFIED]')) return 'production-verified'
  if (title.startsWith('[EVENTO TASK][PRODUCTION-ROLLED-BACK]')) return 'production-rolled-back'
  if (title.startsWith('[EVENTO TASK][PRODUCTION-HANDOFF-APPROVED]')) return 'production-handoff-approved'
  if (title.startsWith('[EVENTO TASK][PREVIEW-ACCEPTED]')) return 'preview-accepted'
  if (title.startsWith('[EVENTO TASK][PREVIEW-VERIFIED]')) return 'preview-verified'
  if (title.startsWith('[EVENTO TASK][MERGED-VERIFIED]')) return 'merged-verified'
  if (title.startsWith('[EVENTO TASK][MERGED]')) return 'merged'
  if (title.startsWith('[EVENTO TASK][MERGE-HANDOFF-APPROVED]')) return 'merge-handoff-approved'
  if (title.startsWith('[EVENTO TASK][REVISION-REQUESTED]')) return 'revision-requested'
  if (title.startsWith('[EVENTO TASK][PR-OPEN]')) return 'pr-open'
  if (title.startsWith('[EVENTO TASK][LOCAL-BUILT]')) return 'local-built'
  if (title.startsWith('[EVENTO TASK][APPROVED]')) return 'approved'
  return null
}

function taskRepo() {
  return process.env.EVENTO_TASK_REPOSITORY || 'EVENTo0/AAA-prompt-empire'
}

function githubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2026-03-10',
  }
}

export function remoteTasksEnabled() {
  return process.env.EVENTO_REMOTE_TASKS_ENABLED === 'true' && Boolean(process.env.GITHUB_TOKEN)
}

export function buildRemoteTask(input: {
  projectId?: string
  objective?: string
  mode?: string
  preferredAgent?: string
}): RemoteTaskEnvelope {
  const objective = typeof input.objective === 'string' ? input.objective.trim() : ''
  if (!objective || objective.length > 4000) throw new Error('Objective is required and must be 4000 characters or less')

  const mode: RemoteTaskMode = ['build','verify','preview'].includes(input.mode ?? '')
    ? input.mode as RemoteTaskMode
    : 'build'
  const preferredAgent: RemoteTaskAgent = ['auto','codex','claude-code'].includes(input.preferredAgent ?? '')
    ? input.preferredAgent as RemoteTaskAgent
    : 'auto'

  const project = getProjectRegistry().projects.find((item) => item.id === input.projectId)
  if (!project || !project.repository) throw new Error('Project must be registered with a repository')

  return {
    evento_task_version: 1,
    state: 'approved',
    project_id: project.id,
    repository: project.repository,
    objective,
    mode,
    preferred_agent: preferredAgent,
    release: false,
    approved_at: new Date().toISOString(),
    approved_via: 'android-admin',
  }
}

export async function createRemoteTaskIssue(task: RemoteTaskEnvelope) {
  if (!remoteTasksEnabled()) throw new Error('Remote task queue is disabled')
  const repository = taskRepo()
  const response = await fetch(`https://api.github.com/repos/${repository}/issues`, {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify({
      title: `[EVENTO TASK][APPROVED] ${task.project_id}: ${task.objective.slice(0, 96)}`,
      body: JSON.stringify(task, null, 2),
    }),
    cache: 'no-store',
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload?.message || `GitHub issue creation failed: ${response.status}`)
  return {
    number: payload.number as number,
    url: payload.html_url as string,
    title: payload.title as string,
    task,
  }
}


async function issueComments(repository: string, issueNumber: number) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/issues/${issueNumber}/comments?per_page=50`,
    { headers: githubHeaders(), cache: 'no-store' },
  )
  const comments = await response.json()
  if (!response.ok || !Array.isArray(comments)) return []
  return comments.map((comment: any) => ({
    body: typeof comment.body === 'string' ? comment.body : '',
    createdAt: typeof comment.created_at === 'string' ? comment.created_at : '',
  }))
}

function extractTaskEvidence(comments: Array<{ body: string; createdAt: string }>) {
  const evidence = [...comments].reverse().find((comment) => comment.body.includes('EVENTO execution evidence'))
  const handoff = [...comments].reverse().find((comment) => comment.body.includes('EVENTO PR handoff'))
  const readiness = [...comments].reverse().find((comment) => comment.body.includes('EVENTO merge readiness'))
  const merged = [...comments].reverse().find((comment) => comment.body.includes('EVENTO protected merge'))
  const postMerge = [...comments].reverse().find((comment) => comment.body.includes('EVENTO post-merge verification'))
  const deployReadinessComment = [...comments].reverse().find((comment) => comment.body.includes('EVENTO deploy readiness'))
  const previewDeployComment = [...comments].reverse().find((comment) => comment.body.includes('EVENTO preview deploy'))
  const productionReadinessComment = [...comments].reverse().find((comment) => comment.body.includes('EVENTO production readiness'))
  const rollbackReadinessComment = [...comments].reverse().find((comment) => comment.body.includes('EVENTO rollback readiness'))
  const productionDeployComment = [...comments].reverse().find((comment) => comment.body.includes('EVENTO protected production deploy'))
  const prMatch = handoff?.body.match(/https:\/\/github\.com\/[^\s)]+\/pull\/\d+/)
  let mergeReadiness: any = null
  if (readiness) {
    const marker = 'EVENTO_MERGE_READINESS_JSON='
    const index = readiness.body.indexOf(marker)
    if (index >= 0) {
      const raw = readiness.body.slice(index + marker.length).split('\n')[0]
      try { mergeReadiness = JSON.parse(raw) } catch {}
    }
  }
  let postMergeVerification: any = null
  if (postMerge) {
    const marker = 'EVENTO_POST_MERGE_JSON='
    const index = postMerge.body.indexOf(marker)
    if (index >= 0) {
      const raw = postMerge.body.slice(index + marker.length).split('\n')[0]
      try { postMergeVerification = JSON.parse(raw) } catch {}
    }
  }
  let deployReadiness: any = null
  if (deployReadinessComment) {
    const marker = 'EVENTO_DEPLOY_READINESS_JSON='
    const index = deployReadinessComment.body.indexOf(marker)
    if (index >= 0) {
      const raw = deployReadinessComment.body.slice(index + marker.length).split('\n')[0]
      try { deployReadiness = JSON.parse(raw) } catch {}
    }
  }
  let previewDeploy: any = null
  if (previewDeployComment) {
    const marker = 'EVENTO_PREVIEW_DEPLOY_JSON='
    const index = previewDeployComment.body.indexOf(marker)
    if (index >= 0) {
      const raw = previewDeployComment.body.slice(index + marker.length).split('\n')[0]
      try { previewDeploy = JSON.parse(raw) } catch {}
    }
  }
  let productionReadiness: any = null
  if (productionReadinessComment) {
    const marker = 'EVENTO_PRODUCTION_READINESS_JSON='
    const index = productionReadinessComment.body.indexOf(marker)
    if (index >= 0) {
      const raw = productionReadinessComment.body.slice(index + marker.length).split('\n')[0]
      try { productionReadiness = JSON.parse(raw) } catch {}
    }
  }
  let rollbackReadiness: any = null
  if (rollbackReadinessComment) {
    const marker = 'EVENTO_ROLLBACK_READINESS_JSON='
    const index = rollbackReadinessComment.body.indexOf(marker)
    if (index >= 0) {
      const raw = rollbackReadinessComment.body.slice(index + marker.length).split('\n')[0]
      try { rollbackReadiness = JSON.parse(raw) } catch {}
    }
  }
  let productionDeploy: any = null
  if (productionDeployComment) {
    const marker = 'EVENTO_PRODUCTION_DEPLOY_JSON='
    const index = productionDeployComment.body.indexOf(marker)
    if (index >= 0) {
      const raw = productionDeployComment.body.slice(index + marker.length).split('\n')[0]
      try { productionDeploy = JSON.parse(raw) } catch {}
    }
  }
  return {
    evidenceSummary: evidence ? evidence.body.slice(0, 2400) : null,
    evidenceAt: evidence?.createdAt ?? null,
    prUrl: prMatch?.[0] ?? null,
    handoffSummary: handoff ? handoff.body.slice(0, 1600) : null,
    mergeReadiness,
    mergeReadinessAt: readiness?.createdAt ?? null,
    mergeSummary: merged ? merged.body.slice(0, 1600) : null,
    mergeAt: merged?.createdAt ?? null,
    postMergeVerification,
    postMergeAt: postMerge?.createdAt ?? null,
    deployReadiness,
    deployReadinessAt: deployReadinessComment?.createdAt ?? null,
    previewDeploy,
    previewDeployAt: previewDeployComment?.createdAt ?? null,
    productionReadiness,
    productionReadinessAt: productionReadinessComment?.createdAt ?? null,
    rollbackReadiness,
    rollbackReadinessAt: rollbackReadinessComment?.createdAt ?? null,
    productionDeploy,
    productionDeployAt: productionDeployComment?.createdAt ?? null,
  }
}

export async function listRemoteTaskIssues() {
  if (!remoteTasksEnabled()) throw new Error('Remote task queue is disabled')
  const repository = taskRepo()
  const response = await fetch(`https://api.github.com/repos/${repository}/issues?state=open&per_page=50`, {
    headers: githubHeaders(),
    cache: 'no-store',
  })
  const issues = await response.json()
  if (!response.ok) throw new Error(issues?.message || `GitHub issue listing failed: ${response.status}`)
  if (!Array.isArray(issues)) return []

  const parsed = issues.flatMap((issue: any) => {
    const title = typeof issue.title === 'string' ? issue.title : ''
    const state = taskStateFromTitle(title)
    if (!state || typeof issue.body !== 'string') return []
    try {
      const task = JSON.parse(issue.body) as RemoteTaskEnvelope
      if (task.evento_task_version !== 1 || task.release !== false) return []
      return [{
        number: issue.number as number,
        url: issue.html_url as string,
        title,
        state,
        task,
      }]
    } catch {
      return []
    }
  }).slice(0, 20)

  return Promise.all(parsed.map(async (row) => ({
    ...row,
    ...(extractTaskEvidence(await issueComments(repository, row.number))),
  })))
}


export async function applyRemoteTaskDecision(input: {
  issueNumber?: number
  action?: string
  note?: string
}) {
  if (!remoteTasksEnabled()) throw new Error('Remote task queue is disabled')
  const issueNumber = Number(input.issueNumber)
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) throw new Error('Invalid task number')
  const action = input.action
  if (!['request-revision','approve-merge-handoff','accept-preview','approve-production-handoff'].includes(action ?? '')) {
    throw new Error('Task decision is not allowlisted')
  }

  const repository = taskRepo()
  const issueUrl = `https://api.github.com/repos/${repository}/issues/${issueNumber}`
  const response = await fetch(issueUrl, { headers: githubHeaders(), cache: 'no-store' })
  const issue = await response.json()
  if (!response.ok) throw new Error(issue?.message || `Task lookup failed: ${response.status}`)

  const title = typeof issue.title === 'string' ? issue.title : ''
  const currentState = taskStateFromTitle(title)
  if (!currentState) throw new Error('Issue is not an EVENTO remote task')

  let nextState: RemoteTaskState
  let prefix: string
  let auditText: string

  if (action === 'request-revision') {
    if (!['local-built','pr-open','merge-handoff-approved','preview-verified','preview-accepted','production-handoff-approved'].includes(currentState)) {
      throw new Error('Revision can only be requested after a build, PR handoff, or preview review')
    }
    nextState = 'revision-requested'
    prefix = '[EVENTO TASK][REVISION-REQUESTED]'
    auditText = 'Revision requested from EVENTO Admin Android. No merge, deploy, or release action was performed.'
  } else if (action === 'approve-merge-handoff') {
    if (currentState !== 'pr-open') {
      throw new Error('Merge handoff approval requires a PR-open task')
    }
    nextState = 'merge-handoff-approved'
    prefix = '[EVENTO TASK][MERGE-HANDOFF-APPROVED]'
    auditText = 'Merge handoff approved from EVENTO Admin Android. This is an approval marker only; no merge, deploy, or release action was performed.'
  } else if (action === 'accept-preview') {
    if (currentState !== 'preview-verified') {
      throw new Error('Preview acceptance requires a PREVIEW-VERIFIED task')
    }
    nextState = 'preview-accepted'
    prefix = '[EVENTO TASK][PREVIEW-ACCEPTED]'
    auditText = 'Preview accepted from EVENTO Admin Android. This does not authorize production deployment or release.'
  } else {
    if (currentState !== 'preview-accepted') {
      throw new Error('Production handoff approval requires a PREVIEW-ACCEPTED task')
    }
    const comments = await issueComments(repository, issueNumber)
    const evidence = extractTaskEvidence(comments)
    if (evidence.productionReadiness?.ready !== true) {
      throw new Error('Production handoff approval requires READY production-readiness evidence')
    }
    nextState = 'production-handoff-approved'
    prefix = '[EVENTO TASK][PRODUCTION-HANDOFF-APPROVED]'
    auditText = 'Production handoff approved from EVENTO Admin Android. This is an approval marker only; no production deploy or release action was performed.'
  }

  const suffix = title.replace(/^\[EVENTO TASK\]\[[^\]]+\]\s*/, '')
  const patch = await fetch(issueUrl, {
    method: 'PATCH',
    headers: githubHeaders(),
    body: JSON.stringify({ title: `${prefix} ${suffix}` }),
    cache: 'no-store',
  })
  const patched = await patch.json()
  if (!patch.ok) throw new Error(patched?.message || `Task state update failed: ${patch.status}`)

  const note = typeof input.note === 'string' && input.note.trim()
    ? `\n\nOperator note:\n${input.note.trim().slice(0, 2000)}`
    : ''
  const comment = await fetch(`${issueUrl}/comments`, {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify({
      body: `## EVENTO mobile decision\n\n${auditText}${note}\n\nResulting state: **${nextState}**`,
    }),
    cache: 'no-store',
  })
  if (!comment.ok) throw new Error(`Task audit comment failed: ${comment.status}`)

  return {
    ok: true,
    number: issueNumber,
    previousState: currentState,
    state: nextState,
    merge: false,
    deploy: false,
    release: false,
  }
}
