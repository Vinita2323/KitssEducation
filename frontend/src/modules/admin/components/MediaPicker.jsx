import React, { useEffect, useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../user/context/AuthContext';
import { contentService } from '../../user/services/contentService';
import { readOptions } from '../../user/services/collegeService';
import { AdminSelect } from './AdminFields';

export function MediaPicker({ purpose, label, value, onChange }) {
  const { can } = useAuth();
  const fileInputRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const refresh = () => {
    if (can('media.read')) {
      readOptions('/admin/media', { purpose, status: 'ready' })
        .then(setAssets)
        .catch(e => setError(e.message));
    }
  };

  useEffect(refresh, [purpose]);

  const acceptTypes =
    purpose === 'lesson_video'
      ? '.mp4,video/mp4'
      : purpose === 'franchise_document'
      ? '.pdf,.png,.jpg,.jpeg'
      : purpose === 'result_import'
      ? '.json'
      : (purpose.startsWith('book_') && purpose !== 'book_cover') || purpose === 'lesson_document'
      ? '.pdf'
      : '.png,.jpg,.jpeg,.webp';

  const handleUploadFile = async (fileToUpload) => {
    if (!fileToUpload) return;
    setBusy(true);
    setError('');
    setMessage(`Uploading ${fileToUpload.name}...`);
    try {
      const asset = await contentService.upload(fileToUpload, purpose, crypto.randomUUID(), (progressMsg) => {
        setMessage(progressMsg);
      });
      if (asset.status === 'ready') {
        refresh();
        onChange(asset.id);
        setMessage(`Attached: ${fileToUpload.name}`);
      } else {
        setMessage(`Saved. File reference: ${asset.id} (check scan in Media)`);
      }
    } catch (e) {
      setError(e.message || 'Upload failed');
      setMessage('');
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      handleUploadFile(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (busy || !can('media.write')) return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleUploadFile(droppedFile);
    }
  };

  const attachedAsset = assets.find(a => a.id === value);
  const displayFileName = attachedAsset ? attachedAsset.originalName : (value ? `Asset ${value.slice(-8)}` : null);

  return (
    <div
      className={`space-y-2.5 p-3.5 border rounded-xl transition ${
        isDragging
          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
          : 'border-[#E6E8EC] bg-[#F8FAFC]'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Header & Library Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#0A1D3F] flex items-center gap-1.5">
          <span>{label}</span>
          {value && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Attached</span>
            </span>
          )}
        </span>

        {/* Existing Assets Dropdown */}
        <div className="min-w-0 sm:max-w-xs w-full">
          <AdminSelect
            aria-label={`${label} selector`}
            className="w-full p-1.5 border rounded-lg bg-white text-xs truncate"
            value={value || ''}
            onChange={e => {
              onChange(e.target.value || null);
              setMessage('');
              setError('');
            }}
          >
            <option value="">Choose from library...</option>
            {value && !assets.some(a => a.id === value) && (
              <option value={value}>Current asset ({value.slice(-8)})</option>
            )}
            {assets.map(a => (
              <option key={a.id} value={a.id}>
                {a.originalName} — clean, ready
              </option>
            ))}
          </AdminSelect>
        </div>
      </div>

      {/* Single-Click Upload Action Bar */}
      {can('media.write') && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            className="hidden"
            disabled={busy}
            onChange={handleFileChange}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer ${
                busy
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : value
                  ? 'bg-white hover:bg-slate-100 text-[#0A1D3F] border border-slate-300'
                  : 'bg-[#0A1D3F] hover:bg-[#0A1D3F]/90 text-white'
              }`}
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF8A00]" />
                  <span>{message || 'Uploading & attaching...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>{value ? `Replace ${label}` : `Upload ${label}`}</span>
                </>
              )}
            </button>

            {value && !busy && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setMessage('');
                  setError('');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title={`Detach ${label}`}
              >
                Remove
              </button>
            )}

            {!busy && (
              <span className="text-[11px] text-slate-500 truncate">
                {displayFileName ? `Active: ${displayFileName}` : `Allowed: ${acceptTypes}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lesson video preview if applicable */}
      {purpose === 'lesson_video' && value && can('media.read') && (
        <video
          key={value}
          aria-label="Admin lesson video preview"
          controls
          playsInline
          preload="metadata"
          className="w-full max-h-72 bg-black rounded-lg mt-2"
          src={'/api/v1/media/' + value + '/content'}
        />
      )}

      {/* Status & Error Feedback */}
      {message && !busy && (
        <p role="status" className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="break-words">{message}</span>
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-rose-700 font-medium flex items-center gap-1.5 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="break-words">{error}</span>
        </p>
      )}
    </div>
  );
}