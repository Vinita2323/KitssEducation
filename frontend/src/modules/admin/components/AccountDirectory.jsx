import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Search } from 'lucide-react';
import { AdminField, AdminInput, AdminTextarea } from './AdminFields';
import { AdminStatus, AdminTable } from './AdminUI';
import { PermissionSelector } from './PermissionSelector';
import { accessSummary } from './staffRoles';
import { httpClient } from '../../../shared/api/httpClient';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';

const day = value => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';
const stamp = value => value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'Never';
export const accountRole = row => row.roles.includes('super_admin') ? 'Owner' : row.roles.includes('admin') ? accessSummary(row.permissions) : 'Student';
const statusText = { active: 'Active', suspended: 'Suspended', pending: 'Pending', archived: 'Archived' };
const Status = ({ value }) => <AdminStatus value={value}>{statusText[value] ?? value}</AdminStatus>;
const statuses = [['', 'All'], ['active', 'Active'], ['suspended', 'Suspended'], ['pending', 'Pending']];

function Details({ account, editRoles, onClose, onChanged, onReviewInvitation }) {
  const { user, can } = useAuth();
  const ref = useDialogFocus(true, onClose);
  const [action, setAction] = useState(null), [reason, setReason] = useState(''), [grants, setGrants] = useState(account.permissions ?? []);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const isStaff = account.roles.includes('admin'), isOwner = account.roles.includes('super_admin');
  // The server refuses these too; the reason is shown so nobody wonders why a button is missing.
  const locked = account.id === user.id ? 'This is your own account.' : isOwner ? 'The owner account cannot be changed here.' : !account.emailVerified || !['active', 'suspended'].includes(account.status) ? 'This account has not finished signing up yet.' : '';
  const save = async kind => {
    setBusy(true); setError(''); setMessage('');
    try {
      const fields = kind === 'status' ? { status: account.status === 'active' ? 'suspended' : 'active' } : { roles: ['admin'], permissions: grants };
      const updated = await authenticatedWrite('/admin/users/' + account.id + '/' + kind, { ...fields, reason, expectedRevision: account.revision }, 'PATCH');
      onChanged({ ...account, ...updated }); setAction(null); setReason('');
      setMessage(kind === 'status' ? (fields.status === 'suspended' ? 'Account suspended. The person has been signed out.' : 'Account restored. The person can sign in again.') : 'Role saved. The person must sign in again for it to apply.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const counts = [['Orders', account.summary?.orders], ['Enrollments', account.summary?.enrollments, can('learning.read') && '/admin/enrollments?q=' + encodeURIComponent(account.email)], ['Registrations', account.summary?.registrations]];
  const suspend = account.status === 'active';
  return <div className="fixed inset-0 z-50 bg-[#0A1D3F]/50 flex justify-end" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Account details" tabIndex={-1} className="bg-white w-full max-w-lg h-full overflow-y-auto p-5 space-y-5 text-[#0A1D3F] shadow-2xl">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-lg font-bold break-words">{account.name}</h2><p className="text-sm text-[#53647c] break-all">{account.email}</p></div><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onClose}>Close account details</button></div>
      <div className="flex flex-wrap gap-2"><Status value={account.status} /><span className="admin-status admin-status-neutral">{accountRole(account)}</span></div>
      <dl className="grid grid-cols-2 gap-3 text-sm">{[['Email', account.emailVerified ? 'Verified' : 'Not verified'], ['Phone', account.phone || 'Not provided'], ['Joined', day(account.createdAt)], ['Last sign-in', stamp(account.lastLoginAt)]].map(([k, v]) => <div key={k}><dt className="text-[#53647c]">{k}</dt><dd className="font-semibold break-words">{v}</dd></div>)}
        <div className="col-span-2"><dt className="text-[#53647c]">Account ID</dt><dd className="flex items-center gap-2"><code className="text-xs break-all">{account.id}</code><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" aria-label="Copy account ID" onClick={() => navigator.clipboard?.writeText(account.id).then(() => setMessage('Account ID copied.'), () => {})}><Copy aria-hidden="true" size={14} /></button></dd></div></dl>
      {!isStaff && !isOwner && <section className="space-y-2"><h3 className="font-bold text-sm">Activity</h3><div className="grid grid-cols-3 gap-2">{counts.map(([label, count, href]) => <div key={label} className="rounded-xl border border-[#e1e7f0] p-3"><div className="text-xl font-extrabold">{count ?? 0}</div>{href ? <Link to={href} className="text-xs underline">{label}</Link> : <div className="text-xs text-[#53647c]">{label}</div>}</div>)}</div></section>}
      {can('audit.read') && <Link to={'/admin/audit-logs?resource=' + encodeURIComponent(account.id)} className="text-sm underline">View change history</Link>}
      {message && <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm">{message}</p>}
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      {locked && <p className="text-sm text-[#53647c]">{locked}</p>}

      {isStaff && !editRoles && can('accounts.roles.manage') && <p className="text-sm">To change this person's role, use <Link to="/admin/staff" className="underline">Staff management</Link>.</p>}
      {isStaff && editRoles && can('accounts.roles.manage') && !locked && <fieldset disabled={busy} className="space-y-3 border-t border-[#e1e7f0] pt-4"><legend className="font-bold">Role and access</legend>
        {action === 'roles' ? <>
          <PermissionSelector available={user.permissions} value={grants} onChange={setGrants} disabled={busy} />
          <AdminField help="Saved in the change history. Saving signs this person out so the new role applies at once." className="block">Reason for this change<AdminTextarea aria-label="Reason for this change" maxLength={500} rows={2} value={reason} onChange={e => setReason(e.target.value)} /></AdminField>
          <div className="flex gap-2"><button type="button" className="admin-btn admin-btn-primary" disabled={!reason.trim() || !grants.length} onClick={() => save('roles')}>Save role and access</button><button type="button" className="admin-btn admin-btn-ghost" onClick={() => { setAction(null); setReason(''); setGrants(account.permissions ?? []); }}>Cancel</button></div>
        </> : <div className="flex flex-wrap items-center gap-3"><span className="text-sm">Current role: <strong>{accountRole(account)}</strong></span><button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { setAction('roles'); setReason(''); setGrants(account.permissions ?? []); }}>Change role</button></div>}
      </fieldset>}

      {can('accounts.manage') && !locked && <div className="space-y-3 border-t border-[#e1e7f0] pt-4">
        {action === 'status' ? <>
          <AdminField help="Saved in the change history." className="block">{suspend ? 'Reason for suspending' : 'Reason for restoring'}<AdminTextarea aria-label={suspend ? 'Reason for suspending' : 'Reason for restoring'} maxLength={500} rows={2} value={reason} onChange={e => setReason(e.target.value)} /></AdminField>
          <p className="text-xs text-[#53647c]">{suspend ? 'They are signed out at once and cannot sign in until restored. Orders and access records are kept.' : 'They can sign in again with their existing password.'}</p>
          <div className="flex gap-2"><button type="button" disabled={busy || !reason.trim()} className={'admin-btn ' + (suspend ? 'admin-btn-danger' : 'admin-btn-primary')} onClick={() => save('status')}>{suspend ? 'Confirm suspension' : 'Confirm restore'}</button><button type="button" className="admin-btn admin-btn-ghost" onClick={() => { setAction(null); setReason(''); }}>Cancel</button></div>
        </> : <button type="button" className={'admin-btn ' + (suspend ? 'admin-btn-danger' : 'admin-btn-primary')} onClick={() => { setAction('status'); setReason(''); }}>{suspend ? 'Suspend account' : 'Restore account'}</button>}
      </div>}
      {account.status === 'pending' && isStaff && onReviewInvitation && <button type="button" className="admin-btn admin-btn-secondary" onClick={() => onReviewInvitation(account)}>Review invitation</button>}
    </div>
  </div>;
}

// Searchable account list with status counts and a details panel. Used for students, staff and the Staff management page.
export function AccountDirectory({ role, refreshVersion = 0, editRoles = false, onReviewInvitation, emptyText }) {
  const [search, setSearch] = useState(''), [q, setQ] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1), [version, setVersion] = useState(0);
  const [result, setResult] = useState({ data: [], meta: null, summary: null }), [loading, setLoading] = useState(true), [error, setError] = useState(''), [selected, setSelected] = useState(null);
  useEffect(() => { const timer = setTimeout(() => { setQ(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const c = new AbortController(), params = new URLSearchParams({ page: String(page), role, ...(q ? { q } : {}), ...(status ? { status } : {}) });
    setLoading(true); setError('');
    httpClient.request('/admin/users?' + params, { signal: c.signal }).then(r => { if (!c.signal.aborted) setResult(r); }).catch(e => { if (!c.signal.aborted) setError(e.message); }).finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [role, q, status, page, version, refreshVersion]);
  useEffect(() => { setSelected(null); }, [refreshVersion]);
  const open = async row => { setError(''); try { setSelected((await httpClient.request('/admin/users/' + row.id)).data); } catch (e) { setError(e.message); } };
  const staff = role !== 'student', summary = result.summary;
  return <div className="space-y-4 text-sm text-[#0A1D3F]">
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-56"><Search aria-hidden="true" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#53647c]" /><input aria-label="Search accounts" type="search" maxLength={100} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or account ID" className="w-full rounded-xl border border-[#cbd6e5] bg-white py-2 pl-9 pr-3" /></div>
      <div className="admin-segmented" role="group" aria-label="Account status">{statuses.filter(([value]) => value !== 'pending' || staff || summary?.pending).map(([value, label]) => <button key={value || 'all'} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{label} {summary ? <span>({value ? summary[value] : summary.total})</span> : null}</button>)}</div>
    </div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <AdminTable><table className="w-full"><thead><tr><th>Name</th><th>Status</th>{staff && <th>Role</th>}<th>Joined</th><th>Last sign-in</th></tr></thead>
      <tbody>{result.data.map(row => <tr key={row.id}>
        <td data-label="Name"><button type="button" className="!border-0 !bg-transparent !p-0 !shadow-none text-left min-w-0 hover:underline" onClick={() => open(row)}><span className="block font-semibold break-words">{row.name}</span><span className="block text-xs text-[#53647c] break-all">{row.email}</span></button></td>
        <td data-label="Status"><Status value={row.status} /></td>
        {staff && <td data-label="Role">{accountRole(row)}</td>}
        <td data-label="Joined" className="whitespace-nowrap">{day(row.createdAt)}</td>
        <td data-label="Last sign-in" className="whitespace-nowrap">{row.lastLoginAt ? day(row.lastLoginAt) : 'Never'}</td>
      </tr>)}</tbody></table>
      {!loading && !result.data.length && <p className="p-6 text-center text-[#53647c]">{q || status ? 'No accounts match.' : emptyText ?? 'No accounts yet.'}</p>}
      {loading && <p role="status" className="p-4 text-center text-[#53647c]">Loading accounts…</p>}
    </AdminTable>
    <Pagination meta={result.meta} onChange={setPage} loading={loading} />
    {selected && <Details key={selected.id} account={selected} editRoles={editRoles} onClose={() => setSelected(null)} onReviewInvitation={onReviewInvitation && (row => { onReviewInvitation(row); setSelected(null); })}
      onChanged={account => { setSelected(account); setVersion(v => v + 1); }} />}
  </div>;
}
