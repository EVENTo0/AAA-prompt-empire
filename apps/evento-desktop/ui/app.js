const { invoke } = window.__TAURI__.core

const statusEl = document.querySelector('#status')
const daemonState = document.querySelector('#daemonState')
const daemonUrl = document.querySelector('#daemonUrl')
const log = document.querySelector('#log')
const projects = document.querySelector('#projects')
const tools = document.querySelector('#tools')

function show(result) {
  const running = Boolean(result.running)
  statusEl.textContent = running ? 'LOCAL ENGINE ONLINE' : 'LOCAL ENGINE OFFLINE'
  statusEl.className = 'pill ' + (running ? 'good' : 'quiet')
  daemonState.textContent = running ? 'ONLINE' : 'OFFLINE'
  daemonUrl.textContent = result.url + (result.version ? ' · v' + result.version : '')
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
  projects.innerHTML = items.map(item => {
    const workspace = item.workspace
    const state = workspace?.is_git ? 'git ready' : item.configured ? 'check' : 'unconfigured'
    const cls = workspace?.is_git ? 'good' : item.configured ? 'warn' : 'quiet'
    return '<article class="projectCard">' +
      '<div class="projectTop"><div><strong>'+escapeHtml(item.project_id)+'</strong><small>'+escapeHtml(item.repository)+'</small></div><span class="pill '+cls+'">'+state+'</span></div>' +
      '<p>'+escapeHtml(item.role)+'</p>' +
      (workspace ? '<div class="projectMeta"><span>branch <b>'+escapeHtml(workspace.branch || 'detached')+'</b></span><span>head <b>'+escapeHtml((workspace.head || '—').slice(0,8))+'</b></span><span>dirty <b>'+(workspace.dirty ? 'yes' : 'no')+'</b></span><span>worktrees <b>'+workspace.worktrees.length+'</b></span></div>' : '<p class="muted">Configure its local path on this device.</p>') +
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
