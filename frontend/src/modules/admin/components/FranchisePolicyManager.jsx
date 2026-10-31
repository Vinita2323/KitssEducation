import React, { useEffect, useState } from 'react';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from './AdminFields';
import { useAuth } from '../../user/context/AuthContext';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
export function FranchisePolicyManager() {
  const { user } = useAuth();
  const [record, setRecord] = useState(null), [draft, setDraft] = useState(null), [reason, setReason] = useState(''), [busy, setBusy] = useState(true), [error, setError] = useState(''), [message, setMessage] = useState(''), [dirty, setDirty] = useState(false);
  const load = async () => { setBusy(true); setError(''); try { const r = (await httpClient.request('/admin/franchise-policy')).data; setRecord(r); setDraft(r.draft); setDirty(false); } catch(e) { setError(e.message); } finally { setBusy(false); } };
  useEffect(() => { load(); }, []);
  const change = (key, value) => { setDraft(p => ({ ...p, [key]: value })); setDirty(true); setMessage(''); };
  const save = async publish => { setBusy(true); setError(''); setMessage(''); try {
    const r = await authenticatedWrite('/admin/franchise-policy' + (publish ? '/publish' : ''), { expectedRevision: record.revision, reason, ...(publish ? {} : { policy: draft }) }, publish ? 'POST' : 'PATCH');
    setRecord(r); setDraft(r.draft); setDirty(false); if (publish) setReason(''); setMessage(publish ? 'Franchise policy published. Accepted application versions remain unchanged.' : 'Franchise policy draft saved. Review it before publishing.');
  } catch(e) { setError(e.message); } finally { setBusy(false); } };
  const locked = busy || !user?.roles.includes('super_admin');
  const input = (key, label, number = false, min = 0, max = 200) => <AdminField className="block">{label}<AdminInput aria-label={label} type={number ? 'number' : 'text'} min={number ? min : undefined} max={number ? max : undefined} value={draft[key] ?? ''} onChange={e => change(key, number ? Number(e.target.value) : e.target.value)} /></AdminField>;
  return <section id="franchise-policy" className="admin-card p-5 space-y-4" aria-label="Franchise policy manager"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-bold text-xl">Franchise Policy</h2><button type="button" disabled={busy} onClick={load}>Reload policy</button></div>
    <p className="text-sm">Draft changes do not affect applicants until published. Only the main administrator can publish. Initial wording and document requirements are editable starting suggestions.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status">{message}</p>}
    {!draft ? <p>Loading franchise policy...</p> : <form onSubmit={e => { e.preventDefault(); save(false); }}><fieldset disabled={locked} className="space-y-4">
      <p>Published version: {record.published?.version || 'None'}{dirty ? ' - unsaved changes' : ''}</p>
      <AdminField><AdminInput type="checkbox" checked={draft.acceptingApplications !== false} onChange={e => change('acceptingApplications',e.target.checked)} />Accept new franchise applications</AdminField>
      <div className="grid sm:grid-cols-2 gap-3">{input('version','Franchise policy version')}{input('effectiveFrom','Effective from (UTC ISO date)')}</div>
      <AdminField className="block">Institution application mode<AdminSelect aria-label="Institution application mode" value={draft.applicationMode} onChange={e => change('applicationMode', e.target.value)}><option value="both">Independent or existing institution</option><option value="independent">Independent institutions only</option><option value="linked">Existing university and college required</option></AdminSelect></AdminField>
      <AdminField className="block">Eligible institution types (comma separated)<AdminInput aria-label="Eligible institution types" value={draft.institutionTypes.join(',')} onChange={e => change('institutionTypes', e.target.value.split(',').map(s => s.trim()))} /></AdminField>
      {input('minimumYears','Minimum years established',true)}
      <fieldset className="border p-3 rounded-xl space-y-3"><legend>Application documents</legend>{draft.documents.map((d,i) => {
        const update = fields => change('documents', draft.documents.map((v,n) => n === i ? { ...v, ...fields } : v));
        return <div key={i} className="border rounded-xl p-3 space-y-2"><div className="grid sm:grid-cols-2 gap-3">{['key','label'].map(k => <AdminField key={k}>Document {i+1} {k}<AdminInput aria-label={'Document '+(i+1)+' '+k} value={d[k]} onChange={e => update({ [k]: e.target.value })} /></AdminField>)}</div>
          <AdminField><AdminInput type="checkbox" checked={d.required} onChange={e => update({ required: e.target.checked })} />Required document</AdminField>
          <div className="flex flex-wrap gap-3">{['application/pdf','image/png','image/jpeg'].map(mime => <AdminField key={mime}><AdminInput type="checkbox" checked={d.mime.includes(mime)} onChange={e => update({ mime: e.target.checked ? [...d.mime,mime] : d.mime.filter(v => v !== mime) })} />{mime}</AdminField>)}</div>
          <AdminField>Maximum document size (bytes)<AdminInput type="number" min={1} max={10485760} value={d.maxBytes} onChange={e => update({ maxBytes: Number(e.target.value) })} /></AdminField>
          <button type="button" onClick={() => change('documents',draft.documents.filter((_,n) => n !== i))}>Remove document requirement</button>
        </div>;
      })}<button type="button" disabled={draft.documents.length >= 10} onClick={() => change('documents',[...draft.documents,{key:'document_'+(draft.documents.length+1),label:'New document',required:true,mime:['application/pdf'],maxBytes:5242880}])}>Add document requirement</button></fieldset>
      <AdminField className="block">Applicant privacy notice<AdminTextarea aria-label="Applicant privacy notice" rows={3} value={draft.privacyText} onChange={e => change('privacyText',e.target.value)} /></AdminField>
      <AdminField className="block">Agreement version<AdminInput aria-label="Franchise agreement version" value={draft.agreement.version} onChange={e => change('agreement',{...draft.agreement,version:e.target.value})} /></AdminField>
      <AdminField className="block">Agreement text<AdminTextarea aria-label="Franchise agreement text" rows={6} value={draft.agreement.text} onChange={e => change('agreement',{...draft.agreement,text:e.target.value})} /></AdminField>
      {['joining','renewal'].map(kind => <fieldset className="border p-3 rounded-xl space-y-3" key={kind}><legend>{kind === 'joining' ? 'Joining fee' : 'Renewals'}</legend>
        <AdminField><AdminInput type="checkbox" checked={draft[kind].enabled} onChange={e => change(kind,{...draft[kind],enabled:e.target.checked,...(!e.target.checked ? {amountMinor:0} : {})})} />{kind === 'joining' ? 'Charge a joining fee' : 'Require periodic renewal'}</AdminField>
        <AdminField className="block">{kind} amount (INR minor units)<AdminInput aria-label={kind+' amount minor units'} type="number" min={0} step={1} disabled={!draft[kind].enabled} value={draft[kind].amountMinor} onChange={e => change(kind,{...draft[kind],amountMinor:Number(e.target.value)})} /></AdminField>
        {kind === 'renewal' && <><AdminField className="block">Renewal interval (calendar months)<AdminInput type="number" min={1} max={120} value={draft.renewal.months} onChange={e => change('renewal',{...draft.renewal,months:Number(e.target.value)})} /></AdminField>
          <AdminField className="block">Grace period (days)<AdminInput type="number" min={0} max={365} value={draft.renewal.graceDays} onChange={e => change('renewal',{...draft.renewal,graceDays:Number(e.target.value)})} /></AdminField>
          <AdminField className="block">After the grace period<AdminSelect aria-label="Franchise expiry action" value={draft.renewal.expiryAction} onChange={e => change('renewal',{...draft.renewal,expiryAction:e.target.value})}><option value="suspend">Suspend franchise affiliation</option><option value="manual_review">Require manual renewal review</option></AdminSelect></AdminField></>}
      </fieldset>)}
      {input('reminderDays','Renewal reminder days before due date',true,0,180)}
      <p className="text-xs">Verified active sign-in is required. New rules apply prospectively; accepted applications keep their policy and agreement. Renewals require acceptance of current terms. No automatic charges or student/book/course access changes occur on franchise expiry.</p>
      <AdminField className="block">Franchise policy change reason<AdminTextarea aria-label="Franchise policy change reason" required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></AdminField>
      <div className="flex flex-wrap gap-3"><button type="submit">Save franchise policy draft</button><button type="button" disabled={locked || dirty || !record.hasSavedDraft || !reason.trim()} onClick={() => save(true)}>Publish franchise policy</button></div>
    </fieldset></form>}
  </section>;
}
