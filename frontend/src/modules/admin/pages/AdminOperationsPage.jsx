import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';

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
export function AdminUsersPage() {
  const { user, can } = useAuth();
  const [page, setPage] = useState(1), [q, setQ] = useState(''), [search, setSearch] = useState(''), [status, setStatus] = useState(''), [role, setRole] = useState(''), [version, setVersion] = useState(0);
  const { result, error, loading } = useRecords('/admin/users', { page, q, status, role }, version);
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
  const protectedAccount = !selected || selected.id === user.id || selected.roles.includes('super_admin') || !selected.emailVerified || !['active', 'suspended'].includes(selected.status);
  return <section className="space-y-4 text-sm text-[#0A1D3F]"><h1 className="text-xl font-bold">User accounts</h1><p className="text-xs">Staff creation uses invitations. Pending identity activation and super-admin changes are unavailable here.</p>
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setQ(search); setPage(1); }}><input aria-label="Search accounts" className={control} maxLength={100} value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email or account ID" /><button className={control}>Search accounts</button><select aria-label="Account status filter" className={control} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{['pending', 'active', 'suspended', 'archived'].map(v => <option key={v}>{v}</option>)}</select><select aria-label="Account role filter" className={control} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">All roles</option>{['student', 'admin', 'super_admin'].map(v => <option key={v}>{v}</option>)}</select></form>
    <State error={error} loading={loading} count={result.data.length} />{message && <p role="status" className="p-3 border rounded-xl break-words">{message}</p>}
    <div className="space-y-2">{result.data.map(row => <button disabled={busy} key={row.id} className="w-full text-left bg-white border rounded-xl p-3 break-words" onClick={() => select(row)}><strong>{row.name}</strong><p className="text-xs break-all">{row.id} / {row.email}</p><p className="text-xs">{row.roles.join(', ')} / {row.status}</p></button>)}</div><Pagination meta={result.meta} onChange={setPage} loading={loading || busy} />
    {selected && <section aria-label="Account details" className="bg-white rounded-xl border p-4 space-y-3 break-words"><h2 className="font-bold">{selected.name}</h2><p className="text-xs break-all">{selected.id} / {selected.email}</p><p>{selected.status}; email {selected.emailVerified ? 'verified' : 'unverified'}</p><p className="text-xs">{selected.summary.orders} orders; {selected.summary.enrollments} enrollments; {selected.summary.registrations} registration drafts</p><p className="text-xs">Phone: {selected.phone || 'Not provided'}</p><label className="block">Change reason<textarea aria-label="Account change reason" maxLength={500} className="w-full border rounded-xl p-2" value={reason} onChange={e => setReason(e.target.value)} /></label>
      {can('accounts.manage') && <button disabled={busy || protectedAccount || !reason.trim()} className={control} onClick={() => save('status')}>{selected.status === 'active' ? 'Suspend account' : 'Restore account'}</button>}
      {can('accounts.roles.manage') && selected.roles.includes('admin') && <fieldset disabled={busy || protectedAccount} className="space-y-3"><legend className="font-bold">Ordinary staff permissions</legend><div className="grid sm:grid-cols-2 gap-2">{user.permissions.filter(p => p !== 'accounts.roles.manage').map(p => <label key={p} className="flex gap-2 text-xs break-all"><input type="checkbox" checked={grants.includes(p)} onChange={e => setGrants(old => e.target.checked ? [...old, p] : old.filter(v => v !== p))} />{p}</label>)}</div><button disabled={busy || protectedAccount || !reason.trim()} className={control} onClick={() => save('roles')}>Save staff permissions</button></fieldset>}
      <button className={control} onClick={() => setSelected(null)}>Close account details</button></section>}
  </section>;
}

export function AdminOperationsPage({ audit = false }) {
  const [page, setPage] = useState(1), [filters, setFilters] = useState({}), [draft, setDraft] = useState({}), [version, setVersion] = useState(0);
  const { result, error, loading } = useRecords(audit ? '/admin/audit-logs' : '/admin/jobs', { page, ...filters }, version);
  return <section className="space-y-4 text-[#0A1D3F] text-sm"><h1 className="text-xl font-bold">{audit ? 'Audit logs' : 'Job monitoring'}</h1><p className="text-xs">{audit ? 'Read-only committed audit events; resource and actor filters use exact references. Do not enter sensitive data in change reasons.' : 'Read-only processing state. Payment reconciliation remains in Orders; no arbitrary retry or payload access is available.'}</p>
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setFilters(draft); setPage(1); }}>{(audit ? ['actor', 'action', 'resource', 'from', 'to'] : ['kind', 'state']).map(key => audit ? <label key={key} className="text-xs">{key}<input aria-label={'Audit ' + key} type={['from', 'to'].includes(key) ? 'date' : 'text'} maxLength={100} className="block border rounded-xl p-2 w-full" value={draft[key] || ''} onChange={e => setDraft(v => ({ ...v, [key]: e.target.value }))} /></label> : <select key={key} aria-label={'Job ' + key} className={control} value={draft[key] || ''} onChange={e => setDraft(v => ({ ...v, [key]: e.target.value }))}><option value="">All {key}s</option>{(key === 'kind' ? ['payment_event', 'result_import'] : ['pending', 'leased', 'done', 'dead']).map(v => <option key={v}>{v}</option>)}</select>)}<button className={control}>Apply filters</button><button type="button" className={control} onClick={() => { setDraft({}); setFilters({}); setPage(1); setVersion(v => v + 1); }}>Reset / refresh</button></form>
    <State error={error} loading={loading} count={result.data.length} />
    <div className="space-y-2">{result.data.map(row => <article key={row.id} className="p-3 bg-white border rounded-xl space-y-1 break-all text-xs">{audit ? <><strong>{row.action}</strong><p>Actor: {row.actorId || 'System'}; resource: {row.resource || 'Unspecified'}</p><p>{row.at && new Date(row.at).toLocaleString()}</p>{row.reason && <p>Reason: {row.reason}</p>}</> : <><strong>{row.kind} / {row.state}</strong><p>Attempts: {row.attempts}; ID: {row.id}</p><p>Available: {row.availableAt ? new Date(row.availableAt).toLocaleString() : 'Not scheduled'}</p></>}</article>)}</div><Pagination meta={result.meta} onChange={setPage} loading={loading} />
  </section>;
}

export function AdminBookEntitlements() {
  const [page, setPage] = useState(1), [state, setState] = useState('all');
  const { result, error, loading } = useRecords('/admin/enrollments', { kind: 'book', state, page });
  return <section className="space-y-3 mt-6 text-[#0A1D3F]"><h2 className="text-xl font-bold">Book entitlement review</h2><p className="text-xs">Read-only purchase rights and source-order verification. Book revocation and manual grants remain blocked pending policy; this screen cannot change payment or access.</p><select aria-label="Book entitlement status" className={control} value={state} onChange={e => { setState(e.target.value); setPage(1); }}>{['all', 'active', 'revoked'].map(s => <option key={s}>{s}</option>)}</select><State error={error} loading={loading} count={result.data.length} />{result.data.map(row => <article key={row.id} className="p-3 border rounded-xl bg-white text-xs break-all space-y-1"><strong>{row.title}</strong><p>User: {row.userId}; order: {row.orderId}</p><p>{row.state}; captured source {row.sourceVerified ? 'verified' : 'unverified'}{row.simulated ? '; SIMULATED TEST' : ''}</p></article>)}<Pagination meta={result.meta} onChange={setPage} loading={loading} /></section>;
}
