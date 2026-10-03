const { invoke } = window.__TAURI__.core

const statusEl = document.querySelector('#status')
const daemonState = document.querySelector('#daemonState')
const daemonUrl = document.querySelector('#daemonUrl')
const log = document.querySelector('#log')
const projects = document.querySelector('#projects')
const tools = document.querySelector('#tools')
const operatorMode = document.querySelector('#operatorMode')
const branchSuffix = document.querySelector('#branchSuffix')
const projectToolPath = document.querySelector('#projectToolPath')
const agentProject = document.querySelector('#agentProject')
const apkPath = document.querySelector('#apkPath')
let operatorEnabled = false

function show(result) {
  const running = Boolean(result.running)
  statusEl.textContent = running ? 'LOCAL ENGINE ONLINE' : 'LOCAL ENGINE OFFLINE'
  statusEl.className = 'pill ' + (running ? 'good' : 'quiet')
  daemonState.textContent = running ? 'ONLINE' : 'OFFLINE'
  daemonUrl.textContent = result.url + (result.version ? ' · v' + result.version : '')
  operatorEnabled = Boolean(result.writes_enabled)
  operatorMode.textContent = operatorEnabled ? 'OPERATOR' : 'READ ONLY'
  operatorMode.className = operatorEnabled ? 'good' : ''
  log.textContent = JSON.stringify(result, null, 2)
}

async function refreshStatus() {
  try { show(await invoke('daemon_status')) }
  catch (error) { log.textContent = String(error); statusEl.className = 'pill bad' }
}

function renderProjects(snapshot) {
  const items = snapshot.projects || []
  if (!items.length) {
    projects.innerHTML = '<p class="muted">No project workspaces registered.</p>'
    return
  }
  agentProject.innerHTML = items.map(item => '<option value="'+escapeHtml(item.project_id)+'">'+escapeHtml(item.project_id)+'</option>').join('')
  projects.innerHTML = items.map(item => {
    const workspace = item.workspace
    const state = workspace?.is_git ? 'git ready' : item.configured ? 'check' : 'unconfigured'
    const cls = workspace?.is_git ? 'good' : item.configured ? 'warn' : 'quiet'
    return '<article class="projectCard">' +
      '<div class="projectTop"><div><strong>'+escapeHtml(item.project_id)+'</strong><small>'+escapeHtml(item.repository)+'</small></div><span class="pill '+cls+'">'+state+'</span></div>' +
      '<p>'+escapeHtml(item.role)+'</p>' +
      (workspace ? '<div class="projectMeta"><span>branch <b>'+escapeHtml(workspace.branch || 'detached')+'</b></span><span>head <b>'+escapeHtml((workspace.head || '—').slice(0,8))+'</b></span><span>dirty <b>'+(workspace.dirty ? 'yes' : 'no')+'</b></span><span>worktrees <b>'+workspace.worktrees.length+'</b></span></div>' : '<p class="muted">Configure its local path on this device.</p>') +
      '<div class="nativeActions">' +
        '<button data-project="'+escapeHtml(item.project_id)+'" data-action="open" '+(!item.configured||!operatorEnabled?'disabled':'')+'>Open</button>' +
        '<button data-project="'+escapeHtml(item.project_id)+'" data-action="worktree" '+(!workspace?.is_git||!operatorEnabled?'disabled':'')+'>Worktree</button>' +
        '<button data-project="'+escapeHtml(item.project_id)+'" data-action="gate" '+(item.project_id!=='aaa-empire'||!operatorEnabled?'disabled':'')+'>Gate</button>' +
        '<button data-project="'+escapeHtml(item.project_id)+'" data-action="blender" '+(!item.configured||!operatorEnabled?'disabled':'')+'>Blender</button>' +
        '<button data-project="'+escapeHtml(item.project_id)+'" data-action="blender-export" '+(!item.configured||!operatorEnabled?'disabled':'')+'>Export GLB</button>' +
        '<button data-project="'+escapeHtml(item.project_id)+'" data-action="unity" '+(!item.configured||!operatorEnabled?'disabled':'')+'>Unity</button>' +
        '<button data-project="'+escapeHtml(item.project_id)+'" data-action="unity-test" '+(!item.configured||!operatorEnabled?'disabled':'')+'>Unity Test</button>' +
        '<button data-project="'+escapeHtml(item.project_id)+'" data-action="adb-install" '+(item.project_id!=='evento-mobile'||!item.configured||!operatorEnabled?'disabled':'')+'>Install APK</button>' +
      '</div>' +
      '</article>'
  }).join('')
}

