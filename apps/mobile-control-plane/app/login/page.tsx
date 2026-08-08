'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/session/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Sign in failed')
      router.replace('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="loginShell">
      <section className="loginCard" aria-labelledby="login-title">
        <div className="brandMark">A+</div>
        <p className="eyebrow">AAA+ ENGINEERING EMPIRE</p>
        <h1 id="login-title">Mobile Control Plane</h1>
        <p className="muted">Private operator access for EVENTO projects, builds, agents, deployments and backend health.</p>
        <form onSubmit={submit} className="loginForm">
          <label htmlFor="access-key">Operator access key</label>
          <input id="access-key" type="password" autoComplete="current-password" value={key} onChange={(e) => setKey(e.target.value)} minLength={24} required />
          {error ? <p className="errorText" role="alert">{error}</p> : null}
          <button className="primaryButton" disabled={busy}>{busy ? 'Authenticating…' : 'Enter Control Plane'}</button>
        </form>
        <p className="finePrint">Credentials stay server-side. Session cookies are HttpOnly, SameSite=Strict and time-limited.</p>
      </section>
    </main>
  )
}
