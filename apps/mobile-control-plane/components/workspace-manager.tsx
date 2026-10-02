'use client'

import { useEffect, useState } from 'react'

type Snapshot = {
  source: string
  daemonUrl: string | null
  projects: Array<{
    project_id:string
    repository:string
    role:string
    configured:boolean
    workspace:null|{path:string;exists:boolean;is_git:boolean;branch:string|null;head:string|null;dirty:boolean|null;worktrees:string[]}
  }>
  error?:string
}

export default function WorkspaceManagerPanel() {
  const [data,setData]=useState<Snapshot|null>(null)

  useEffect(()=>{
    fetch('/api/evento/workspaces',{cache:'no-store'})
      .then(async r=>r.ok?r.json():Promise.reject(new Error('Workspace manager unavailable')))
      .then(setData)
      .catch(e=>setData({source:'error',daemonUrl:null,projects:[],error:e.message}))
  },[])

  return <section className="panel" id="workspaces">
    <div className="sectionHead">
      <div><p className="sectionKicker">EVENTO DESKTOP</p><h2>Project Workspace Manager</h2></div>
      <span className={'statusDot '+(data?.source==='daemon'?'good':data?.source==='error'?'bad':'quiet')}>{data?.source??'loading'}</span>
    </div>
    {!data?<p className="emptyState">Loading local workspace state…</p>:null}
    {data?.source==='unconfigured'?<div className="banner warn">Local daemon bridge is not configured on this Control Plane instance. Project paths stay device-local by design.</div>:null}
    {data?.error?<div className="banner bad">{data.error}</div>:null}
    <div className="workspaceGrid">
      {data?.projects.map(p=><article className="workspaceCard" key={p.project_id}>
        <div className="repoTop">
          <div><h3>{p.project_id}</h3><p>{p.repository}</p></div>
          <span className={'statusDot '+(p.workspace?.is_git?'good':p.configured?'warn':'quiet')}>{p.workspace?.is_git?'git ready':p.configured?'check':'unconfigured'}</span>
        </div>
        <p className="workspaceRole">{p.role}</p>
        {p.workspace?<div className="workspaceMeta">
          <span>Branch <b>{p.workspace.branch??'detached'}</b></span>
          <span>HEAD <b>{p.workspace.head?.slice(0,8)??'—'}</b></span>
          <span>Dirty <b>{p.workspace.dirty?'yes':'no'}</b></span>
          <span>Worktrees <b>{p.workspace.worktrees.length}</b></span>
        </div>:<p className="emptyState">Configure this project path only on the desktop daemon host.</p>}
      </article>)}
    </div>
  </section>
}