async function refreshProjects() {
  projects.innerHTML = '<p class="muted">Reading EVENTO project workspaces…</p>'
  try { renderProjects(await invoke('workspace_snapshot')) }
  catch (error) { projects.innerHTML = '<p class="bad">'+escapeHtml(String(error))+'</p>' }
}

async function refreshTools() {
  tools.innerHTML = '<span>Checking…</span>'
  try {
    const result = await invoke('diagnostic_snapshot')
    const rows = result.results || []
    tools.innerHTML = rows.map(item =>
      '<span class="'+(item.available ? 'toolGood' : 'toolQuiet')+'">'+escapeHtml(item.action)+' · '+(item.available ? 'ready' : 'missing')+'</span>'
    ).join('')
  } catch (error) {
    tools.innerHTML = '<span class="bad">'+escapeHtml(String(error))+'</span>'
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

document.querySelector('#start').addEventListener('click', async () => {
  log.textContent = 'Starting EVENTO local engine…'
  try {
    show(await invoke('start_daemon'))
    await Promise.all([refreshProjects(), refreshTools()])
  } catch (error) { log.textContent = String(error); statusEl.className = 'pill bad' }
})

document.querySelector('#stop').addEventListener('click', async () => {
  try { await invoke('stop_daemon'); await refreshStatus() }
  catch (error) { log.textContent = String(error) }
})

document.querySelector('#refresh').addEventListener('click', refreshStatus)
document.querySelector('#refreshProjects').addEventListener('click', refreshProjects)
document.querySelector('#refreshTools').addEventListener('click', refreshTools)

async function boot() {
  await refreshStatus()
  try { await invoke('start_daemon') } catch (_) {}
  await refreshStatus()
  await Promise.all([refreshProjects(), refreshTools()])
}
boot()


const credentialNames = ['github','supabase','vercel','openai','anthropic','google','generic-llm']
const credentialsEl = document.querySelector('#credentials')
const credentialLog = document.querySelector('#credentialLog')
const credentialName = document.querySelector('#credentialName')
const credentialSecret = document.querySelector('#credentialSecret')
const autostartState = document.querySelector('#autostartState')

async function refreshCredentials() {
  const statuses = await Promise.all(credentialNames.map(async name => {
    try { return [name, await invoke('credential_status', { name })] }
    catch (_) { return [name, false] }
  }))
  credentialsEl.innerHTML = statuses.map(([name, exists]) =>
    '<div class="credentialCard"><span>'+escapeHtml(name)+'</span><b class="'+(exists?'good':'quiet')+'">'+(exists?'stored':'not set')+'</b></div>'
  ).join('')
}

document.querySelector('#saveCredential').addEventListener('click', async () => {
  const name = credentialName.value
  const secret = credentialSecret.value
  credentialLog.textContent = 'Saving securely…'
  try {
    await invoke('credential_set', { name, secret })
    credentialSecret.value = ''
    credentialLog.textContent = name + ' saved to OS credential store.'
    await refreshCredentials()
  } catch (error) { credentialLog.textContent = String(error) }
})

document.querySelector('#deleteCredential').addEventListener('click', async () => {
  const name = credentialName.value
  credentialLog.textContent = 'Deleting…'
  try {
    await invoke('credential_delete', { name })
    credentialLog.textContent = name + ' deleted.'
    await refreshCredentials()
  } catch (error) { credentialLog.textContent = String(error) }
})

async function refreshAutostart() {
  try {
    const enabled = await invoke('autostart_status')
    autostartState.textContent = enabled ? 'ENABLED' : 'DISABLED'
    autostartState.className = 'pill ' + (enabled ? 'good' : 'quiet')
  } catch (error) {
    autostartState.textContent = 'UNAVAILABLE'
    autostartState.className = 'pill bad'
  }
}

document.querySelector('#enableAutostart').addEventListener('click', async () => {
  try { await invoke('set_autostart', { enabled: true }); await refreshAutostart() }
  catch (error) { log.textContent = String(error) }
})

document.querySelector('#disableAutostart').addEventListener('click', async () => {
  try { await invoke('set_autostart', { enabled: false }); await refreshAutostart() }
  catch (error) { log.textContent = String(error) }
})

refreshCredentials()
refreshAutostart()


document.querySelector('#enableOperator').addEventListener('click', async () => {
  log.textContent = 'Enabling bounded Operator Mode…'
  try {
    show(await invoke('set_operator_mode', { enabled: true }))
    await Promise.all([refreshProjects(), refreshTools()])
  } catch (error) { log.textContent = String(error) }
})

document.querySelector('#disableOperator').addEventListener('click', async () => {
  log.textContent = 'Returning to read-only mode…'
  try {
    show(await invoke('set_operator_mode', { enabled: false }))
    await Promise.all([refreshProjects(), refreshTools()])
  } catch (error) { log.textContent = String(error) }
})

projects.addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]')
  if (!button || button.disabled) return
  const action = button.dataset.action
  const projectId = button.dataset.project
  let value = null
  if (action === 'worktree') value = branchSuffix.value
  if (action === 'blender' || action === 'blender-export' || action === 'unity' || action === 'unity-test') value = projectToolPath.value
  if (action === 'adb-install') value = apkPath.value
  button.disabled = true
  log.textContent = projectId + ' · ' + action + '…'
  try {
    const result = await invoke('project_action', { action, projectId, value })
    log.textContent = JSON.stringify(result, null, 2)
    await refreshProjects()
  } catch (error) {
    log.textContent = String(error)
  } finally {
    button.disabled = false
  }
})


