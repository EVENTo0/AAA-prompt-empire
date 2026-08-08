'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Overview, RepoSnapshot, WorkflowRun } from '@/lib/control-plane'

const empty: Overview = {
  generatedAt: '', mode: 'unconfigured', repos: [], deployments: [], supabase: [], catalog: [], integrations: {}, capabilities: { writes: false, allowedWorkflows: [] },
}

function statusClass(value: string | null | undefined) {
  const normalized = (value ?? '').toLowerCase()
  if (['healthy', 'live', 'ready', 'success', 'active_healthy'].includes(normalized)) return 'good'
  if (['failing', 'failure', 'error', 'canceled', 'cancelled'].includes(normalized)) return 'bad'
  if (['degraded', 'building', 'queued', 'in_progress', 'pending'].includes(normalized)) return 'warn'
  return 'quiet'
}

function timeAgo(value?: string) {
  if (!value) return '—'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function latestRun(repo: RepoSnapshot) {
  return repo.workflows[0]
}

function failedRuns(repos: RepoSnapshot[]) {
  return repos.flatMap((repo) => repo.workflows
    .filter((run) => run.status === 'completed' && !['success', 'neutral', 'skipped'].includes(run.conclusion ?? ''))
    .map((run) => ({ repo: repo.fullName, run })))
}

export default function ControlPlane() {
  const [data, setData] = useState<Overview>(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(true)
  const [actionBusy, setActionBusy] = useState('')
  const failures = useMemo(() => failedRuns(data.repos), [data.repos])
  const mobileRuns = useMemo(() => data.repos.flatMap((repo) => repo.workflows.filter((r) => /android|ios|mobile|flutter|expo/i.test(r.name))), [data.repos])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/overview', { cache: 'no-store' })
      if (response.status === 401) { window.location.assign('/login'); return }
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load control plane')
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load control plane')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setOnline(navigator.onLine)
    const onOnline = () => { setOnline(true); refresh() }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    refresh()
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [refresh])

  async function action(body: object, label: string) {
    setActionBusy(label)
    setError('')
    try {
      const response = await fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Empire-Action': '1' }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Action failed')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionBusy('')
    }
  }

  async function logout() {
    await fetch('/api/session/logout', { method: 'POST' })
    window.location.assign('/login')
  }

  const stats = [
    ['Repositories', data.repos.length, 'GitHub scope'],
    ['Agents', data.repos.reduce((sum, r) => sum + r.agents, 0), 'Codex + Claude'],
    ['Open PRs', data.repos.reduce((sum, r) => sum + r.openPrs, 0), 'Needs attention'],
    ['Failing checks', failures.length, failures.length ? 'Action required' : 'Clear'],
    ['Deployments', data.deployments.length, 'Recent Vercel'],
    ['Mobile builds', mobileRuns.length, 'Android + iOS'],
    ['Backends', data.supabase.length, 'Supabase projects'],
    ['For sale', data.catalog.filter((p) => /ready|sale|published/i.test(p.status)).length, 'EVENTO catalog'],
  ] as const

  return (
    <main className="appShell">
      <header className="topbar">
        <div>
          <p className="eyebrow">EVENTO · AAA+ ENGINEERING EMPIRE</p>
          <h1>Control Plane</h1>
        </div>
        <div className="topActions">
          <span className={`livePill ${online ? statusClass(data.mode) : 'bad'}`}>{online ? data.mode : 'OFFLINE'}</span>
          <button className="iconButton" onClick={refresh} aria-label="Refresh control plane">↻</button>
          <button className="iconButton" onClick={logout} aria-label="Sign out">⇥</button>
        </div>
      </header>

      {!online && <div className="banner danger">Offline shell only. Infrastructure data below may be stale; privileged actions are unavailable.</div>}
      {error && <div className="banner danger" role="alert">{error}</div>}
      {data.mode === 'unconfigured' && !loading && <div className="banner warn">Control Plane is installed but provider integrations are not configured. Add server-side environment secrets to switch from shell mode to live operations.</div>}

      <section className="heroCard">
        <div>
          <p className="sectionKicker">MISSION CONTROL</p>
          <h2>One phone. Every project.</h2>
          <p>Repositories, agents, PRs, CI, mobile builds, previews, deployments, backend health and sale-ready products—aggregated without exposing provider secrets to the browser.</p>
        </div>
        <div className="heroMeta">
          <span>Last sync</span>
          <strong>{loading ? 'Syncing…' : timeAgo(data.generatedAt)}</strong>
        </div>
      </section>

      <section className="statGrid" aria-label="Empire metrics">
        {stats.map(([label, value, note]) => (
          <article className="statCard" key={label}>
            <span>{label}</span><strong>{loading ? '—' : value}</strong><small>{note}</small>
          </article>
        ))}
      </section>

      <section className="panel" id="actions">
        <div className="sectionHead"><div><p className="sectionKicker">SAFE ACTIONS</p><h2>Command Deck</h2></div><span className={`statusDot ${data.capabilities.writes ? 'warn' : 'quiet'}`}>{data.capabilities.writes ? 'WRITE ENABLED' : 'READ ONLY'}</span></div>
        <div className="actionGrid">
          <button className="actionCard" onClick={refresh}><b>↻ Refresh all</b><span>Pull current provider state</span></button>
          <button className="actionCard" disabled={!online || !data.capabilities.writes || !failures[0] || Boolean(actionBusy)} onClick={() => failures[0] && action({ type: 'rerun_failed', repo: failures[0].repo, runId: failures[0].run.id, confirmation: 'rerun_failed' }, 'rerun')}><b>↺ Rerun failed CI</b><span>{failures[0] ? failures[0].repo : 'No failed runs'}</span></button>
          <button className="actionCard" disabled={!online || !data.capabilities.writes || !data.repos[0] || Boolean(actionBusy)} onClick={() => data.repos[0] && action({ type: 'dispatch_workflow', repo: data.repos[0].fullName, workflow: 'android.yml', ref: data.repos[0].defaultBranch, confirmation: 'dispatch_workflow' }, 'android')}><b>◉ Build Android</b><span>Dispatch allowlisted workflow</span></button>
          <button className="actionCard" disabled={!online || !data.capabilities.writes || !data.repos[0] || Boolean(actionBusy)} onClick={() => data.repos[0] && action({ type: 'dispatch_workflow', repo: data.repos[0].fullName, workflow: 'ios.yml', ref: data.repos[0].defaultBranch, confirmation: 'dispatch_workflow' }, 'ios')}><b>◎ Build iOS</b><span>Cloud/macOS workflow required</span></button>
        </div>
      </section>

      <section className="panel" id="projects">
        <div className="sectionHead"><div><p className="sectionKicker">PROJECTS</p><h2>Repositories & Agents</h2></div><span className="muted">{data.repos.length} scoped</span></div>
        <div className="repoList">
          {data.repos.map((repo) => {
            const run = latestRun(repo)
            return <article className="repoCard" key={repo.fullName}>
              <div className="repoTop"><div><a href={repo.url} target="_blank" rel="noreferrer"><h3>{repo.fullName}</h3></a><p>{repo.private ? 'Private' : 'Public'} · {repo.defaultBranch}</p></div><span className={`statusDot ${statusClass(repo.health)}`}>{repo.health}</span></div>
              <div className="repoMetrics"><span><b>{repo.agents}</b> agents</span><span><b>{repo.openPrs}</b> PRs</span><span><b>{repo.workflows.length}</b> runs</span></div>
              {run ? <a className="runRow" href={run.url} target="_blank" rel="noreferrer"><span className={`dot ${statusClass(run.conclusion || run.status)}`} /><div><b>{run.name}</b><small>{run.branch || '—'} · {timeAgo(run.createdAt)}</small></div><span>›</span></a> : <p className="emptyState">No workflow evidence returned.</p>}
              {repo.prs[0] ? <a className="runRow" href={repo.prs[0].url} target="_blank" rel="noreferrer"><span className="dot quiet" /><div><b>PR #{repo.prs[0].number} · {repo.prs[0].title}</b><small>{repo.prs[0].draft ? 'Draft' : 'Open for review'}</small></div><span>›</span></a> : null}
              {repo.agentNames.length ? <div className="agentChips" aria-label={`Agents in ${repo.fullName}`}>{repo.agentNames.slice(0, 8).map((name) => <span key={name}>{name}</span>)}</div> : null}
              {repo.error ? <p className="errorText">{repo.error}</p> : null}
            </article>
          })}
          {!loading && !data.repos.length ? <p className="emptyState">Configure GitHub and repository scope to populate this section.</p> : null}
        </div>
      </section>

      <section className="twoCol" id="builds">
        <div className="panel compact">
          <div className="sectionHead"><div><p className="sectionKicker">CI / BUILDS</p><h2>Latest Runs</h2></div></div>
          <div className="feedList">
            {data.repos.flatMap((repo) => repo.workflows.slice(0, 4).map((run) => <RunRow key={`${repo.fullName}-${run.id}`} repo={repo.fullName} run={run} />)).slice(0, 12)}
            {!loading && !data.repos.some((r) => r.workflows.length) ? <p className="emptyState">No workflow runs found.</p> : null}
          </div>
        </div>
        <div className="panel compact" id="deployments">
          <div className="sectionHead"><div><p className="sectionKicker">DEPLOYMENTS</p><h2>Preview URLs</h2></div></div>
          <div className="feedList">
            {data.deployments.slice(0, 10).map((d) => <a className="feedRow" href={d.url} target="_blank" rel="noreferrer" key={d.id}><span className={`dot ${statusClass(d.state)}`} /><div><b>{d.project}</b><small>{d.target || 'preview'} · {timeAgo(d.createdAt)}</small></div><span>↗</span></a>)}
            {!loading && !data.deployments.length ? <p className="emptyState">Vercel is unconfigured or no deployments were returned.</p> : null}
          </div>
        </div>
      </section>

      <section className="panel" id="backend">
        <div className="sectionHead"><div><p className="sectionKicker">BACKEND</p><h2>Supabase Health</h2></div><span className={`statusDot ${statusClass(data.integrations.supabase)}`}>{data.integrations.supabase || 'unconfigured'}</span></div>
        <div className="backendGrid">
          {data.supabase.map((project) => <article className="backendCard" key={project.ref}><div className="repoTop"><div><h3>{project.name}</h3><p>{project.region || project.ref}</p></div><span className={`statusDot ${statusClass(project.health)}`}>{project.status}</span></div><div className="serviceChips">{project.services.map((s) => <span className={statusClass(s.healthy ? 'healthy' : 'degraded')} key={s.name}>{s.name}</span>)}</div>{project.error ? <p className="errorText">{project.error}</p> : null}</article>)}
          {!loading && !data.supabase.length ? <p className="emptyState">Add a Supabase Management API token to monitor project and service health.</p> : null}
        </div>
      </section>

      <section className="panel" id="catalog">
        <div className="sectionHead"><div><p className="sectionKicker">EVENTO CATALOG</p><h2>Ready to Sell</h2></div><span className="muted">{data.catalog.length} products</span></div>
        <div className="catalogGrid">
          {data.catalog.slice(0, 12).map((p) => <article className="catalogCard" key={p.id}><div><span className={`statusDot ${statusClass(p.status)}`}>{p.status}</span><h3>{p.name}</h3><p>{p.category || 'EVENTO project'}</p></div><div className="catalogFoot"><b>{p.price || 'Quote'}</b>{p.previewUrl ? <a href={p.previewUrl} target="_blank" rel="noreferrer">Preview ↗</a> : <span>No preview</span>}</div></article>)}
          {!loading && !data.catalog.length ? <p className="emptyState">Connect `EVENTO_CATALOG_URL` to surface sale-ready packages here.</p> : null}
        </div>
      </section>

      <section className="panel compact integrationPanel">
        <div className="sectionHead"><div><p className="sectionKicker">INTEGRATIONS</p><h2>Control Plane Links</h2></div></div>
        <div className="integrationGrid">{Object.entries(data.integrations).map(([name, state]) => <div key={name}><span className={`dot ${statusClass(String(state))}`} /><b>{name}</b><small>{String(state)}</small></div>)}</div>
      </section>

      <nav className="bottomNav" aria-label="Control Plane navigation">
        <a href="#actions">⌁<span>Command</span></a><a href="#projects">◫<span>Projects</span></a><a href="#builds">△<span>Builds</span></a><a href="#deployments">↗<span>Deploy</span></a><a href="#catalog">◇<span>Sell</span></a>
      </nav>
    </main>
  )
}

function RunRow({ repo, run }: { repo: string; run: WorkflowRun }) {
  return <a className="feedRow" href={run.url} target="_blank" rel="noreferrer"><span className={`dot ${statusClass(run.conclusion || run.status)}`} /><div><b>{run.name}</b><small>{repo.split('/').pop()} · {run.branch || run.event} · {timeAgo(run.createdAt)}</small></div><span>›</span></a>
}
