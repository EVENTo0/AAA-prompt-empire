'use client'

import { useEffect, useState } from 'react'
import type { ProjectRegistryItem } from '@/lib/project-registry'

type RegistryResponse = {
  generatedAt: string
  summary: {
    total: number
    active: number
    saleReady: number
    linkedRepos: number
    linkedVercel: number
    linkedSupabase: number
  }
  projects: ProjectRegistryItem[]
}

const stateClass = (value: string) => {
  const v = value.toLowerCase()
  if (['active', 'ready', 'published', 'for-sale'].includes(v)) return 'good'
  if (['paused', 'internal', 'portfolio'].includes(v)) return 'warn'
  return 'quiet'
}

export default function ProjectRegistryPanel() {
  const [data, setData] = useState<RegistryResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/registry', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign('/login')
          return null
        }
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Registry unavailable')
        return payload as RegistryResponse
      })
      .then((payload) => { if (!cancelled && payload) setData(payload) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Registry unavailable') })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="panel" id="registry">
      <div className="sectionHead">
        <div><p className="sectionKicker">EMPIRE REGISTRY</p><h2>Project Matrix</h2></div>
        <span className="muted">{data ? `${data.summary.active}/${data.summary.total} active` : 'Loading…'}</span>
      </div>
      {error ? <div className="banner danger" role="alert">{error}</div> : null}
      {data ? <div className="statGrid" aria-label="Registry coverage">
        <article className="statCard"><span>Projects</span><strong>{data.summary.total}</strong><small>Tracked by Empire</small></article>
        <article className="statCard"><span>GitHub linked</span><strong>{data.summary.linkedRepos}</strong><small>Repository evidence</small></article>
        <article className="statCard"><span>Vercel linked</span><strong>{data.summary.linkedVercel}</strong><small>Deployment evidence</small></article>
        <article className="statCard"><span>Supabase linked</span><strong>{data.summary.linkedSupabase}</strong><small>Backend evidence</small></article>
      </div> : null}
      <div className="catalogGrid">
        {data?.projects.map((project) => (
          <article className="catalogCard" key={project.id}>
            <div>
              <div className="repoTop">
                <span className={`statusDot ${stateClass(project.status)}`}>{project.status}</span>
                <span className="muted">{project.priority}</span>
              </div>
              <h3>{project.name}</h3>
              <p>{project.kind} · {project.saleStatus}</p>
              <div className="agentChips">{project.platforms.map((platform) => <span key={platform}>{platform}</span>)}</div>
            </div>
            <div className="catalogFoot">
              <b>{project.repository ? 'GitHub ✓' : 'GitHub —'}</b>
              <span>{project.vercelProject ? 'Vercel ✓' : 'Vercel —'} · {project.supabaseProjectRef ? 'Supabase ✓' : 'Supabase —'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
