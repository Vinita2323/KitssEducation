import { AdminField, AdminInput, AdminSelect } from './AdminFields';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import { contentService } from '../../user/services/contentService';
import { readOptions } from '../../user/services/collegeService';

export function MediaPicker({ purpose, label, value, onChange }) {
  const { can } = useAuth();
  const [assets, setAssets] = useState([]), [file, setFile] = useState(null), [uploadKey, setUploadKey] = useState('');
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const refresh = () => { if (can('media.read')) readOptions('/admin/media', { purpose, status: 'ready' }).then(setAssets).catch(e => setError(e.message)); };
  useEffect(refresh, [purpose]);
  const upload = async () => { if (!file) return; setBusy(true); setError(''); try { const asset = await contentService.upload(file, purpose, uploadKey, setMessage); setFile(null); if (asset.status === 'ready') { refresh(); onChange(asset.id); } else setMessage('File saved but not yet cleared for use. Check its security scan in Media. File reference: ' + asset.id); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <div className="space-y-2 p-3 border border-[#E6E8EC] rounded-xl bg-[#F8FAFC]">
    <AdminField className="block text-xs font-bold">{label}<AdminSelect aria-label={label} className="w-full p-2 mt-1 border rounded-lg bg-white text-xs" value={value || ''} onChange={e => onChange(e.target.value || null)}><option value="">No asset attached</option>{value && !assets.some(a => a.id === value) && <option value={value}>Current asset {value}</option>}{assets.map(a => <option key={a.id} value={a.id}>{a.originalName} — clean, ready</option>)}</AdminSelect></AdminField>
    {can('media.write') && <div className="flex flex-wrap gap-2 items-center"><AdminInput aria-label={'Upload ' + label} type="file" accept={purpose === 'lesson_video' ? '.mp4,video/mp4' : purpose === 'franchise_document' ? '.pdf,.png,.jpg,.jpeg' : purpose === 'result_import' ? '.json' : (purpose.startsWith('book_') && purpose !== 'book_cover') || purpose === 'lesson_document' ? '.pdf' : '.png,.jpg,.jpeg,.webp'} className="text-xs min-w-0 w-full" disabled={busy} onChange={e => { setFile(e.target.files?.[0] ?? null); setUploadKey(crypto.randomUUID()); setMessage(''); }} /><button type="button" disabled={!file || busy} onClick={upload} className="px-3 py-2 bg-[#0A1D3F] text-white rounded-lg text-xs disabled:opacity-40">{busy ? 'Uploading…' : 'Upload ' + label}</button></div>}
    {purpose === 'lesson_video' && value && can('media.read') && <video key={value} aria-label="Admin lesson video preview" controls playsInline preload="metadata" className="w-full max-h-72 bg-black rounded-lg" src={'/api/v1/media/' + value + '/content'} />}
    {purpose === 'lesson_video' && <p className="text-xs">Choose a cleared video or upload an MP4. Use Media to check scans. Files still in use cannot be deleted.</p>}
    {message && <p role="status" className="text-xs break-words">{message}</p>}{error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
