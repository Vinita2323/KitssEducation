import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, RotateCcw, ShieldOff, Users } from 'lucide-react';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '../components/AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { rupees } from '../components/bookReadiness';
import { duration } from '../components/coachingDisplay';
import { AdminEmpty, AdminPageHeader, AdminTable } from '../components/AdminUI';

const day = value => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';
const stamp = value => value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—';
const daysLeft = value => Math.ceil((new Date(value) - Date.now()) / 86400000);
const stateTone = { active: ['Active', 'bg-emerald-50 text-emerald-800 ring-emerald-200'], expiring: ['Expiring soon', 'bg-amber-50 text-amber-800 ring-amber-200'], expired: ['Expired', 'bg-slate-100 text-slate-700 ring-slate-200'], revoked: ['Revoked', 'bg-rose-50 text-rose-800 ring-rose-200'], blocked: ['Blocked', 'bg-orange-50 text-orange-800 ring-orange-200'] };
const sources = { course: [['paid', 'Paid'], ['free', 'Free'], ['manual', 'Granted by staff']], book: [['purchase', 'Purchased'], ['free', 'Free'], ['manual', 'Granted by staff']] };
const sourceLabel = (kind, value) => (sources[kind].find(([v]) => v === value) ?? [value, value])[1];
const actions = { enrollment_revoked: 'Access revoked', enrollment_restored: 'Access restored', book_access_revoked: 'Access revoked', book_access_restored: 'Access restored', paid_enrollment_created: 'Enrolled after payment', paid_course_repurchased: 'Renewed with a new payment', free_course_enrolled: 'Enrolled on a free plan' };
const stateOf = row => row.state === 'active' && row.expiringSoon ? 'expiring' : row.state;

function Pill({ state }) { const [label, tone] = stateTone[state] ?? [state, stateTone.expired[1]]; return <span className={'inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ' + tone}>{label}</span>; }
function Dialog({ title, onClose, children, wide }) {
  const ref = useDialogFocus(true, onClose);
  return <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 flex items-center justify-center"><div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={'admin-dialog bg-white rounded-2xl p-5 w-full max-h-[92vh] overflow-y-auto space-y-4 text-[#0A1D3F] ' + (wide ? 'max-w-2xl' : 'max-w-md')}>
    <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose}>Close</button></div>{children}
  </div></div>;
}

