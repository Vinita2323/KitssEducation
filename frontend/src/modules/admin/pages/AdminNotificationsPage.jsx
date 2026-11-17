import { AdminField, AdminInput, AdminSelect } from '../components/AdminFields';
import { useEditorFocus } from '../components/useAdminAccessibility';
import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';
import { Bell, Plus, X } from 'lucide-react';
import { AdminEmpty, AdminPageHeader, AdminStatus, AdminTable } from '../components/AdminUI';
import { useDebouncedValue } from '../../../shared/ui/useDebouncedValue';
// Account IDs (as shown in User accounts) or database ids pasted into the search box are also accepted.
const looksLikeId = value => /^[a-f0-9]{24}$/i.test(value) || /^[A-Z]{3,10}[0-9A-F]{16}$/i.test(value);
const pastedIds = text => (text || '').split(/[\s,]+/).map(v => v.trim()).filter(looksLikeId);
function RecipientPicker({ recipients, query, onChange }) {
  const [results, setResults] = useState([]), [error, setError] = useState(''), [searching, setSearching] = useState(false);
  const term = useDebouncedValue(query.trim());
  useEffect(() => {
    setError('');
    if (term.length < 2 || looksLikeId(term)) { setResults([]); return undefined; }
    const c = new AbortController(); setSearching(true);
    httpClient.request('/admin/notification-recipients?q=' + encodeURIComponent(term), { signal: c.signal })
      .then(r => { if (!c.signal.aborted) setResults(r.data || []); })
      .catch(e => { if (!c.signal.aborted) { setResults([]); setError(e.message); } })
      .finally(() => { if (!c.signal.aborted) setSearching(false); });
    return () => c.abort();
  }, [term]);
  const chosen = new Set(recipients.map(r => r.id.toUpperCase()));
  const add = person => onChange({ recipients: [...recipients, person], query: '' });
  const remove = person => onChange({ recipients: recipients.filter(r => r !== person), query });
  return <div className="space-y-2 text-sm">
    <AdminField className="block text-sm">Recipients
      <AdminInput aria-label="Notification recipients" value={query} placeholder="Search by name, email or account ID" onChange={e => onChange({ recipients, query: e.target.value })} className="block w-full border p-2 rounded-xl" />
    </AdminField>
    {searching && <p role="status" className="text-xs">Searching…</p>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {results.length > 0 && <ul aria-label="Recipient search results" className="border rounded-xl divide-y max-h-56 overflow-auto">{results.map(person => <li key={person.id} className="flex items-center justify-between gap-2 p-2"><span className="min-w-0 break-words"><strong>{person.name}</strong> <span className="text-xs text-[#667085]">{person.email} · {person.id}{person.student ? '' : ' · staff'}</span></span><button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" disabled={chosen.has(person.id.toUpperCase())} onClick={() => add(person)} aria-label={'Add recipient ' + person.name}>{chosen.has(person.id.toUpperCase()) ? 'Added' : 'Add'}</button></li>)}</ul>}
    {term.length >= 2 && !looksLikeId(term) && !searching && !error && !results.length && <p className="text-xs text-[#667085]">No active accounts match “{term}”.</p>}
    {recipients.length > 0 && <ul aria-label="Selected recipients" className="flex flex-wrap gap-2">{recipients.map(person => <li key={person.id} className="inline-flex items-center gap-1 border rounded-full px-2 py-1 text-xs"><span>{person.name}{person.email ? ' (' + person.email + ')' : ''}</span><button type="button" className="px-1" onClick={() => remove(person)} aria-label={'Remove recipient ' + person.name}>×</button></li>)}</ul>}
  </div>;
}
export function AdminNotificationsPage() {
  const {
    can
  } = useAuth();
  const [rows, setRows] = useState([]),
    [page, setPage] = useState(1),
    [meta, setMeta] = useState(null),
    [form, setForm] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [courses, setCourses] = useState([]);
  useEffect(() => {
    const c = new AbortController();
    httpClient.request('/coaching/courses?pageSize=100', { signal: c.signal })
      .then(r => { if (!c.signal.aborted) setCourses(r.data || []); })
      .catch(() => {});
    return () => c.abort();
  }, []);
  const load = async () => {
    const r = await httpClient.request('/admin/notifications?page=' + page);
    setRows(r.data);
    setMeta(r.meta);
  };
  useEffect(() => {
    const c = new AbortController();
    httpClient.request('/admin/notifications?page=' + page, {
      signal: c.signal
    }).then(r => {
      if (!c.signal.aborted) {
        setRows(r.data);
        setMeta(r.meta);
      }
    }).catch(e => {
      if (!c.signal.aborted) setError(e.message);
    });
    return () => c.abort();
  }, [page]);
  const run = async work => {
    setBusy(true);
    setError('');
    try {
      await work();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const edit = row => setForm({
    ...row,
    title: row?.title ?? '',
    message: row?.message ?? '',
    category: row?.category ?? 'general',
    link: row?.link ?? '',
    kind: row?.audience?.kind ?? 'all_students',
    recipients: row?.recipients ?? (row?.audience?.userIds ?? []).map(value => ({ id: String(value), name: String(value), email: '' })),
    recipientQuery: '',
    courseId: row?.audience?.courseId ?? ''
  });
  const save = e => {
    e.preventDefault();
    run(async () => {
      const audience = {
        kind: form.kind,
        ...(form.kind === 'users' ? {
          userIds: [...new Set([...form.recipients.map(r => r.id), ...pastedIds(form.recipientQuery)])]
        } : {}),
        ...(form.kind === 'course' ? {
          courseId: form.courseId
        } : {})
      };
      await authenticatedWrite('/admin/notifications' + (form.id ? '/' + form.id : ''), {
        title: form.title,
        message: form.message,
        category: form.category,
        link: form.link,
        audience,
        ...(form.id ? {
          expectedRevision: form.revision
        } : {})
      }, form.id ? 'PATCH' : 'POST');
      setForm(null);
    });
  };
  const inlineEditor=useEditorFocus(Boolean(form));
  useEffect(()=>{
    const onKey=e=>{
      if(e.key==='Escape'&&form)setForm(null);
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[form]);
  return <div className="space-y-5 min-w-0 text-[#0A1D3F]"><AdminPageHeader title="Notifications" description="Write short updates for students, choose who receives them, then publish when ready." actions={can('notifications.write') && <button disabled={busy} onClick={() => edit(null)} className="admin-btn admin-btn-accent"><Plus aria-hidden="true" size={16} />Compose notification</button>} />{error && <p role="alert" className="border rounded-xl bg-amber-50 p-3">{error}</p>}<AdminTable><table className="w-full text-sm"><thead><tr><th className="p-3 text-left">Title</th><th>Audience</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="p-3 font-semibold break-words">{row.title}</td><td>{row.audience.kind}</td><td><AdminStatus value={row.status}>{row.status}</AdminStatus></td><td><div className="admin-actions">{can('notifications.write') && <><button className="admin-btn admin-btn-secondary admin-btn-sm" disabled={busy || row.status !== 'draft'} onClick={() => edit(row)}>Edit</button><button className="admin-btn admin-btn-ghost admin-btn-sm" disabled={busy || row.status === 'archived'} onClick={() => window.confirm('Archive this notice?') && run(() => authenticatedWrite('/admin/notifications/' + row.id, {
                    expectedRevision: row.revision
                  }, 'DELETE'))}>Archive</button></>}{can('notifications.publish') && <button className="admin-btn admin-btn-primary admin-btn-sm" disabled={busy || row.status !== 'draft'} onClick={() => window.confirm('Publish to the selected recipients?') && run(() => authenticatedWrite('/admin/notifications/' + row.id + '/publish', {
                  expectedRevision: row.revision
                }))}>Publish</button>}</div></td></tr>)}</tbody></table>{!rows.length && <AdminEmpty icon={Bell}><p>No notifications.</p></AdminEmpty>}</AdminTable><Pagination meta={meta} loading={busy} onChange={setPage} />
    {form && (
      <div
        className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 sm:p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150"
        onClick={e => { if (e.target === e.currentTarget) setForm(null); }}
      >
        <form onSubmit={save} ref={inlineEditor} aria-label="Notification editor" className="admin-card p-5 sm:p-6 space-y-4 w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl text-left">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E6E8EC]">
            <h2 className="admin-card-title text-base sm:text-lg font-bold text-[#0A1D3F]">{form.id ? 'Edit' : 'Compose'} notification</h2>
            <button type="button" onClick={() => setForm(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer" aria-label="Close notification editor">
              <X className="w-4 h-4" />
            </button>
          </div>
          {['title', 'message', 'link'].map(k => <AdminField key={k} className="block text-sm">{k}<AdminInput aria-label={'Notification ' + k} required={k !== 'link'} value={form[k]} onChange={e => setForm(p => ({
            ...p,
            [k]: e.target.value
          }))} className="block w-full border rounded-xl p-2" /></AdminField>)}
          <AdminField className="block text-sm">Category<AdminSelect aria-label="Notification category" value={form.category} onChange={e => setForm(p => ({
            ...p,
            category: e.target.value
          }))} className="block w-full border rounded-xl p-2">{['general', 'exam', 'course', 'promotion'].map(v => <option key={v}>{v}</option>)}</AdminSelect></AdminField>
          <AdminField className="block text-sm">Audience<AdminSelect aria-label="Notification audience" value={form.kind} onChange={e => setForm(p => ({
            ...p,
            kind: e.target.value
          }))} className="block w-full border rounded-xl p-2">{['all_students', 'users', 'course'].map(v => <option key={v}>{v}</option>)}</AdminSelect></AdminField>
          {form.kind === 'users' && <RecipientPicker recipients={form.recipients} query={form.recipientQuery} onChange={next => setForm(p => ({ ...p, recipients: next.recipients, recipientQuery: next.query }))} />}
          {form.kind === 'course' && (
            <div className="space-y-2">
              {/* Only published courses can be targeted, which is exactly what the public catalogue lists. */}
              {courses.length > 0 && <AdminField className="block text-sm">
                Course
                <AdminSelect
                  aria-label="Notification course selector"
                  value={courses.some(c => c.id === form.courseId) ? form.courseId : ''}
                  onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
                  className="block w-full border rounded-xl p-2 mt-1 bg-white"
                >
                  <option value="">Choose a published course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}{c.class ? ` (${c.class})` : ''}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>}
              {/* Fallback: the list could not load, or this draft targets a course not in it. */}
              {(!courses.length || (form.courseId && !courses.some(c => c.id === form.courseId))) && <AdminField className="block text-sm">
                Course ID
                <AdminInput
                  aria-label="Notification course"
                  value={form.courseId}
                  onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
                  className="block w-full border p-2 rounded-xl font-mono bg-white mt-1"
                />
              </AdminField>}
            </div>
          )}
          <p className="text-xs text-[#53647c]">Optional links use approved internal routes only. Publication requires a separate permission.</p>
          <div className="admin-actions flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setForm(null)} className="admin-btn admin-btn-ghost">Cancel</button>
            <button disabled={busy} className="admin-btn admin-btn-primary">Save notification draft</button>
          </div>
        </form>
      </div>
    )}
  </div>;
}
