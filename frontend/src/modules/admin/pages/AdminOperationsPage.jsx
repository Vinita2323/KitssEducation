import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '../components/AdminFields';
import { PermissionSelector } from '../components/PermissionSelector';
import { useEditorFocus } from '../components/useAdminAccessibility';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';
import { Search } from 'lucide-react';
import { AdminCard, AdminMeta, AdminPageHeader, AdminToolbar } from '../components/AdminUI';
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
export function AdminUsersPage({ staffOnly = false, refreshVersion = 0, onReviewInvitation } = {}) {
  const { user, can } = useAuth();
  const [page, setPage] = useState(1), [q, setQ] = useState(''), [search, setSearch] = useState(''), [status, setStatus] = useState(''), [role, setRole] = useState(staffOnly ? 'admin' : ''), [version, setVersion] = useState(0);
  const { result, error, loading } = useRecords('/admin/users', { page, q, status, role: staffOnly ? 'admin' : role }, `${version}-${refreshVersion}`);
  const [selected, setSelected] = useState(null), [reason, setReason] = useState(''), [grants, setGrants] = useState([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const select = async row => {
    setBusy(true); setMessage(''); setSelected(null);
    try { const r = (await httpClient.request('/admin/users/' + row.id)).data; setSelected(r); setGrants(r.permissions); setReason(''); }
    catch (e) { setMessage(e.message); } finally { setBusy(false); }
  };
  const save = async kind => {
    setBusy(true); setMessage('');
    try {
      const fields = kind === 'status' ? { status: selected.status === 'active' ? 'suspended' : 'active' } : { roles: ['admin'], permissions: grants };
      const r = await authenticatedWrite('/admin/users/' + selected.id + '/' + kind, { ...fields, reason, expectedRevision: selected.revision }, 'PATCH');
      setSelected({ ...selected, ...r }); setReason(''); setVersion(v => v + 1); setMessage('Account updated. Previous sessions are invalidated.');
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  };
  useEffect(() => { if (staffOnly) setSelected(null); }, [staffOnly, refreshVersion]);
  const detailsFocus=useEditorFocus(Boolean(selected));
  const protectedAccount = !selected || selected.id === user.id || selected.roles.includes('super_admin') || !selected.emailVerified || !['active', 'suspended'].includes(selected.status);
  const Heading = staffOnly ? 'h2' : 'h1';
  const intro = staffOnly ? 'Pending staff must accept their invitation and verify their email before signing in. Super-admin changes are unavailable here.' : 'Staff creation uses invitations. Pending identity activation and super-admin changes are unavailable here.';
  return <section className="space-y-4 text-sm text-[#0A1D3F]">
    {staffOnly ? <div><Heading className="text-lg font-bold">Staff accounts</Heading><AdminMeta>{intro}</AdminMeta></div>
      : <AdminPageHeader title="User accounts" description={intro} actions={can('accounts.roles.manage') && <Link to="/admin/staff" className="admin-btn admin-btn-secondary">Manage staff invitations</Link>} />}
    <AdminToolbar>
      <form className="contents" onSubmit={e => { e.preventDefault(); setQ(search); setPage(1); }}><div className="admin-toolbar-grow"><AdminInput aria-label="Search accounts" className={control} maxLength={100} value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email or account ID" /></div><button className="admin-btn admin-btn-primary"><Search aria-hidden="true" size={15} />Search accounts</button><AdminSelect aria-label="Account status filter" className={control} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{['pending', 'active', 'suspended', 'archived'].map(v => <option key={v}>{v}</option>)}</AdminSelect>{!staffOnly && <AdminSelect aria-label="Account role filter" className={control} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">All roles</option>{['student', 'admin', 'super_admin'].map(v => <option key={v}>{v}</option>)}</AdminSelect>}</form>
    </AdminToolbar>
    <State error={error} loading={loading} count={result.data.length} />{message && <p role="status" className="p-3 border rounded-xl bg-white break-words">{message}</p>}
    <div className="admin-list">{result.data.map(row => <button disabled={busy} key={row.id} aria-current={selected?.id === row.id ? 'true' : undefined} className="admin-list-item break-words" onClick={() => select(row)}><span className="flex items-center gap-3 min-w-0"><span aria-hidden="true" className="admin-avatar shrink-0">{(row.name || '?').trim().slice(0, 1).toUpperCase()}</span><span className="min-w-0"><strong className="block">{row.name}</strong><span className="block text-xs break-all text-[#53647c]">{row.id} / {row.email}</span></span></span><span className="text-xs font-semibold">{row.roles.join(', ')} / {row.status}</span></button>)}</div>

    <Pagination meta={result.meta} onChange={setPage} loading={loading || busy} />
    {selected && <AdminCard ref={detailsFocus} aria-label="Account details" className="break-words" bodyClassName="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-lg font-bold">{selected.name}</h2><p className="text-xs break-all text-[#53647c]">{selected.id} / {selected.email}</p></div><a href={'/admin/audit-logs?resource=' + encodeURIComponent(selected.id)} className="admin-btn admin-btn-ghost admin-btn-sm">View account audit history</a></div>
      <dl className="admin-dl"><div><dt>Status</dt><dd><p>{selected.status}; email {selected.emailVerified ? 'verified' : 'unverified'}</p></dd></div><div><dt>Activity</dt><dd><p>Last login: {selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString() : 'Not recorded'}</p></dd></div><div><dt>Records</dt><dd><p className="text-xs">{selected.summary.orders} orders; {selected.summary.enrollments} enrollments; {selected.summary.registrations} registration drafts</p></dd></div><div><dt>Contact</dt><dd><p className="text-xs">Phone: {selected.phone || 'Not provided'}</p></dd></div></dl>
      <AdminField className="block">Change reason<AdminTextarea aria-label="Account change reason" maxLength={500} className="w-full border rounded-xl p-2" value={reason} onChange={e => setReason(e.target.value)} /></AdminField>
      {can('accounts.manage') && <button disabled={busy || protectedAccount || !reason.trim()} className={'admin-btn ' + (selected.status === 'active' ? 'admin-btn-danger' : 'admin-btn-primary')} onClick={() => save('status')}>{selected.status === 'active' ? 'Suspend account' : 'Restore account'}</button>}
      {can('accounts.roles.manage') && selected.roles.includes('admin') && <fieldset disabled={busy || protectedAccount} className="space-y-3"><legend className="font-bold">Ordinary staff permissions</legend><PermissionSelector available={user.permissions} value={grants} onChange={setGrants} disabled={busy || protectedAccount} /><button disabled={busy || protectedAccount || !reason.trim()} className="admin-btn admin-btn-primary" onClick={() => save('roles')}>Save staff permissions</button></fieldset>}
      <div className="admin-actions">{staffOnly && selected.status === 'pending' && onReviewInvitation && <button className="admin-btn admin-btn-secondary" onClick={() => { onReviewInvitation(selected); setSelected(null); }}>Review invitation</button>}
      <button className="admin-btn admin-btn-ghost" onClick={() => setSelected(null)}>Close account details</button></div></AdminCard>}
  </section>;
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

