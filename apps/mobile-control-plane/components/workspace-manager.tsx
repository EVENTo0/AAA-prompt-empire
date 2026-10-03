'use client'

import { useCallback, useEffect, useState } from 'react'

type Snapshot = {
  source: string
  daemonUrl: string | null
  writeExecution:boolean
  writeActions:string[]
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
  const [busy,setBusy]=useState('')
  const [message,setMessage]=useState('')
  const [suffix,setSuffix]=useState('next')
  const [assetPath,setAssetPath]=useState('.')

  const refresh=useCallback(()=>{
    fetch('/api/evento/workspaces',{cache:'no-store'})
      .then(async r=>r.ok?r.json():Promise.reject(new Error('Workspace manager unavailable')))
      .then(setData)
      .catch(e=>setData({source:'error',daemonUrl:null,writeExecution:false,writeActions:[],projects:[],error:e.message}))
  },[])

  useEffect(()=>{ refresh() },[refresh])

  async function action(projectId:string, actionName:string, extra:Record<string,string>={}) {
    const key=projectId+':'+actionName
    setBusy(key); setMessage('')
    try {
      const response=await fetch('/api/evento/workspaces/action',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({projectId,action:actionName,...extra}),
      })
      const body=await response.json()
      if(!response.ok) throw new Error(body.error||'Action failed')
      setMessage(projectId+' · '+actionName+' completed')
      refresh()
    } catch(error) {
      setMessage(error instanceof Error?error.message:'Action failed')
    } finally { setBusy('') }
  }

  const canWrite=data?.source==='daemon'&&data.writeExecution

  return <section className="panel" id="workspaces">
    <div className="sectionHead">
      <div><p className="sectionKicker">EVENTO DESKTOP</p><h2>Project Workspace Manager</h2></div>
      <span className={'statusDot '+(data?.source==='daemon'?'good':data?.source==='error'?'bad':'quiet')}>{data?.source??'loading'}</span>
    </div>

    {!data?<p className="emptyState">Loading local workspace state…</p>:null}
    {data?.source==='unconfigured'?<div className="banner warn">Desktop bridge is not configured here. Hosted/Vercel mode intentionally cannot reach your PC localhost. Run EVENTO locally/Desktop to enable computer actions.</div>:null}
    {data?.source==='daemon'&&!data.writeExecution?<div className="banner warn">Desktop daemon connected in read-only mode. Set EVENTO_ENABLE_WRITES=true and a separate write token on the local machine to enable bounded actions.</div>:null}
    {data?.error?<div className="banner bad">{data.error}</div>:null}
    {message?<div className="banner">{message}</div>:null}

    <div className="workspaceToolbar">
      <label><span>Worktree suffix</span><input value={suffix} onChange={e=>setSuffix(e.target.value)} placeholder="next" /></label>
      <label><span>Blender file / Unity project path</span><input value={assetPath} onChange={e=>setAssetPath(e.target.value)} placeholder="Assets or scene.blend" /></label>
      <button className="iconButton" onClick={refresh} aria-label="Refresh workspaces">↻</button>
    </div>

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

        <div className="workspaceActions">
          <button disabled={!canWrite||!p.workspace?.is_git||Boolean(busy)} onClick={()=>action(p.project_id,'create_worktree',{suffix})}>＋ Worktree</button>
          <button disabled={!canWrite||!p.configured||Boolean(busy)} onClick={()=>action(p.project_id,'open_folder')}>⌂ Open</button>
          <button disabled={!canWrite||p.project_id!=='aaa-empire'||Boolean(busy)} onClick={()=>action(p.project_id,'run_gate')}>✓ Gate</button>
          <button disabled={!canWrite||!p.configured||Boolean(busy)} onClick={()=>action(p.project_id,'blender_open',{relativePath:assetPath})}>B Blender</button>
          <button disabled={!canWrite||!p.configured||Boolean(busy)} onClick={()=>action(p.project_id,'unity_open',{relativePath:assetPath})}>U Unity</button>
        </div>
      </article>)}
    </div>
  </section>
}
