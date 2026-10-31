import { AdminField, AdminInput, AdminSelect } from '../components/AdminFields';
import { useEditorFocus } from '../components/useAdminAccessibility';
import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';
import { Bell, Plus } from 'lucide-react';
import { AdminEmpty, AdminPageHeader, AdminStatus, AdminTable } from '../components/AdminUI';
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
  const inlineEditor=useEditorFocus(Boolean(form));
  return <div className="space-y-5 min-w-0 text-[#0A1D3F]"><AdminPageHeader title="Notifications" description="Write short updates for students, choose who receives them, then publish when ready." actions={can('notifications.write') && <button disabled={busy} onClick={() => edit(null)} className="admin-btn admin-btn-accent"><Plus aria-hidden="true" size={16} />Compose notification</button>} />{error && <p role="alert" className="border rounded-xl bg-amber-50 p-3">{error}</p>}<AdminTable><table className="w-full text-sm"><thead><tr><th className="p-3 text-left">Title</th><th>Audience</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="p-3 font-semibold break-words">{row.title}</td><td>{row.audience.kind}</td><td><AdminStatus value={row.status}>{row.status}</AdminStatus></td><td><div className="admin-actions">{can('notifications.write') && <><button className="admin-btn admin-btn-secondary admin-btn-sm" disabled={busy || row.status !== 'draft'} onClick={() => edit(row)}>Edit</button><button className="admin-btn admin-btn-ghost admin-btn-sm" disabled={busy || row.status === 'archived'} onClick={() => window.confirm('Archive this notice?') && run(() => authenticatedWrite('/admin/notifications/' + row.id, {
                    expectedRevision: row.revision
                  }, 'DELETE'))}>Archive</button></>}{can('notifications.publish') && <button className="admin-btn admin-btn-primary admin-btn-sm" disabled={busy || row.status !== 'draft'} onClick={() => window.confirm('Publish to the selected recipients?') && run(() => authenticatedWrite('/admin/notifications/' + row.id + '/publish', {
                  expectedRevision: row.revision
                }))}>Publish</button>}</div></td></tr>)}</tbody></table>{!rows.length && <AdminEmpty icon={Bell}><p>No notifications.</p></AdminEmpty>}</AdminTable><Pagination meta={meta} loading={busy} onChange={setPage} />{form && <form onSubmit={save} ref={inlineEditor} aria-label="Notification editor" className="admin-card p-5 space-y-4"><h2 className="admin-card-title">{form.id ? 'Edit' : 'Compose'} notification</h2>{['title', 'message', 'link'].map(k => <AdminField key={k} className="block text-sm">{k}<AdminInput aria-label={'Notification ' + k} required={k !== 'link'} value={form[k]} onChange={e => setForm(p => ({
          ...p,
          [k]: e.target.value
        }))} className="block w-full border rounded-xl p-2" /></AdminField>)}<AdminField className="block text-sm">Category<AdminSelect aria-label="Notification category" value={form.category} onChange={e => setForm(p => ({
          ...p,
          category: e.target.value
        }))} className="block w-full border rounded-xl p-2">{['general', 'exam', 'course', 'promotion'].map(v => <option key={v}>{v}</option>)}</AdminSelect></AdminField><AdminField className="block text-sm">Audience<AdminSelect aria-label="Notification audience" value={form.kind} onChange={e => setForm(p => ({
          ...p,
          kind: e.target.value
        }))} className="block w-full border rounded-xl p-2">{['all_students', 'users', 'course'].map(v => <option key={v}>{v}</option>)}</AdminSelect></AdminField>{form.kind === 'users' && <AdminField className="block text-sm">User database IDs (comma separated)<AdminInput aria-label="Notification recipients" value={form.recipients} onChange={e => setForm(p => ({
          ...p,
          recipients: e.target.value
        }))} className="block w-full border p-2 rounded-xl" /></AdminField>}{form.kind === 'course' && <AdminField className="block text-sm">Course ID<AdminInput value={form.courseId} onChange={e => setForm(p => ({
          ...p,
          courseId: e.target.value
        }))} className="block w-full border p-2 rounded-xl" /></AdminField>}<p className="text-xs">Optional links use approved internal routes only. Publication requires a separate permission.</p><div className="admin-actions"><button disabled={busy} className="admin-btn admin-btn-primary">Save notification draft</button><button type="button" onClick={() => setForm(null)} className="admin-btn admin-btn-ghost">Cancel</button></div></form>}</div>;
}
