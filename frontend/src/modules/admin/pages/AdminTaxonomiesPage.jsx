import { AdminField, AdminInput, AdminSelect } from '../components/AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useEffect, useState } from 'react';
import { authenticatedWrite } from '../../user/services/authService';
import { readPage, readOptions } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';

const groups = [
  { title: 'Education', items: [['board', 'Boards', 'Board'], ['class', 'Classes', 'Class', 'board'], ['subject', 'Subjects', 'Subject', 'class'], ['language', 'Languages', 'Language'], ['program', 'Programs', 'Program']] },
  { title: 'Locations', items: [['state', 'States', 'State'], ['district', 'Districts', 'District', 'state']] },
  { title: 'Coaching', items: [['course_category', 'Course categories', 'Course category']] },
  { title: 'Institution & profile', items: [['institution_type', 'Institution types', 'Institution type'], ['qualification', 'Qualifications', 'Qualification'], ['designation', 'Designations', 'Designation'], ['experience', 'Experience', 'Experience level']] },
];
const types = Object.fromEntries(groups.flatMap(group => group.items.map(([kind, plural, singular, parent]) => [kind, { plural, singular, parent }])));
const input = 'w-full p-2.5 border border-[#E6E8EC] rounded-xl bg-[#F7F8FA] text-sm';