const connectorsEl = document.querySelector('#connectors')
const connectorNames = ['github','supabase','vercel','openai','anthropic','google','generic-llm']

async function refreshConnectors() {
  connectorsEl.innerHTML = '<div class="credentialCard"><span>status</span><b class="quiet">probing…</b></div>'
  const results = await Promise.all(connectorNames.map(async name => {
    try { return await invoke('connector_probe', { name }) }
    catch (error) { return { name, configured:false, reachable:false, summary:String(error) } }
  }))
  connectorsEl.innerHTML = results.map(item =>
    '<div class="credentialCard"><span>'+escapeHtml(item.name)+'</span><b class="'+(item.reachable?'good':item.configured?'warn':'quiet')+'">'+escapeHtml(item.summary)+'</b></div>'
  ).join('')
}

document.querySelector('#refreshConnectors').addEventListener('click', refreshConnectors)
refreshConnectors()


document.querySelector('#runAgentPlan').addEventListener('click', async () => {
  const provider = document.querySelector('#agentProvider').value
  const projectId = agentProject.value
  const prompt = document.querySelector('#agentPrompt').value
  const output = document.querySelector('#agentOutput')
  output.textContent = 'Running ' + provider + ' in read-only planning mode…'
  try {
    const result = await invoke('agent_plan', { provider, projectId, prompt })
    output.textContent = result.output || JSON.stringify(result, null, 2)
  } catch (error) {
    output.textContent = String(error)
  }
})


const remoteTasksEl = document.querySelector('#remoteTasks')

async function refreshRemoteTasks() {
  remoteTasksEl.innerHTML = '<p class="muted">Reading approved GitHub tasks…</p>'
  try {
    const tasks = await invoke('remote_tasks')
    if (!tasks.length) {
      remoteTasksEl.innerHTML = '<p class="muted">No approved remote tasks.</p>'
      return
    }
    remoteTasksEl.innerHTML = tasks.map(task =>
      '<article class="projectCard">' +
        '<div class="projectTop"><div><strong>#'+task.number+' · '+escapeHtml(task.project_id)+'</strong><small>'+escapeHtml(task.mode)+' · '+escapeHtml(task.preferred_agent)+'</small></div><span class="pill '+(task.state==='pr-open'?'warn':'good')+'">'+escapeHtml(task.state)+'</span></div>' +
        '<p>'+escapeHtml(task.objective)+'</p>' +
        '<div class="nativeActions">' +
          '<button data-remote-plan="'+task.number+'" data-remote-project="'+escapeHtml(task.project_id)+'" data-remote-agent="'+escapeHtml(task.preferred_agent)+'" data-remote-objective="'+escapeHtml(task.objective)+'">Plan task</button>' +
          '<button data-remote-execute="'+task.number+'" data-remote-project="'+escapeHtml(task.project_id)+'" data-remote-agent="'+escapeHtml(task.preferred_agent)+'" data-remote-objective="'+escapeHtml(task.objective)+'" '+(!operatorEnabled||task.state!=='approved'||task.preferred_agent==='claude-code'?'disabled':'')+'>Execute build</button>' +
          '<button data-remote-review="'+task.number+'" data-remote-project="'+escapeHtml(task.project_id)+'" data-remote-objective="'+escapeHtml(task.objective)+'" '+(!operatorEnabled||task.state!=='local-built'?'disabled':'')+'>Review + Gate</button>' +
          '<button data-remote-publish="'+task.number+'" data-remote-project="'+escapeHtml(task.project_id)+'" data-remote-repository="'+escapeHtml(task.repository)+'" data-remote-objective="'+escapeHtml(task.objective)+'" '+(!operatorEnabled||task.state!=='local-built'?'disabled':'')+'>Publish Draft PR</button>' +
          '<button data-remote-pipeline="'+task.number+'" data-remote-project="'+escapeHtml(task.project_id)+'" data-remote-repository="'+escapeHtml(task.repository)+'" data-remote-agent="'+escapeHtml(task.preferred_agent)+'" data-remote-objective="'+escapeHtml(task.objective)+'" '+(!operatorEnabled||task.state!=='approved'||task.preferred_agent==='claude-code'?'disabled':'')+'>Run Safe Pipeline</button>' +
          '<button data-remote-readiness="'+task.number+'" data-remote-repository="'+escapeHtml(task.repository)+'" '+(task.state!=='merge-handoff-approved'?'disabled':'')+'>Check Merge Readiness</button>' +
          '<button data-remote-merge="'+task.number+'" data-remote-repository="'+escapeHtml(task.repository)+'" '+(task.state!=='merge-handoff-approved'?'disabled':'')+'>Protected Merge</button>' +
        '</div>' +
      '</article>'
    ).join('')
  } catch (error) {
    remoteTasksEl.innerHTML = '<p class="bad">'+escapeHtml(String(error))+'</p>'
  }
}

