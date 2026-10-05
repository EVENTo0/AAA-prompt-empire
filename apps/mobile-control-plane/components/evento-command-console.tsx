'use client'

import { useEffect, useState } from 'react'

type Project = { id:string; name:string; priority:string; status:string }
type CommandPlan = {
  generatedAt:string
  execution:string
  plan:{
    project:{id:string;name:string;priority:string;status:string;repository:string|null;platforms:string[]}
    mode:string
    objective:string
    risk:string
    route:string[]
    requiredEvidence:string[]
    allowedToExecute:boolean
    releaseProtected:boolean
    nextAction:string
    notes:string[]
  }
}

export default function EventoCommandConsole() {
  const [projects,setProjects]=useState<Project[]>([])
  const [projectId,setProjectId]=useState('')
  const [mode,setMode]=useState('continue')
  const [prompt,setPrompt]=useState('Continue the highest-value safe next step toward DONE.')
  const [result,setResult]=useState<CommandPlan|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{
    fetch('/api/registry',{cache:'no-store'})
      .then(async r=>r.ok?r.json():Promise.reject(new Error('Registry unavailable')))
      .then(data=>setProjects((data.projects??[]).map((p:any)=>({id:p.id,name:p.name,priority:p.priority,status:p.status}))))
      .catch(()=>undefined)
  },[])

  async function run() {
    setBusy(true)
    setError('')
    try {
      const response=await fetch('/api/evento/command',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({projectId:projectId||undefined,mode,prompt}),
      })
      const body=await response.json()
      if(!response.ok) throw new Error(body.error||'EVENTO command failed')
      setResult(body)
    } catch(err) {
      setError(err instanceof Error?err.message:'EVENTO command failed')
    } finally {
      setBusy(false)
    }
  }

  return <div className="eventoConsole">
    <div className="commandComposer">
      <label>
        <span>Project</span>
        <select value={projectId} onChange={e=>setProjectId(e.target.value)}>
          <option value="">AUTO · highest-value project</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.priority} · {p.name}</option>)}
        </select>
      </label>
      <label>
        <span>Mode</span>
        <select value={mode} onChange={e=>setMode(e.target.value)}>
          {['continue','plan','build','verify','preview','learn','release'].map(x=><option key={x} value={x}>{x.toUpperCase()}</option>)}
        </select>
      </label>
      <label className="commandPrompt">
        <span>Command</span>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4} />
      </label>
      <button className="eventoRun" onClick={run} disabled={busy||!prompt.trim()}>{busy?'Planning…':'RUN WITH EVENTO'}</button>
    </div>

    {error?<div className="banner bad" role="alert">{error}</div>:null}

    {result?<div className="commandResult">
      <div className="commandSummary">
        <div><span>Project</span><b>{result.plan.project.name}</b></div>
        <div><span>Mode</span><b>{result.plan.mode}</b></div>
        <div><span>Risk</span><b>{result.plan.risk}</b></div>
        <div><span>Execution</span><b>{result.execution}</b></div>
      </div>
      <div className="routeLine">{result.plan.route.map((step,i)=><span key={step}>{i?'→ '+step:step}</span>)}</div>
      <div className="commandColumns">
        <div><h3>Next action</h3><p>{result.plan.nextAction}</p><h3>Objective</h3><p>{result.plan.objective}</p></div>
        <div><h3>Required evidence</h3><ul>{result.plan.requiredEvidence.map(x=><li key={x}>{x}</li>)}</ul></div>
      </div>
      <div className="commandNotes">{result.plan.notes.map(x=><span key={x}>{x}</span>)}</div>
    </div>:null}
  </div>
}
