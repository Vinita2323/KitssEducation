import React from 'react';
import { AdminField, AdminTextarea } from '../AdminFields';
import { reasonPrompt, showStamp } from './settingsFormat';

export function Toggle({ checked, onChange, children, help, disabled }) {
  return <AdminField help={help ?? ''} className="flex items-start gap-2 font-semibold"><input type="checkbox" className="mt-1" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} /><span>{children}</span></AdminField>;
}

export function Notice({ tone = 'info', children }) {
  const tones = { info: 'bg-[#eef4fb] border-[#cfdcee] text-[#0A1D3F]', success: 'bg-emerald-50 border-emerald-200 text-emerald-900', warning: 'bg-amber-50 border-amber-200 text-amber-900' };
  return <div className={'rounded-xl border p-3 text-sm ' + tones[tone]}>{children}</div>;
}

// Shared footer for policy forms: a required change reason, the save action and the change history.
export function SaveBar({ reason, setReason, label, busy, disabled, dirty, history = [], extra }) {
  return <div className="space-y-3 border-t border-[#e1e7f0] pt-4">
    <AdminField className="block" help={reasonPrompt}>Reason for this change<AdminTextarea aria-label="Reason for this change" rows={2} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></AdminField>
    <div className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={busy || disabled || !reason.trim()} className="admin-btn admin-btn-primary">{label}</button>{extra}
      {dirty && <span className="text-sm text-amber-800">Unsaved changes</span>}
    </div>
    {history.length > 0 && <details className="text-sm"><summary className="cursor-pointer font-semibold">Change history</summary>
      <ol className="mt-2 space-y-1">{[...history].reverse().slice(0, 20).map(h => <li key={h.revision}><span className="font-semibold">{showStamp(h.at)}</span> · {h.reason}</li>)}</ol></details>}
  </div>;
}

export function Status({ tone, children }) {
  return <span className={'admin-status admin-status-' + tone}>{children}</span>;
}