remoteTasksEl.addEventListener('click', async event => {
  const button = event.target.closest('button[data-remote-plan],button[data-remote-execute],button[data-remote-review],button[data-remote-publish],button[data-remote-pipeline],button[data-remote-readiness],button[data-remote-merge]')
  if (!button) return
  button.disabled = true
  const projectId = button.dataset.remoteProject
  const preferredAgent = button.dataset.remoteAgent
  const objective = button.dataset.remoteObjective
  const execute = Boolean(button.dataset.remoteExecute)
  const review = Boolean(button.dataset.remoteReview)
  const publish = Boolean(button.dataset.remotePublish)
  const pipeline = Boolean(button.dataset.remotePipeline)
  const readiness = Boolean(button.dataset.remoteReadiness)
  const protectedMerge = Boolean(button.dataset.remoteMerge)
  const issueNumber = Number(button.dataset.remoteExecute || button.dataset.remotePlan || button.dataset.remoteReview || button.dataset.remotePublish || button.dataset.remotePipeline || button.dataset.remoteReadiness || button.dataset.remoteMerge)
  const actionLabel = protectedMerge ? 'Protected merge for' : readiness ? 'Checking merge readiness for' : pipeline ? 'Running safe pipeline for' : publish ? 'Publishing draft PR for' : review ? 'Reviewing' : execute ? 'Executing' : 'Planning'
  log.textContent = actionLabel + ' approved task #' + issueNumber + '…'
  try {
    let result
    if (protectedMerge) {
      const expected = 'MERGE #' + issueNumber
      const confirmation = window.prompt('Type ' + expected + ' to merge this PR. This does not deploy or release.')
      if (confirmation !== expected) throw new Error('Protected merge confirmation did not match.')
      result = await invoke('remote_task_protected_merge', {
        issueNumber,
        repository: button.dataset.remoteRepository,
        confirmation,
      })
    } else if (readiness) {
      result = await invoke('remote_task_merge_readiness', {
        issueNumber,
        repository: button.dataset.remoteRepository,
      })
    } else if (pipeline) {
      result = await invoke('remote_task_safe_pipeline', {
        issueNumber,
        projectId,
        repository: button.dataset.remoteRepository,
        objective,
        preferredAgent,
      })
    } else if (publish) {
      result = await invoke('remote_task_publish_pr', {
        issueNumber,
        projectId,
        repository: button.dataset.remoteRepository,
        objective,
      })
    } else if (review) {
      result = await invoke('remote_task_review_gate', { issueNumber, projectId, objective })
    } else if (execute) {
      result = await invoke('remote_task_execute', { issueNumber, projectId, objective, preferredAgent })
    } else {
      result = await invoke('remote_task_plan', { projectId, objective, preferredAgent })
    }
    log.textContent = result.output || result.agent_summary || JSON.stringify(result, null, 2)
    if (execute || review || publish || pipeline || readiness || protectedMerge) await refreshRemoteTasks()
  } catch (error) {
    log.textContent = String(error)
  } finally {
    button.disabled = false
  }
})

document.querySelector('#refreshRemoteTasks').addEventListener('click', refreshRemoteTasks)
refreshRemoteTasks()
