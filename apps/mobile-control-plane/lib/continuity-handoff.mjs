const adapters = new Set(['codex', 'claude-code', 'antigravity'])
const protectedRoles = new Set(['COMPANY_CORE', 'INTERNAL_CONTROL_PLANE', 'SHARED_CAPABILITY', 'SHARED_DATA'])

/** Pure context compiler. It prepares a handoff and grants no execution authority. */
export function createContinuityHandoff(snapshot, projectId, adapter, taskId) {
  if (!adapters.has(adapter)) throw new Error('Unknown agent adapter')
  if (!/^CONT-[A-Za-z0-9-]{8,80}$/.test(taskId)) throw new Error('Invalid task id')
  const project = snapshot.projects.find((item) => item.id === projectId)
  if (!project) throw new Error('Unknown project')
  if (snapshot.policy.external_execution_enabled || snapshot.policy.production_release_enabled) {
    throw new Error('Continuity handoff does not support release or execution authority')
  }
  const protectedProject = protectedRoles.has(project.role)
  const context = {
    snapshot_id: snapshot.snapshot_id,
    revision: snapshot.revision,
    observed_at: snapshot.observed_at,
    project_id: project.id,
    repository: project.repository,
    source_ref: project.source_ref,
    contract_ref: project.contract_ref,
    source_pack_ids: project.source_pack_ids,
    evidence: project.evidence,
    evidence_state: project.evidence_state,
    open_gates: project.open_gates,
    authority: snapshot.authority,
    protected_project: protectedProject,
    runtime_proof: 'UNVERIFIED_UNTIL_EXECUTED',
  }
  const task = {
    task_id: taskId,
    project_id: project.id,
    objective: project.next_action,
    acceptance_criteria: [
      'Refresh source and compare the pinned ref before editing; record any drift.',
      'Deliver one complete reviewable source increment with applicable passing checks.',
      'Attach source ref, commands, exit codes, timestamps, artifact hashes, and remaining blockers.',
      'Write a new checkpoint and exactly one next action; preserve unfinished engine/device gates.',
    ],
    non_goals: ['New control plane architecture', 'Customer daily operations', 'Unrelated projects'],
    target_platforms: ['cloud-source', 'web', 'portable-handoff'],
    mode: 'build',
    risk: protectedProject ? 'high' : 'medium',
    required_evidence: ['current source ref', 'isolated applicable tests', 'checkpoint SHA-256', 'remaining gates'],
    dependencies: ['nearest AGENTS.md', 'EVENTO Agent Contract v1', 'EVENTO Productization Governor v1 when applicable'],
    allowed_actions: ['read-source', 'isolated-branch-edit', 'cloud-tests', 'prepare-assets-and-handoff'],
    forbidden_actions: ['production-migration', 'store-release', 'credential-export', 'arbitrary-remote-shell', 'self-approval', 'sellable-with-open-P0'],
    deployment_trigger: null,
    rollback: 'Discard the isolated task branch or restore the previous checkpoint to a new directory.',
    budget_cap: null,
    preferred_agents: [adapter],
    status: 'planning',
  }
  const prompt = [
    `EVENTO CONTINUE | ${project.name} | ${adapter}`,
    `Snapshot ${snapshot.snapshot_id} revision ${snapshot.revision}, observed ${snapshot.observed_at}.`,
    `Repository ${project.repository || 'see source-pack ledger'}; source ref ${project.source_ref || 'hashed source pack'}.`,
    `Read project instructions, current source, Context Pack, and manifest/readiness before work.`,
    `Refresh current refs and evidence. The snapshot is historical and source-reported scores are not a new audit.`,
    `Next action: ${project.next_action}`,
    `No PC is available now: complete source, JSON, references, catalog, CI, and scripts; mark engine/device/signing execution DEFERRED when unavailable.`,
    `Reuse current code and assets. Finish one bounded increment. Do not open a new architecture or duplicate source of truth.`,
    `Protect EVENTO core/private dependencies. Customer owns domain/data/secrets/admin after handoff; EVENTO does not operate the customer's daily business.`,
    `Preserve ALL mandatory gates and unresolved P0. Never claim SELLABLE, production, signed, or Unity PASS from a prepared script or screenshot alone.`,
    `Work on an isolated branch. Never include credentials in output. Release/migrations/store/signing authority stays separate.`,
    `Return a Task/Context/Evidence checkpoint, ref+run+artifact hashes, verified changes, remaining blockers, and one NEXT ACTION.`,
    `Open gates: ${project.open_gates.join(' | ')}`,
    `Evidence: ${project.evidence.map((item) => item.url || item.name || item.library_file_id).join(' | ')}`,
  ].join('\n\n')
  return { task, context, prompt, execution: 'handoff-only' }
}
