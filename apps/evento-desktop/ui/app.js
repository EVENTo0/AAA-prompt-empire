const { invoke } = window.__TAURI__.core

const statusEl = document.querySelector('#status')
const daemonState = document.querySelector('#daemonState')
const daemonUrl = document.querySelector('#daemonUrl')
const log = document.querySelector('#log')

function show(result) {
  const running = Boolean(result.running)
  statusEl.textContent = running ? 'LOCAL ENGINE ONLINE' : 'LOCAL ENGINE OFFLINE'
  statusEl.className = 'pill ' + (running ? 'good' : 'quiet')
  daemonState.textContent = running ? 'ONLINE' : 'OFFLINE'
  daemonUrl.textContent = result.url + (result.version ? ' · v' + result.version : '')
  log.textContent = JSON.stringify(result, null, 2)
}

async function refresh() {
  try { show(await invoke('daemon_status')) }
  catch (error) { log.textContent = String(error); statusEl.className = 'pill bad' }
}

document.querySelector('#start').addEventListener('click', async () => {
  log.textContent = 'Starting EVENTO local engine…'
  try { show(await invoke('start_daemon')) }
  catch (error) { log.textContent = String(error); statusEl.className = 'pill bad' }
})

document.querySelector('#stop').addEventListener('click', async () => {
  try { await invoke('stop_daemon'); await refresh() }
  catch (error) { log.textContent = String(error) }
})

document.querySelector('#refresh').addEventListener('click', refresh)
refresh()
