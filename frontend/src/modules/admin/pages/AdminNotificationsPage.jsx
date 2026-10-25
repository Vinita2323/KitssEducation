import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';
export function AdminNotificationsPage() {
  const {
    can
  } = useAuth();
  const [rows, setRows] = useState([]),
    [page, setPage] = useState(1),
    [meta, setMeta] = useState(null),
    [form, setForm] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
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
    recipients: row?.audience?.userIds?.join(',') ?? '',
    courseId: row?.audience?.courseId ?? ''
  });
  const save = e => {
    e.preventDefault();
    run(async () => {
      const audience = {
        kind: form.kind,
        ...(form.kind === 'users' ? {
          userIds: form.recipients.split(',').map(x => x.trim()).filter(Boolean)
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
  return <div className="space-y-4 min-w-0"><h1 className="font-bold text-xl text-[#0A1D3F]">Notifications</h1>{error && <p role="alert" className="border rounded-xl bg-amber-50 p-3">{error}</p>}{can('notifications.write') && <button disabled={busy} onClick={() => edit(null)} className="p-3 rounded-xl bg-[#0A1D3F] text-white">Compose notification</button>}<div className="bg-white border rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="p-3 text-left">Title</th><th>Audience</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="p-3">{row.title}</td><td>{row.audience.kind}</td><td>{row.status}</td><td><div className="flex flex-wrap gap-2 p-2">{can('notifications.write') && <><button disabled={busy || row.status !== 'draft'} onClick={() => edit(row)}>Edit</button><button disabled={busy || row.status === 'archived'} onClick={() => window.confirm('Archive this notice?') && run(() => authenticatedWrite('/admin/notifications/' + row.id, {
                    expectedRevision: row.revision
                  }, 'DELETE'))}>Archive</button></>}{can('notifications.publish') && <button disabled={busy || row.status !== 'draft'} onClick={() => window.confirm('Publish to the selected recipients?') && run(() => authenticatedWrite('/admin/notifications/' + row.id + '/publish', {
                  expectedRevision: row.revision
                }))}>Publish</button>}</div></td></tr>)}</tbody></table>{!rows.length && <p className="p-3">No notifications.</p>}</div><Pagination meta={meta} loading={busy} onChange={setPage} />{form && <form onSubmit={save} className="bg-white border rounded-xl p-4 space-y-3"><h2 className="font-bold">{form.id ? 'Edit' : 'Compose'} notification</h2>{['title', 'message', 'link'].map(k => <label key={k} className="block text-sm">{k}<input aria-label={'Notification ' + k} required={k !== 'link'} value={form[k]} onChange={e => setForm(p => ({
          ...p,
          [k]: e.target.value
        }))} className="block w-full border rounded-xl p-2" /></label>)}<label className="block text-sm">Category<select aria-label="Notification category" value={form.category} onChange={e => setForm(p => ({
          ...p,
          category: e.target.value
        }))} className="block w-full border rounded-xl p-2">{['general', 'exam', 'course', 'promotion'].map(v => <option key={v}>{v}</option>)}</select></label><label className="block text-sm">Audience<select aria-label="Notification audience" value={form.kind} onChange={e => setForm(p => ({
          ...p,
          kind: e.target.value
        }))} className="block w-full border rounded-xl p-2">{['all_students', 'users', 'course'].map(v => <option key={v}>{v}</option>)}</select></label>{form.kind === 'users' && <label className="block text-sm">User database IDs (comma separated)<input aria-label="Notification recipients" value={form.recipients} onChange={e => setForm(p => ({
          ...p,
          recipients: e.target.value
        }))} className="block w-full border p-2 rounded-xl" /></label>}{form.kind === 'course' && <label className="block text-sm">Course ID<input value={form.courseId} onChange={e => setForm(p => ({
          ...p,
          courseId: e.target.value
        }))} className="block w-full border p-2 rounded-xl" /></label>}<p className="text-xs">Optional links use approved internal routes only. Publication requires a separate permission.</p><button disabled={busy} className="p-3 bg-[#0A1D3F] text-white rounded-xl">Save notification draft</button><button type="button" onClick={() => setForm(null)} className="p-3">Cancel</button></form>}</div>;
}
