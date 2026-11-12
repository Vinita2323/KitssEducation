import React, { useEffect, useState } from 'react';
import { AdminField, AdminInput, AdminTextarea } from '../AdminFields';
import { AdminCard } from '../AdminUI';
import { authenticatedWrite } from '../../../user/services/authService';
import { toRupees, toPaise, showDay, same, versionName, withKeys } from './settingsFormat';
import { franchiseDocument, franchiseFixed, franchiseRenewalFixed } from './standardTerms';
import { Notice, SaveBar, Status, Toggle } from './SettingsParts';

// Terms only; version names and the start date are managed automatically.
const terms = p => { if (!p) return null; const { version, effectiveFrom, agreement, ...rest } = p; return { ...rest, agreementText: agreement?.text }; };
const fee = f => ({ enabled: f.enabled, rupees: f.amountMinor ? toRupees(f.amountMinor) : '' });
const toForm = p => ({ accepting: p.acceptingApplications !== false, documents: p.documents.map(d => ({ key: d.key, label: d.label, required: d.required })), joining: fee(p.joining), renewal: { ...fee(p.renewal), months: p.renewal.months }, agreement: p.agreement.text });
// Rebuilds the full policy the server expects from the few editable fields plus the fixed rules.
function toPolicy(form, draft, published) {
  const amount = f => f.enabled ? toPaise(f.rupees) : 0;
  const p = { ...draft, ...franchiseFixed, acceptingApplications: form.accepting,
    documents: withKeys(form.documents.map(d => ({ ...d, label: d.label.trim() }))).map(d => ({ key: d.key, label: d.label, required: d.required, ...franchiseDocument })),
    joining: { ...draft.joining, enabled: form.joining.enabled, amountMinor: amount(form.joining) },
    renewal: { ...draft.renewal, ...franchiseRenewalFixed, enabled: form.renewal.enabled, amountMinor: amount(form.renewal), months: Number(form.renewal.months) || 12 },
    agreement: { ...draft.agreement, text: form.agreement.trim() } };
  if (published && !same(terms(p), terms(published)) && p.version === published.version) { p.version = versionName('franchise-policy'); p.effectiveFrom = new Date().toISOString(); }
  if (!published || Date.parse(p.effectiveFrom) > Date.now()) p.effectiveFrom = new Date().toISOString();
  if (published && p.agreement.text !== published.agreement.text && p.agreement.version === published.agreement.version) p.agreement = { ...p.agreement, version: versionName('franchise-agreement') };
  return p;
}
function problems(form) {
  const issues = [];
  if (form.documents.some(d => !d.label.trim())) issues.push('Give every document a name, or remove it.');
  for (const kind of ['joining', 'renewal']) if (form[kind].enabled && !(toPaise(form[kind].rupees) > 0)) issues.push(`Enter the ${kind} fee in rupees, or switch it off.`);
  if (form.renewal.enabled && !(Number(form.renewal.months) >= 1 && Number(form.renewal.months) <= 120)) issues.push('Renewal must be every 1 to 120 months.');
  if (!form.agreement.trim()) issues.push('Add the franchise agreement text.');
  return issues;
}

