import { AdminField, AdminInput, AdminSelect } from '../components/AdminFields';
import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { Pagination } from '../../user/components/common/Pagination';
import { AdminCard, AdminPageHeader, AdminToolbar } from '../components/AdminUI';
import { AdminStatus } from '../components/AdminUI';

const control = 'border rounded-xl p-2 bg-white text-xs w-full sm:w-auto';
function useRecords(path, filters, version = 0) {
  const [result, setResult] = useState({ data: [], meta: null }), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '')).toString();
  useEffect(() => {
    const c = new AbortController(); setLoading(true); setError(''); setResult({ data: [], meta: null });
    httpClient.request(path + '?' + query, { signal: c.signal }).then(r => { if (!c.signal.aborted) setResult(r); }).catch(e => { if (!c.signal.aborted) setError(e.message); }).finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [path, query, version]);
  return { result, error, loading };
}
function State({ error, loading, count }) {
  return <>{error && <p role="alert" className="text-red-700">{error}</p>}{loading && <p role="status">Loading records...</p>}{!loading && !error && count === 0 && <p>No matching records.</p>}</>;
}
function OperationalStatus({ version }) {
  const [health,setHealth]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();setHealth(null);setError('');
    httpClient.request('/admin/operations/health',{signal:controller.signal}).then(r=>setHealth(r.data)).catch(e=>{if(!controller.signal.aborted)setError(e.message||'Operational diagnostics unavailable');});
    return()=>controller.abort();
  },[version]);
  const rows=health ? [
    ['Database',health.database?.ready?'Ready':'Unavailable'],
    ['Storage',health.storage?.ready?'Ready':'Unavailable'],
    ['Scanner',health.scanner?.status||'Unavailable'],
    ['Video processors',health.processors?.ffmpeg?.ready&&health.processors?.ffprobe?.ready?'Ready':'Unavailable'],
    ['Workers',health.workers?.length?health.workers.map(w=>w.name+': '+(w.stopping?'draining':w.running?'running':'idle')+'; failures '+w.failures).join(' / '):'Telemetry unavailable'],
    ['Pending jobs',String(health.queues?.filter(q=>q.state==='pending').reduce((n,q)=>n+q.count,0)??0)],
    ['Dead jobs',String(health.queues?.filter(q=>q.state==='dead').reduce((n,q)=>n+q.count,0)??0)],
    ['Pending audit records',String(health.pendingAuditRecords??0)],
  ] : [];
  return <AdminCard aria-label="Operational readiness" title="Operational readiness" titleAs="h2">
    {error?<p role="alert">{error}</p>:!health?<p role="status">Checking dependencies...</p>:<dl className="admin-dl">{rows.map(([label,value])=><div key={label} className="min-w-0"><dt className="font-medium">{label}</dt><dd className="break-words text-xs">{['Ready','Unavailable','Telemetry unavailable'].includes(value)?<AdminStatus tone={value==='Ready'?'success':'danger'}>{value}</AdminStatus>:value}</dd></div>)}</dl>}
  </AdminCard>;
}

export function AdminOperationsPage({ audit = false }) {
  const initial = { resource: new URLSearchParams(window.location.search).get('resource') || '' };
  const [page, setPage] = useState(1), [filters, setFilters] = useState(initial), [draft, setDraft] = useState(initial), [version, setVersion] = useState(0);
  const { result, error, loading } = useRecords(audit ? '/admin/audit-logs' : '/admin/jobs', { page, ...filters }, version);
  return <section className="space-y-5 text-[#0A1D3F] text-sm">
    <AdminPageHeader title={audit ? 'Audit logs' : 'Job monitoring'} description={audit ? 'Read-only committed audit events; resource and actor filters use exact references. Do not enter sensitive data in change reasons.' : 'View background task progress here. Use Orders to check payment status. Only tasks with an available retry action can be retried.'} />
    {!audit && <OperationalStatus version={version} />}
    <AdminToolbar><form className="contents" onSubmit={e => { e.preventDefault(); setFilters(draft); setPage(1); }}>{(audit ? ['actor', 'action', 'resource', 'from', 'to'] : ['kind', 'state']).map(key => audit ? <div key={key} className="min-w-[9rem] flex-1"><AdminField className="text-xs">{key}<AdminInput aria-label={'Audit ' + key} type={['from', 'to'].includes(key) ? 'date' : 'text'} maxLength={100} className="block border rounded-xl p-2 w-full" value={draft[key] || ''} onChange={e => setDraft(v => ({ ...v, [key]: e.target.value }))} /></AdminField></div> : <AdminSelect key={key} aria-label={'Job ' + key} className={control} value={draft[key] || ''} onChange={e => setDraft(v => ({ ...v, [key]: e.target.value }))}><option value="">All {key}s</option>{(key === 'kind' ? ['payment_event', 'result_import', 'notification_event', 'notification_push'] : ['pending', 'leased', 'done', 'dead']).map(v => <option key={v}>{v}</option>)}</AdminSelect>)}<div className="admin-actions"><button className="admin-btn admin-btn-primary">Apply filters</button><button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setDraft({}); setFilters({}); setPage(1); setVersion(v => v + 1); }}>Reset / refresh</button></div></form></AdminToolbar>
    <State error={error} loading={loading} count={result.data.length} />
    <div className="admin-list">{result.data.map(row => <article key={row.id} className="admin-list-item space-y-1 break-all text-xs"><div className="min-w-0 flex-1 space-y-1">{audit ? <><strong className="text-sm">{row.action}</strong><p>Actor: {row.actorId || 'System'}; resource: {row.resource || 'Unspecified'}</p><p className="text-[#53647c]">{row.at && new Date(row.at).toLocaleString()}</p>{row.reason && <p>Reason: {row.reason}</p>}{row.permissionChange && <p>Permissions: {(row.permissionChange.before||[]).join(', ') || 'none'} to {(row.permissionChange.after||[]).join(', ') || 'none'}</p>}</> : <><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{row.kind} / {row.state}</strong><AdminStatus value={row.state} /></div><p>Attempts: {row.attempts}; ID: {row.id}</p><p className="text-[#53647c]">Available: {row.availableAt ? new Date(row.availableAt).toLocaleString() : 'Not scheduled'}</p></>}</div></article>)}</div><Pagination meta={result.meta} onChange={setPage} loading={loading} />
  </section>;
}

