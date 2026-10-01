import { getEventoModernizationSnapshot } from '@/lib/evento-modernization'

export default function EventoCommandCenter() {
  const data = getEventoModernizationSnapshot()

  return (
    <section className="panel" id="evento-command-center">
      <div className="sectionHead">
        <div>
          <p className="sectionKicker">EVENTO CONTROL PLANE</p>
          <h2>Command Center</h2>
        </div>
        <span className="muted">Memory + Agent Contract v1</span>
      </div>

      <div className="statGrid" aria-label="EVENTO operating limits">
        <article className="statCard"><span>Active limit</span><strong>{data.policy.max_active}</strong><small>Finish before expanding</small></article>
        <article className="statCard"><span>Supporting limit</span><strong>{data.policy.max_supporting}</strong><small>Bounded supporting lane</small></article>
        <article className="statCard"><span>Pilot projects</span><strong>{data.pilots.length}</strong><small>Authority-chain rollout</small></article>
        <article className="statCard"><span>Agent adapters</span><strong>{data.agents.length}</strong><small>Provider-neutral routing</small></article>
      </div>

      <div className="agentChips" aria-label="EVENTO commands">
        {data.commands.map((command) => <span key={command}>{command}</span>)}
      </div>

      <div className="catalogGrid">
        {data.pilots.map((pilot, index) => (
          <article className="catalogCard" key={pilot.project_id}>
            <div>
              <div className="repoTop">
                <span className="statusDot good">pilot {index + 1}</span>
                <span className="muted">{pilot.phase}</span>
              </div>
              <h3>{pilot.project_id}</h3>
              <p>{pilot.role}</p>
              <div className="agentChips">
                {pilot.required_lanes.map((lane) => <span key={lane}>{lane}</span>)}
              </div>
            </div>
            <div className="catalogFoot">
              <b>{pilot.repository}</b>
              <span>Memory → Contract → Evidence → Preview</span>
            </div>
          </article>
        ))}
      </div>

      <div className="banner">
        CONTINUE selects the highest-value bounded next step. RELEASE remains a separate protected action.
      </div>
    </section>
  )
}