export function AdminTaxonomiesPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]), [meta, setMeta] = useState(null), [page, setPage] = useState(1);
  const [kind, setKind] = useState('board'), [q, setQ] = useState(''), [status, setStatus] = useState('');
  const [form, setForm] = useState(null), [editing, setEditing] = useState(null), [parents, setParents] = useState([]);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [saving, setSaving] = useState(false), [version, setVersion] = useState(0);
  const [parentLoading, setParentLoading] = useState(false), [parentError, setParentError] = useState('');
  const type = types[kind], parentKind = form && types[form.kind].parent;
  useEffect(() => {
    const controller = new AbortController(); setBusy(true); setError(''); setRows([]); setMeta(null);
    readPage('/admin/taxonomies', { kind, q, status, page }, controller.signal).then(result => { setRows(result.data); setMeta(result.meta); }).catch(failure => { if (!controller.signal.aborted) setError(failure.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [kind, q, status, page, version]);
  useEffect(() => {
    const controller = new AbortController(); setParents([]); setParentError(''); setParentLoading(Boolean(parentKind));
    if (parentKind) readOptions('/admin/taxonomies', { kind: parentKind, ...(editing ? {} : { status: 'active' }) }, controller.signal)
      .then(result => { if (!controller.signal.aborted) setParents(result); })
      .catch(failure => { if (!controller.signal.aborted) setParentError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setParentLoading(false); });
    return () => controller.abort();
  }, [parentKind, editing]);
  const close = () => { if (!saving) { setForm(null); setEditing(null); setError(''); } };
  const open = row => { setError(''); setEditing(row || null); setForm(row || { kind, label: '', parentIds: [], sortOrder: 0, status: 'active' }); };
  const selectType = value => { setKind(value); setPage(1); setQ(''); setStatus(''); };
  const mutate = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = editing ? { label: form.label, status: form.status, sortOrder: Number(form.sortOrder), expectedRevision: editing.revision } : { ...form, sortOrder: Number(form.sortOrder) };
      await authenticatedWrite('/admin/taxonomies' + (editing ? '/' + editing.id : ''), payload, editing ? 'PATCH' : 'POST');
      setForm(null); setEditing(null); setVersion(v => v + 1);
    } catch (failure) { setError(failure.message); } finally { setSaving(false); }
  };
  const archive = async row => {
    if (!window.confirm(`Archive "${row.label}"? Existing references will be kept.`)) return;
    setSaving(true); setError('');
    try { await authenticatedWrite('/admin/taxonomies/' + row.id, { expectedRevision: row.revision }, 'DELETE'); setVersion(v => v + 1); }
    catch (failure) { setError(failure.message); } finally { setSaving(false); }
  };
  const editorDialog = useDialogFocus(Boolean(form), close);
  return <div className="space-y-4 text-[#0A1D3F]">
    <header className="bg-white border rounded-2xl p-5"><h1 className="text-xl font-bold">Dropdown settings</h1><p className="text-sm text-[#667085]">Manage the choices used in books, applications and other forms.</p></header>
    <nav aria-label="Dropdown groups" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {groups.map(group => <section key={group.title} className="rounded-2xl border bg-white p-4"><h2 className="text-sm font-bold mb-3">{group.title}</h2><div className="flex flex-wrap gap-2">{group.items.map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => selectType(value)} className={`rounded-lg border px-3 py-2 text-sm ${kind === value ? 'bg-[#0A1D3F] text-white' : 'bg-white'}`}>{label}</button>)}</div></section>)}
    </nav>
    <section aria-labelledby="dropdown-list-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="dropdown-list-title" className="text-lg font-bold">{type.plural}</h2>{can('content.write') && <button disabled={saving} className="bg-[#0A1D3F] text-white rounded-xl px-4 py-2" onClick={() => open()}>Add {type.singular.toLowerCase()}</button>}</div>
      <div className="bg-white p-4 border rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3"><AdminInput aria-label={`Search ${type.plural.toLowerCase()}`} placeholder={`Search ${type.plural.toLowerCase()}`} value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className={input} /><AdminSelect aria-label="Filter status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={input}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></AdminSelect></div>
      {error && !form && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">{error}</p>}{busy && <p role="status">Loading choices...</p>}
      <div className="bg-white rounded-2xl border overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['Name', 'Display order', 'Status', 'Actions'].map(h => <th key={h} scope="col" className="text-left p-3">{h}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="p-3">{row.label}</td><td className="p-3">{row.sortOrder}</td><td className="p-3">{row.status === 'active' ? 'Active' : 'Inactive'}</td><td className="p-3">{can('content.write') && <div className="flex gap-3"><button disabled={saving} aria-label={`Edit ${row.label}`} onClick={() => open(row)}>Edit</button><button disabled={saving} aria-label={`Archive ${row.label}`} onClick={() => archive(row)}>Archive</button></div>}</td></tr>)}</tbody></table>{!busy && !rows.length && !error && <p className="p-6 text-center text-[#667085]">No {type.plural.toLowerCase()} found.</p>}</div>
      <Pagination meta={meta} onChange={setPage} loading={busy} />
    </section>
    {form && <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 flex items-center justify-center"><form ref={editorDialog} role="dialog" aria-modal="true" aria-label={`${editing ? 'Edit' : 'Add'} ${types[form.kind].singular.toLowerCase()}`} tabIndex={-1} onSubmit={mutate} className="bg-white p-5 rounded-2xl space-y-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <h2 className="font-bold">{editing ? 'Edit' : 'Add'} {types[form.kind].singular.toLowerCase()}</h2>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {parentKind && <AdminField className="block text-sm" help={editing ? 'This relationship stays fixed to protect existing records.' : ''}>{types[parentKind].singular}<AdminSelect aria-label={types[parentKind].singular} className={input} disabled={Boolean(editing) || parentLoading || Boolean(parentError)} required={!editing} value={form.parentIds[0] ?? ''} onChange={e => setForm({ ...form, parentIds: e.target.value ? [e.target.value] : [] })}><option value="">{editing ? 'Not specified' : `Select ${types[parentKind].singular.toLowerCase()}`}</option>{parents.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}{editing && form.parentIds.filter(id => !parents.some(p => p.id === id)).map(id => <option key={id} value={id}>Existing linked {types[parentKind].singular.toLowerCase()}</option>)}</AdminSelect></AdminField>}
      {parentKind && parentLoading && <p role="status">Loading {types[parentKind].plural.toLowerCase()}...</p>}
      {parentError && <p role="alert">{parentError} Close and reopen this form to retry.</p>}
      {parentKind && !editing && !parentLoading && !parentError && !parents.length && <p role="status">Add an active {types[parentKind].singular.toLowerCase()} first in {types[parentKind].plural}.</p>}
      <AdminField className="block text-sm">{types[form.kind].singular} name<AdminInput className={input} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required maxLength={160} /></AdminField>
      <AdminField className="block text-sm">Display order<AdminInput type="number" min="0" max="100000" step="1" required className={input} value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} /></AdminField>
      <AdminField className="block text-sm">Status<AdminSelect className={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></AdminSelect></AdminField>
      <div className="flex gap-3"><button disabled={saving || (!editing && parentKind && (parentLoading || Boolean(parentError) || !parents.length))} className="bg-[#0A1D3F] text-white p-2 rounded-lg">{saving ? 'Saving...' : `Save ${types[form.kind].singular.toLowerCase()}`}</button><button type="button" disabled={saving} onClick={close}>Cancel</button></div>
    </form></div>}
  </div>;
}
