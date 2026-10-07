'use client'

import { useMemo, useState } from 'react'
import snapshot from '@/data/evento-continuity.v1.json'
import { createContinuityHandoff } from '@/lib/continuity-handoff.mjs'

function download(name: string, value: unknown) {
  const blob = new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], { type: typeof value === 'string' ? 'text/plain;charset=utf-8' : 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = name; anchor.click()
  URL.revokeObjectURL(url)
}

export default function ContinuityPanel() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [projectId, setProjectId] = useState('ev-bot')
  const [adapter, setAdapter] = useState('codex')
  const [handoff, setHandoff] = useState<ReturnType<typeof createContinuityHandoff> | null>(null)
  const [feedback, setFeedback] = useState('')
  const projects = useMemo(() => snapshot.projects.filter((p) => {
    const match = `${p.name} ${p.role} ${p.next_action}`.toLowerCase().includes(query.toLowerCase())
    return match && (group === 'all' || (group === 'candidates' ? p.role === 'SELLABLE_CANDIDATE' : group === 'ideas' ? !p.repository : ['COMPANY_CORE', 'INTERNAL_CONTROL_PLANE', 'SHARED_CAPABILITY', 'SHARED_DATA'].includes(p.role)))
  }), [query, group])
  const prepare = () => {
    setHandoff(createContinuityHandoff(snapshot, projectId, adapter, `CONT-${crypto.randomUUID()}`))
    setFeedback('المهمة جاهزة للتسليم. التنفيذ يبدأ داخل الوكيل المتصل بعد فحص المصدر.')
  }
  async function copy() {
    if (!handoff) return
    try { await navigator.clipboard.writeText(handoff.prompt); setFeedback('نُسخ برومت الاستئناف.') }
    catch { setFeedback('تعذر النسخ التلقائي؛ نزّل البرومت أو حدّد النص لنسخه.') }
  }
  return <section className="panel continuityPanel" id="continuity" dir="rtl" lang="ar">
    <div className="sectionHead"><div><p className="sectionKicker">EVENTO / CONTINUITY</p><h2>مركز الاستئناف</h2></div><span className="continuityBadge">العمل مستمر دون PC</span></div>
    <p className="continuityCaption">نسخة مؤرخة: {new Date(snapshot.observed_at).toLocaleString('ar-AE', { timeZone: 'Asia/Dubai' })}. نتائج CI ودرجات المصدر لا تثبت وحدها جاهزية البيع.</p>
    <div className="statGrid"><article className="statCard"><span>مستودعات مملوكة</span><strong>{snapshot.coverage.owned_repositories}</strong></article><article className="statCard"><span>مشاريع وقدرات وأفكار</span><strong>{snapshot.projects.length}</strong></article><article className="statCard"><span>حزم مصدر محفوظة</span><strong>{snapshot.sources.length}</strong></article><article className="statCard"><span>حزم بيع مثبتة</span><strong>{snapshot.projects.filter(p => p.sellable).length}</strong></article></div>
    <div className="continuityComposer">
      <label>المشروع<select value={projectId} onChange={e => { setProjectId(e.target.value); setHandoff(null) }}>{snapshot.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>وكيل التسليم<select value={adapter} onChange={e => { setAdapter(e.target.value); setHandoff(null) }}><option value="codex">Codex</option><option value="claude-code">Claude Code</option><option value="antigravity">Antigravity</option></select></label>
      <button className="primaryButton" onClick={prepare}>تجهيز المهمة التالية</button>
    </div>
    {handoff ? <div className="continuityHandoff"><div className="continuityActions"><button onClick={copy}>نسخ البرومت</button><button onClick={() => download(`${projectId}-handoff.json`, handoff)}>تنزيل Task + Context</button><button onClick={() => download(`${projectId}-prompt.md`, handoff.prompt)}>تنزيل البرومت</button></div><details><summary>عرض عقد المهمة</summary><pre dir="ltr">{handoff.prompt}</pre></details></div> : null}
    <p role="status" aria-live="polite" className="continuityFeedback">{feedback}</p>
    <div className="continuityFilters"><label>بحث<input value={query} onChange={e => setQuery(e.target.value)} placeholder="اسم المشروع أو الخطوة" type="search" /></label><label>العرض<select value={group} onChange={e => setGroup(e.target.value)}><option value="all">الكل</option><option value="candidates">مرشحو البيع</option><option value="protected">الشركة والقدرات الداخلية</option><option value="ideas">المراجع والأفكار</option></select></label><button onClick={() => download('EVENTO-current-state.json', snapshot)}>تنزيل سجل الحالة</button></div>
    <div className="continuityGrid">{projects.map(project => <article className="continuityCard" key={project.id}>
      <div className="continuityCardHead"><h3 dir="auto">{project.name}</h3><span className={`continuityCi ${project.ci === 'FAIL' ? 'bad' : project.ci === 'PASS' ? 'good' : 'warn'}`}>{project.ci}</span></div>
      <p className="continuityRole" dir="ltr">{project.role}</p>
      <p>{project.next_action}</p>
      <div className="continuityMeta"><span>P0: {project.score === null ? 'لم يُعدّ تدقيقه' : project.p0.length}</span><span>درجة المصدر: {project.score ?? '—'}</span><span>{project.sale_state}</span></div>
      <details><summary>المتبقي والأدلة ({project.open_gates.length})</summary><ul>{project.open_gates.map((gate, i) => <li key={i}>{gate}</li>)}</ul><ul>{project.evidence.map((item, i) => <li key={i}>{'url' in item && item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.kind} · {item.verdict}</a> : <span>{'name' in item ? item.name : item.kind} · {item.verdict}</span>}</li>)}</ul></details>
      <div className="continuityCardFoot"><code>{project.source_ref?.slice(0, 10) || 'Source pack / brief'}</code><button onClick={() => { setProjectId(project.id); setHandoff(null); document.getElementById('continuity')?.scrollIntoView({ behavior: 'smooth' }) }}>اختيار</button></div>
    </article>)}</div>
    {!projects.length ? <p>لا توجد نتائج بهذا البحث.</p> : null}
    <p className="continuityCaption">التجهيز هنا يُنتج عقدًا للتسليم. تشغيل Unity، قبول الأجهزة، التوقيع، وربط runner المستضاف تبقى بوابات مستقلة لها أدلتها.</p>
  </section>
}
