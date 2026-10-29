import React, { useState } from 'react';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from './AdminFields';

export const kitssOwnershipNote = 'Original course content created by the KITSS team.';

export function ContentOwnership({ confirmed, note, onChange }) {
  // Treat older custom notes as external/unspecified evidence. Never silently
  // classify existing material as KITSS-owned or replace its recorded evidence.
  const [source, setSource] = useState(note === kitssOwnershipNote ? 'kitss' : note ? 'external' : '');
  const selectSource = value => {
    setSource(value);
    onChange({ rightsConfirmed: false, rightsNote: value === 'kitss' ? kitssOwnershipNote : note === kitssOwnershipNote ? '' : note });
  };
  return <details className="rounded-xl border p-3">
    <summary className="font-bold cursor-pointer">Content ownership</summary>
    <div className="space-y-3 mt-3">
      <AdminField help="">Who created this content?<AdminSelect aria-label="Who created this content?" className="w-full border rounded-lg p-2" value={source} onChange={e => selectSource(e.target.value)}><option value="">Select content source</option><option value="kitss">KITSS team</option><option value="external">Teacher / external source</option></AdminSelect></AdminField>
      {source === 'external' && <AdminField help="Name the creator and reference their permission, agreement or licence.">Permission details<AdminTextarea aria-label="Permission details" className="w-full border rounded-lg p-2" maxLength={2000} value={note || ''} onChange={e => onChange({ rightsNote: e.target.value, rightsConfirmed: false })} /></AdminField>}
      {source && <AdminField help=""><AdminInput type="checkbox" checked={Boolean(confirmed)} onChange={e => onChange({ rightsConfirmed: e.target.checked })} />{source === 'kitss' ? 'I confirm KITSS owns this course content.' : 'I confirm we have permission to use this content.'}</AdminField>}
      <p className="text-xs text-slate-600">Confirm ownership or permission before publishing. You can save an unfinished draft.</p>
    </div>
  </details>;
}
