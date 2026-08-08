export default function OfflinePage() {
  return (
    <main className="loginShell">
      <section className="loginCard">
        <div className="brandMark">A+</div>
        <p className="eyebrow">AAA+ ENGINEERING EMPIRE</p>
        <h1>Control Plane Offline</h1>
        <p className="muted">The PWA shell is available, but live project, CI, deployment and backend data is intentionally not cached. Reconnect to refresh verified state.</p>
        <a className="primaryButton offlineButton" href="/">Retry connection</a>
      </section>
    </main>
  )
}
