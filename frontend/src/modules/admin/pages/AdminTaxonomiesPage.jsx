import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { readPage } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';

const kinds = ['board', 'class', 'subject', 'program', 'language', 'state', 'district', 'qualification', 'designation', 'experience', 'institution_type'];
const initial = { kind: 'state', key: '', label: '', parentIds: [], sortOrder: 0, status: 'active' };
export function AdminTaxonomiesPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]), [meta, setMeta] = useState(null), [page, setPage] = useState(1);
  const [kind, setKind] = useState(''), [q, setQ] = useState(''), [status, setStatus] = useState('');
  const [form, setForm] = useState(null), [editing, setEditing] = useState(null), [parents, setParents] = useState([]);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setBusy(true); setError('');
    readPage('/admin/taxonomies', { kind, q, status, page }, controller.signal).then(result => { setRows(result.data); setMeta(result.meta); }).catch(failure => { if (failure.code !== 'ABORTED') { setRows([]); setError(failure.message); } }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [kind, q, status, page, version]);
  useEffect(() => {
    if (!form) return;
    const parentKind = { district: 'state', class: 'board', subject: 'class' }[form.kind];
    if (!parentKind) { setParents([]); return; }
    readPage('/admin/taxonomies', { kind: parentKind, status: 'active', pageSize: 100 }).then(result => setParents(result.data)).catch(failure => setError(failure.message));
  }, [form?.kind]);
  const mutate = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = editing ? { label: form.label, status: form.status, sortOrder: Number(form.sortOrder), expectedRevision: editing.revision } : { ...form, sortOrder: Number(form.sortOrder) };
      await authenticatedWrite('/admin/taxonomies' + (editing ? '/' + editing.id : ''), payload, editing ? 'PATCH' : 'POST');
      setForm(null); setVersion(v => v + 1);
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  const archive = async row => {
    if (!window.confirm('Archive this taxonomy value? Historical references will be kept.')) return;
    try { await authenticatedWrite('/admin/taxonomies/' + row.id, { expectedRevision: row.revision }, 'DELETE'); setVersion(v => v + 1); }
    catch (failure) { setError(failure.message); }
  };
  const input = 'w-full p-2.5 border border-[#E6E8EC] rounded-xl bg-[#F7F8FA] text-sm';
  return <div className="space-y-4 text-[#0A1D3F]">
    <header className="bg-white border rounded-2xl p-5 flex flex-wrap justify-between gap-3"><div><h1 className="text-xl font-bold">Taxonomy Management</h1><p className="text-xs text-[#667085]">Approved educational and location choices. No records are seeded automatically.</p></div>{can('content.write') && <button className="bg-[#0A1D3F] text-white rounded-xl px-4 py-2" onClick={() => { setEditing(null); setForm(initial); }}>Add Taxonomy</button>}</header>
    <div className="bg-white p-4 border rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3"><input aria-label="Search taxonomy" placeholder="Search taxonomy" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className={input} /><select aria-label="Filter taxonomy kind" value={kind} onChange={e => { setKind(e.target.value); setPage(1); }} className={input}><option value="">All kinds</option>{kinds.map(k => <option key={k}>{k}</option>)}</select><select aria-label="Filter taxonomy status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={input}><option value="">All statuses</option><option>active</option><option>inactive</option></select></div>
    {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">{error}</p>}{busy && <p role="status">Loading…</p>}
    <div className="bg-white rounded-2xl border overflow-x-auto"><table className="w-full text-xs"><thead><tr>{['Kind', 'Key', 'Label', 'Status', 'Actions'].map(h => <th key={h} className="text-left p-3">{h}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="p-3">{row.kind}</td><td>{row.key}</td><td>{row.label}</td><td>{row.status}</td><td>{can('content.write') && <div className="flex gap-2"><button onClick={() => { setEditing(row); setForm(row); }}>Edit</button><button onClick={() => archive(row)}>Archive</button></div>}</td></tr>)}</tbody></table>{!busy && !rows.length && <p className="p-6 text-center text-[#667085]">No taxonomy values found.</p>}</div>
    <Pagination meta={meta} onChange={setPage} loading={busy} />
    {form && <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 flex items-center justify-center"><form onSubmit={mutate} className="bg-white p-5 rounded-2xl space-y-3 w-full max-w-md max-h-[90vh] overflow-y-auto"><h2 className="font-bold">{editing ? 'Edit' : 'Add'} taxonomy</h2><label className="block text-xs">Kind<select className={input} disabled={Boolean(editing)} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value, parentIds: [] })}>{kinds.map(k => <option key={k}>{k}</option>)}</select></label><label className="block text-xs">Canonical key<input className={input} value={form.key} disabled={Boolean(editing)} onChange={e => setForm({ ...form, key: e.target.value })} required /></label><label className="block text-xs">Label<input className={input} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required /></label>{parents.length > 0 && <label className="block text-xs">Parent<select className={input} disabled={Boolean(editing)} value={form.parentIds[0] ?? ''} onChange={e => setForm({ ...form, parentIds: e.target.value ? [e.target.value] : [] })}><option value="">Select parent</option>{parents.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>}<label className="block text-xs">Display order<input type="number" min="0" className={input} value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} /></label><label className="block text-xs">Status<select className={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>active</option><option>inactive</option></select></label><div className="flex gap-3"><button disabled={busy} className="bg-[#0A1D3F] text-white p-2 rounded-lg">Save taxonomy</button><button type="button" onClick={() => setForm(null)}>Cancel</button></div></form></div>}
  </div>;
}