export function AdminEnrollmentsPage() {
  const { can } = useAuth();
  const [kind, setKind] = useState('course'), [state, setState] = useState('all'), [source, setSource] = useState(''), [q, setQ] = useState(''), [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], summary: null, meta: null }), [error, setError] = useState(''), [busy, setBusy] = useState(false), [version, setVersion] = useState(0);
  const [detail, setDetail] = useState(null), [change, setChange] = useState(null), [reason, setReason] = useState(''), [saving, setSaving] = useState(false), [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController(), params = new URLSearchParams({ kind, page: String(page), ...(state !== 'all' ? { state } : {}), ...(source ? { source } : {}), ...(q.trim() ? { q: q.trim() } : {}) });
    setBusy(true); setError('');
    httpClient.request('/admin/enrollments?' + params, { signal: controller.signal }).then(r => { if (!controller.signal.aborted) setResult(r); }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [kind, state, source, q, page, version]);
  const openDetail = async row => { setError(''); try { setDetail((await httpClient.request('/admin/enrollments/' + row.id + '?kind=' + kind)).data); } catch (e) { setError(e.message); } };
  const submit = async () => {
    setSaving(true); setError('');
    try {
      await authenticatedWrite('/admin/entitlements/' + change.row.id + '/' + change.action, { kind, reason, expectedRevision: change.row.revision });
      setNotice(change.action === 'revoke' ? 'Access revoked. The student can no longer open this ' + kind + '.' : 'Access restored.');
      setChange(null); setDetail(null); setVersion(v => v + 1);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const filter = value => { setState(value); setPage(1); };
  const summary = result.summary, product = kind === 'course' ? 'Course' : 'Book';
  const cards = [['active', 'Active', Users], ['expiring', 'Expiring in 7 days', GraduationCap], ['expired', 'Expired', BookOpen], ['revoked', 'Revoked', ShieldOff], ...(summary?.blocked ? [['blocked', 'Blocked', ShieldOff]] : [])];

  return <div className="space-y-5 text-[#0A1D3F]">
    <AdminPageHeader title="Enrollment Review" description="See who has access to each course and book, follow their progress, and revoke or restore access. Revoking never changes a payment or issues a refund." />
    <div className="admin-segmented" role="group" aria-label="Access type">{[['course', 'Courses'], ['book', 'Books']].map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => { setKind(value); setState('all'); setSource(''); setPage(1); }}>{label}</button>)}</div>
    {kind === 'book' && <h2 className="text-lg font-bold">Book access review</h2>}

    <div className={"grid grid-cols-2 gap-3 " + (cards.length > 4 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>{cards.map(([value, label, Icon]) => <button key={value} type="button" aria-pressed={state === value} onClick={() => filter(state === value ? 'all' : value)} className={'!text-left !p-4 !rounded-2xl bg-white shadow-[0_6px_20px_-14px_#0a1d3f40] ' + (state === value ? '!border-[#0A1D3F] ring-2 ring-[#0A1D3F]/15' : '')}>
      <span className="flex items-center justify-between gap-2 text-sm font-semibold text-[#53647c]">{label}<Icon aria-hidden="true" size={16} /></span>
      <span className="block !text-2xl !font-extrabold mt-1 !text-[#0A1D3F]">{summary?.[value] ?? '–'}</span>
    </button>)}</div>

    <div className="admin-card p-4 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-3">
      <AdminField help="">Search<AdminInput aria-label="Search enrollments" placeholder={`Student name, email, ${kind} or order reference`} value={q} onChange={e => { setQ(e.target.value); setPage(1); }} /></AdminField>
      <AdminField help="">Status<AdminSelect aria-label={kind === 'course' ? 'Enrollment status' : 'Book access status'} value={state} onChange={e => filter(e.target.value)}><option value="all">All statuses</option>{Object.entries(stateTone).map(([value, [label]]) => <option key={value} value={value}>{label}</option>)}</AdminSelect></AdminField>
      <AdminField help="">Source<AdminSelect aria-label="Access source" value={source} onChange={e => { setSource(e.target.value); setPage(1); }}><option value="">All sources</option>{sources[kind].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AdminSelect></AdminField>
    </div>

    {notice && <p role="status" className="rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 p-3 text-sm">{notice}</p>}
    {error && <p role="alert">{error}</p>}{busy && <p role="status" className="text-sm">Loading…</p>}
    <AdminTable>
      <table className="w-full text-sm"><thead><tr><th className="text-left">Student</th><th className="text-left">{product}</th>{kind === 'course' && <th className="text-left">Progress</th>}<th className="text-left">Access</th><th className="text-left">Status</th><th className="text-right">Actions</th></tr></thead>
        <tbody>{result.data.map(row => { const s = stateOf(row); return <tr key={row.id}>
          <td className="min-w-[12rem]"><p className="font-semibold break-words">{row.student?.name ?? 'Deleted account'}</p><p className="text-[#53647c] [overflow-wrap:anywhere]">{row.student?.email ?? row.userId}</p></td>
          <td className="min-w-[12rem]"><p className="font-semibold break-words">{row.title}</p><p className="text-[#53647c]">{[sourceLabel(kind, row.source), row.plan?.name, row.order && rupees(row.order.amountMinor), row.order?.reference, kind === 'book' && row.source === 'purchase' && (row.sourceVerified ? 'Payment verified' : 'Payment not verified')].filter(Boolean).join(' · ')}</p></td>
          {kind === 'course' && <td className="min-w-[9rem]"><div className="h-2 rounded-full bg-[#E6E8EC] overflow-hidden" aria-hidden="true"><div className="h-full bg-emerald-500" style={{ width: (row.progressPercentage ?? 0) + '%' }} /></div><p className="text-[#53647c] mt-1">{row.completedLessons ?? 0} of {row.totalLessons ?? 0} lessons · {row.progressPercentage ?? 0}%</p></td>}
          <td className="whitespace-nowrap"><p>{row.expiresAt ? (s === 'expired' ? 'Ended ' : 'Until ') + day(row.expiresAt) : 'No end date'}</p><p className="text-[#53647c]">{s === 'revoked' ? 'Revoked ' + day(row.revokedAt) : row.expiresAt && ['active', 'expiring', 'blocked'].includes(s) ? daysLeft(row.expiresAt) + ' days left' : 'Since ' + day(row.startsAt)}</p></td>
          <td><Pill state={s} />{s === 'revoked' && row.revokeReason && <p className="text-xs text-[#53647c] mt-1 max-w-[12rem] break-words">{row.revokeReason}</p>}</td>
          <td><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => openDetail(row)}>Details</button>
            {can('access.revoke') && row.state !== 'revoked' && <button type="button" className="text-red-700" onClick={() => { setReason(''); setChange({ action: 'revoke', row }); }}>Revoke access</button>}
            {can('access.revoke') && row.state === 'revoked' && <button type="button" className="inline-flex items-center gap-1" onClick={() => { setReason(''); setChange({ action: 'restore', row }); }}><RotateCcw aria-hidden="true" size={14} />Restore access</button>}</div></td>
        </tr>; })}</tbody></table>
      {!busy && !result.data.length && <AdminEmpty icon={Users}><p>{q || state !== 'all' || source ? 'No enrollments match these filters.' : kind === 'course' ? 'No course enrollments yet.' : 'No book access records yet.'}</p></AdminEmpty>}
    </AdminTable>
    <div className="admin-pager text-sm"><button className="admin-btn admin-btn-secondary admin-btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span className="admin-meta">Page {page} of {result.meta?.totalPages ?? 1} · {result.meta?.total ?? 0} records</span><button className="admin-btn admin-btn-secondary admin-btn-sm" disabled={page >= (result.meta?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</button></div>

    {detail && <Dialog title="Enrollment details" wide onClose={() => setDetail(null)}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-base">{detail.student?.name ?? 'Deleted account'}</p><p className="text-sm text-[#53647c] break-all">{detail.student?.email}</p></div><Pill state={stateOf(detail)} /></div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">{[[product, detail.title], ['Source', sourceLabel(kind, detail.source)], ...(kind === 'course' ? [['Plan', detail.plan ? detail.plan.name + (duration(detail.plan) && duration(detail.plan) !== detail.plan.name ? ' · ' + duration(detail.plan) : '') : '—'], ['Progress', `${detail.completedLessons} of ${detail.totalLessons} lessons (${detail.progressPercentage}%)`], ['Last activity', stamp(detail.lastActivityAt)], ['Renewals', String(detail.renewals ?? 0)]] : []), ['Access started', day(detail.startsAt)], ['Access ends', detail.expiresAt ? day(detail.expiresAt) : 'No end date'], ...(detail.revokedAt ? [['Revoked', stamp(detail.revokedAt) + (detail.revokeReason ? ' — ' + detail.revokeReason : '')]] : [])].map(([label, value]) => <div key={label}><dt className="text-[#53647c]">{label}</dt><dd className="font-semibold break-words">{value}</dd></div>)}</dl>
      <section className="space-y-2"><h3 className="font-bold">Payments</h3>{detail.payments.length ? <ul className="divide-y divide-[#edf1f7] text-sm">{detail.payments.map(p => <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2"><span className="break-all">{p.reference}<span className="text-[#53647c]"> · {stamp(p.paidAt ?? p.createdAt)}</span></span><span className="font-semibold">{rupees(p.amountMinor)} · {p.status === 'captured' ? 'Paid' : p.status}</span></li>)}</ul> : <p className="text-sm text-[#53647c]">No payment — {sourceLabel(kind, detail.source).toLowerCase()} access.</p>}{can('commerce.read') && detail.payments.length > 0 && <Link to="/admin/orders" className="text-sm underline">Open orders</Link>}</section>
      <section className="space-y-2"><h3 className="font-bold">History</h3>{detail.history.length ? <ol className="space-y-1 text-sm">{detail.history.map((h, i) => <li key={i}><span className="font-semibold">{actions[h.action] ?? h.action.replaceAll('_', ' ')}</span><span className="text-[#53647c]"> · {stamp(h.at)}{h.actorId && h.actorId !== 'system' ? ' · by ' + h.actorId : ''}</span>{h.reason && <span className="block text-[#53647c]">Reason: {h.reason}</span>}</li>)}</ol> : <p className="text-sm text-[#53647c]">No recorded changes.</p>}</section>
      {can('access.revoke') && <div className="flex justify-end">{detail.state === 'revoked' ? <button type="button" onClick={() => { setReason(''); setChange({ action: 'restore', row: detail }); }}>Restore access</button> : <button type="button" className="text-red-700" onClick={() => { setReason(''); setChange({ action: 'revoke', row: detail }); }}>Revoke access</button>}</div>}
    </Dialog>}

    {change && <Dialog title={change.action === 'revoke' ? 'Revoke access?' : 'Restore access?'} onClose={() => setChange(null)}>
      <p className="text-sm"><strong>{change.row.student?.name ?? 'This student'}</strong> · {change.row.title}</p>
      <p className="text-sm">{change.action === 'revoke' ? 'They lose access immediately. Payments are not changed and no refund is issued. You can restore access later.' : 'They regain access until the current end date, as long as their account and payment are still valid.'}</p>
      {error && <p role="alert">{error}</p>}
      <AdminField help="Required. Saved in the history.">{change.action === 'revoke' ? 'Reason for revoking' : 'Reason for restoring'}<AdminTextarea aria-label={change.action === 'revoke' ? 'Reason for revoking' : 'Reason for restoring'} rows={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></AdminField>
      <div className="flex justify-end gap-2"><button type="button" onClick={() => setChange(null)}>Cancel</button><button type="button" disabled={saving || !reason.trim()} onClick={submit} className={(change.action === 'revoke' ? 'bg-red-600' : 'bg-[#0A1D3F]') + ' text-white rounded-xl px-4 py-2 font-semibold disabled:opacity-50'}>{change.action === 'revoke' ? 'Revoke access' : 'Restore access'}</button></div>
    </Dialog>}
  </div>;
}
