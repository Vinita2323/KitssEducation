import { statusLabel } from '../../../shared/ui/displayText';
import { AdminField, AdminSelect } from '../components/AdminFields';
import React, { useEffect, useState } from 'react';
import { contentService } from '../../user/services/contentService';
import { authenticatedWrite } from '../../user/services/authService';
import { Pagination } from '../../user/components/common/Pagination';
import { useAuth } from '../../user/context/AuthContext';
import { MediaPicker } from '../components/MediaPicker';
import { Image as ImageIcon, RefreshCw } from 'lucide-react';
import { AdminCard, AdminEmpty, AdminMeta, AdminPageHeader, AdminStatus, AdminTable, AdminToolbar } from '../components/AdminUI';
export function AdminMediaPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]), [meta, setMeta] = useState(null), [page, setPage] = useState(1), [status, setStatus] = useState(''), [purpose, setPurpose] = useState('book_cover'), [scanner, setScanner] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false), [version, setVersion] = useState(0);
  useEffect(() => { const controller = new AbortController(); setBusy(true); contentService.adminList('/admin/media', { page, status }, controller.signal).then(r => { setRows(r.data); setMeta(r.meta); setScanner(r.scannerConfigured); }).catch(e => { if (e.code !== 'ABORTED') setError(e.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); }); return () => controller.abort(); }, [page, status, version]);
  const mutate = async action => { setError(''); setBusy(true); try { await action(); setVersion(v => v + 1); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <div className="space-y-5 text-[#0A1D3F]">
    <AdminPageHeader title="Media Management" description={<>{scanner ? 'Security checks are available. Only files that pass can be used.' : 'File security checks are unavailable. Uploads stay private and cannot be used until they pass a scan. Contact your site administrator.'} Application documents remain private and follow their access rules.</>} />
    <AdminCard title="Upload a file">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] items-start">
        <AdminField className="block text-xs">Upload purpose<AdminSelect aria-label="Media purpose" className="p-2 border rounded-lg" value={purpose} onChange={e => setPurpose(e.target.value)}>{['franchise_document','lesson_video','lesson_document','course_thumbnail','book_cover','book_full','book_preview','banner','faculty','cms'].map(p => <option key={p} value={p}>{statusLabel(p)}</option>)}</AdminSelect></AdminField>
        <MediaPicker key={purpose} purpose={purpose} label="Media file" value={null} onChange={() => setVersion(v => v + 1)} />
      </div>
    </AdminCard>
    <AdminToolbar>
      <div className="admin-toolbar-grow max-w-xs"><AdminSelect aria-label="Media status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="p-2 border rounded-lg"><option value="">All states</option>{['quarantined','ready','deleting','deleted','failed'].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</AdminSelect></div>
      <button onClick={() => setVersion(v => v + 1)} className="admin-btn admin-btn-secondary admin-toolbar-end"><RefreshCw aria-hidden="true" size={15} />Refresh media</button>
    </AdminToolbar>
    {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">{error}</p>}{busy && <p role="status" className="admin-meta">Loading…</p>}
    <AdminTable><table className="w-full text-sm"><thead><tr>{['Name / purpose','State / scan','Size / reference','Actions'].map(t => <th key={t} className="p-3 text-left">{t}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>
      <td><p className="font-semibold break-words">{row.originalName}</p><AdminMeta>{statusLabel(row.purpose)}</AdminMeta></td>
      <td><div className="flex flex-wrap gap-1.5"><AdminStatus value={row.status} /><AdminStatus value={row.scan.status} /></div></td>
      <td><p>{row.bytes} bytes</p><p className="admin-meta font-mono break-all">{row.id}</p></td>
      <td><div className="admin-actions"><button className="admin-btn admin-btn-secondary admin-btn-sm" disabled={busy || row.status !== 'quarantined' || !can('media.write') || !scanner} onClick={() => mutate(() => authenticatedWrite('/admin/media/' + row.id + '/scan', { expectedRevision: row.revision }))}>Rescan</button>{row.status === 'ready' && <a className="admin-btn admin-btn-ghost admin-btn-sm" href={'/api/v1/media/' + row.id + '/content'} target="_blank" rel="noopener noreferrer">Inspect clean file</a>}<button className="admin-btn admin-btn-danger admin-btn-sm" disabled={busy || !can('media.write') || ['deleted','failed'].includes(row.status)} onClick={() => { if (confirm('Delete unreferenced media? Referenced files are protected.')) mutate(() => authenticatedWrite('/media/' + row.id, { expectedRevision: row.revision }, 'DELETE')); }}>Delete unreferenced</button></div></td>
    </tr>)}</tbody></table>{!rows.length && !busy && <AdminEmpty icon={ImageIcon}><p>No media records.</p></AdminEmpty>}</AdminTable>
    <Pagination meta={meta} onChange={setPage} loading={busy} />
  </div>;
}