export function FranchiseSettings({ record, locked, onChanged }) {
  const [form, setForm] = useState(() => toForm(record.draft)), [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  // Business-policy saves share this record's revision; only a changed draft resets the form.
  const savedDraft = JSON.stringify(record.draft);
  useEffect(() => { setForm(toForm(record.draft)); }, [savedDraft]);
  const change = fields => { setForm(f => ({ ...f, ...fields })); setMessage(''); };
  const published = record.published, dirty = !same(form, toForm(record.draft)), issues = problems(form);
  // Something to publish: unsaved edits, a first publication, or a saved draft that differs from the live rules.
  const pending = dirty || !published || (record.hasSavedDraft && !same(terms(record.draft), terms(published)));
  const [tone, label] = !published ? ['neutral', 'Not published'] : !published.acceptingApplications ? ['warning', 'Paused'] : Date.parse(published.effectiveFrom) > Date.now() ? ['warning', 'Starts ' + showDay(published.effectiveFrom)] : ['success', 'Live'];
  const write = (path, body, method) => authenticatedWrite('/admin/franchise-policy' + path, body, method);
  const run = async publish => {
    setError(''); setMessage('');
    if (issues.length) { setError(issues.join(' ')); return; }
    setBusy(true);
    try {
      let current = record;
      if (dirty || publish) current = await write('', { expectedRevision: record.revision, reason, policy: toPolicy(form, record.draft, published) }, 'PATCH');
      if (publish) current = await write('/publish', { expectedRevision: current.revision, reason }, 'POST');
      setReason(''); setMessage(publish ? 'Franchise rules published. Applications already accepted keep the terms they agreed to.' : 'Draft saved. Applicants still see the published rules until you publish.');
      await onChanged(current);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const docs = form.documents, setDocs = documents => change({ documents });
  const feeFields = (kind, title, switchLabel) => <fieldset className="space-y-3 rounded-xl border border-[#e1e7f0] p-3"><legend className="font-semibold text-sm px-1">{title}</legend>
    <Toggle checked={form[kind].enabled} onChange={enabled => change({ [kind]: { ...form[kind], enabled } })}>{switchLabel}</Toggle>
    {form[kind].enabled && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AdminField help="" className="block">{title} (₹)<AdminInput aria-label={title + ' in rupees'} type="number" min="1" step="0.01" value={form[kind].rupees} onChange={e => change({ [kind]: { ...form[kind], rupees: e.target.value } })} /></AdminField>
      {kind === 'renewal' && <AdminField help="" className="block">Renew every (months)<AdminInput aria-label="Renew every (months)" type="number" min="1" max="120" value={form.renewal.months} onChange={e => change({ renewal: { ...form.renewal, months: e.target.value } })} /></AdminField>}
    </div>}
  </fieldset>;

  return <form noValidate onSubmit={e => { e.preventDefault(); run(false); }} className="space-y-5" aria-label="Franchise rules">
    <Notice tone={tone === 'success' ? 'success' : 'warning'}>
      <div className="flex flex-wrap items-center gap-2"><Status tone={tone}>{label}</Status><span>{!published ? 'Franchise applications are closed until you publish these rules.' : !published.acceptingApplications ? 'The rules are published, but new applications are paused.' : 'Institutions can apply under the published rules' + (published.effectiveFrom ? ' (since ' + showDay(published.effectiveFrom) + ')' : '') + '.'}</span></div>
      {pending && published && <p className="mt-1">You have changes that are not published yet. Applicants still see the published rules.</p>}
    </Notice>
    {locked && <p className="text-sm">Only the main administrator can change franchise rules.</p>}
    <fieldset disabled={locked || busy} className="space-y-5">
      <AdminCard title="Applications" bodyClassName="space-y-2">
        <Toggle checked={form.accepting} onChange={accepting => change({ accepting })} help="Universities, colleges, schools and institutes can apply, as a new institution or an existing listed college.">Accept new franchise applications</Toggle>
      </AdminCard>
      <AdminCard title="Documents applicants upload" bodyClassName="space-y-3">
        {!docs.length && <p className="text-sm text-[#53647c]">No documents are requested.</p>}
        {docs.map((d, i) => <div key={i} className="flex flex-wrap items-end gap-2">
          <AdminField help="" className="block flex-1 min-w-48">Document {i + 1} name<AdminInput aria-label={'Franchise document ' + (i + 1) + ' name'} maxLength={100} value={d.label} onChange={e => setDocs(docs.map((v, n) => n === i ? { ...v, label: e.target.value } : v))} /></AdminField>
          <label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" checked={d.required} onChange={e => setDocs(docs.map((v, n) => n === i ? { ...v, required: e.target.checked } : v))} />Required</label>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDocs(docs.filter((_, n) => n !== i))}>Remove</button>
        </div>)}
        <button type="button" className="admin-btn admin-btn-secondary" disabled={docs.length >= 10} onClick={() => setDocs([...docs, { label: '', required: true }])}>Add document</button>
        <p className="text-xs text-[#53647c]">Applicants can upload PDF, PNG or JPEG files up to 10 MB.</p>
      </AdminCard>
      <AdminCard title="Fees" bodyClassName="space-y-3">
        {feeFields('joining', 'Joining fee', 'Charge a joining fee')}{feeFields('renewal', 'Renewal fee', 'Require periodic renewal')}
        <p className="text-xs text-[#53647c]">Institutions pay after KITSS approves them; nothing is charged automatically. Renewal reminders go out 14 days before the due date, and a franchise that is not renewed is suspended. An expired franchise never affects student access.</p>
      </AdminCard>
      <AdminCard title="Agreement" bodyClassName="space-y-3">
        <AdminField help="Applicants must accept this. Changing it creates a new agreement version automatically." className="block">Franchise agreement<AdminTextarea aria-label="Franchise agreement" rows={6} maxLength={20000} value={form.agreement} onChange={e => change({ agreement: e.target.value })} /></AdminField>
      </AdminCard>
      {issues.length > 0 && <ul className="text-sm text-red-700 list-disc pl-5">{issues.map(i => <li key={i}>{i}</li>)}</ul>}
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}{message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
      {!locked && <SaveBar reason={reason} setReason={setReason} label="Save draft" busy={busy} disabled={!dirty} dirty={dirty} history={record.history}
        extra={<button type="button" className="admin-btn admin-btn-accent" disabled={busy || !pending || !reason.trim()} onClick={() => run(true)}>Publish changes</button>} />}
    </fieldset>
  </form>;
}
