import React, { useEffect, useState } from 'react';
import { AdminField, AdminInput, AdminSelect } from '../AdminFields';
import { AdminCard } from '../AdminUI';
import { toRupees, toPaise, rupeeText, showDay, same, withKeys } from './settingsFormat';
import { guardianConsent } from './standardTerms';
import { SaveBar, Status, Toggle } from './SettingsParts';

export const registrationKinds = [['study', 'Study registration'], ['tuition', 'Tuition & coaching centre'], ['teacher', 'Teacher / professor'], ['coaching-profile', 'Coaching profile']];
const fresh = { status: 'draft', enabled: false, feeRequired: false, amountMinor: 0, currency: 'INR', documents: [], privacyApproved: false, documentsApproved: false };
const keyPattern = /^[a-z][a-zA-Z0-9_-]{0,49}$/;

// "Open" is the single switch admins see; the server still records each underlying approval.
export const isOpen = p => Boolean(p && p.enabled !== false && p.status === 'active' && p.privacyApproved && p.documentsApproved);
export function availability(p) {
  if (!p) return ['neutral', 'Closed · not set up'];
  if (!isOpen(p)) return ['neutral', 'Closed'];
  if (p.effectiveFrom && Date.parse(p.effectiveFrom) > Date.now()) return ['warning', 'Opens ' + showDay(p.effectiveFrom)];
  if (p.effectiveTo && Date.parse(p.effectiveTo) <= Date.now()) return ['neutral', 'Closed ' + showDay(p.effectiveTo)];
  return ['success', 'Open'];
}

const toForm = p => ({ open: isOpen(p), feeRequired: Boolean(p?.feeRequired), rupees: p?.amountMinor ? toRupees(p.amountMinor) : '', documents: (p?.documents ?? []).map(d => ({ key: d.key, label: d.label, required: d.required !== false })) });
// Upload limits, dates and retention use the standard defaults; optional guardian consent uses the standard wording.
function toPolicy(form, saved) {
  const { effectiveFrom, effectiveTo, retentionDays, upload, ...kept } = { ...fresh, ...saved };
  const documents = withKeys(form.documents.map(d => ({ ...d, label: d.label.trim() })), keyPattern).map(d => ({ key: d.key, label: d.label, ...(d.required ? {} : { required: false }) }));
  return { ...kept, ...(form.open ? { enabled: true, status: 'active', privacyApproved: true, documentsApproved: true } : { enabled: false }),
    feeRequired: form.feeRequired, amountMinor: form.feeRequired ? toPaise(form.rupees) : 0, documents, guardian: guardianConsent };
}
function problems(form) {
  const issues = [];
  if (form.feeRequired && !(toPaise(form.rupees) > 0)) issues.push('Enter the fee in rupees, or choose Free.');
  if (form.documents.some(d => !d.label.trim())) issues.push('Give every document a name, or remove it.');
  return issues;
}

function KindCard({ title, saved, form, setForm, locked }) {
  const update = fields => setForm({ ...form, ...fields }), docs = form.documents, setDocs = documents => update({ documents });
  const [tone, label] = availability(saved), issues = problems(form);
  return <AdminCard title={title} actions={<Status tone={tone}>{label}</Status>} aria-label={title + ' rules'}>
    <fieldset disabled={locked} className="space-y-4">
      <Toggle checked={form.open} onChange={open => update({ open })} help={form.open ? 'Applicants can submit once you save. Opening confirms you have reviewed the fee and documents.' : 'Applicants cannot submit this registration.'}>Open for applications</Toggle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <AdminField help="" className="block">Registration fee<AdminSelect aria-label={title + ' fee type'} value={form.feeRequired ? 'paid' : 'free'} onChange={e => update({ feeRequired: e.target.value === 'paid' })}><option value="free">Free</option><option value="paid">Paid</option></AdminSelect></AdminField>
        {form.feeRequired && <AdminField help="" className="block">Fee amount (₹)<AdminInput aria-label={title + ' fee in rupees'} type="number" min="1" step="0.01" value={form.rupees} onChange={e => update({ rupees: e.target.value })} /></AdminField>}
      </div>
      <fieldset className="space-y-2"><legend className="font-semibold text-sm">Documents applicants upload</legend>
        {!docs.length && <p className="text-sm text-[#53647c]">No documents are requested.</p>}
        {docs.map((d, i) => <div key={i} className="flex flex-wrap items-end gap-2">
          <AdminField help="" className="block flex-1 min-w-48">Document {i + 1} name<AdminInput aria-label={title + ' document ' + (i + 1) + ' name'} maxLength={100} value={d.label} onChange={e => setDocs(docs.map((v, n) => n === i ? { ...v, label: e.target.value } : v))} /></AdminField>
          <label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" checked={d.required} onChange={e => setDocs(docs.map((v, n) => n === i ? { ...v, required: e.target.checked } : v))} />Required</label>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDocs(docs.filter((_, n) => n !== i))}>Remove</button>
        </div>)}
        <button type="button" className="admin-btn admin-btn-secondary" disabled={docs.length >= 10} onClick={() => setDocs([...docs, { label: '', required: true }])}>Add document</button>
        {docs.length > 0 && <p className="text-xs text-[#53647c]">Applicants can upload PDF, PNG or JPEG files up to 10 MB.</p>}
      </fieldset>
      {issues.length > 0 && <ul className="text-sm text-red-700 list-disc pl-5">{issues.map(i => <li key={i}>{i}</li>)}</ul>}
      {saved && <p className="text-xs text-[#53647c]">{saved.feeRequired ? 'Saved fee: ' + rupeeText(saved.amountMinor ?? 0) : 'Saved fee: Free'} · {saved.documents?.length ? saved.documents.length + ' document(s)' : 'No documents'}</p>}
    </fieldset>
  </AdminCard>;
}

export function RegistrationSettings({ record, locked, save }) {
  const saved = record.value.registrations ?? {};
  const initial = () => Object.fromEntries(registrationKinds.map(([kind]) => [kind, toForm(saved[kind])]));
  const [forms, setForms] = useState(initial), [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  // Other tabs share this record's revision; only changed registration rules reset the cards.
  const savedRules = JSON.stringify(saved);
  useEffect(() => { setForms(initial()); }, [savedRules]);
  const changed = registrationKinds.map(([kind]) => kind).filter(kind => !same(toForm(saved[kind]), forms[kind]));
  const submit = async e => {
    e.preventDefault(); setError(''); setMessage('');
    const blocking = changed.flatMap(kind => problems(forms[kind]).map(p => registrationKinds.find(([k]) => k === kind)[1] + ': ' + p));
    if (blocking.length) { setError(blocking.join(' ')); return; }
    setBusy(true);
    try { await save({ registrations: { ...saved, ...Object.fromEntries(changed.map(kind => [kind, toPolicy(forms[kind], saved[kind])])) } }, reason); setReason(''); setMessage('Registration rules saved. Applications already submitted keep their original terms.'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <form noValidate onSubmit={submit} className="space-y-5" aria-label="Registration rules">
    <p className="text-sm text-[#53647c]">Choose which registrations are open, what they cost and which documents applicants upload. Applicants sign in with a verified account, applicants under 18 may add a parent or guardian's consent, and staff review every application.</p>
    {locked && <p className="text-sm">Only the main administrator can change these rules.</p>}
    {registrationKinds.map(([kind, title]) => <KindCard key={kind} title={title} saved={saved[kind]} form={forms[kind]} locked={locked || busy} setForm={value => setForms(f => ({ ...f, [kind]: value }))} />)}
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}{message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
    {!locked && <SaveBar reason={reason} setReason={setReason} label="Save registration rules" busy={busy} disabled={!changed.length} dirty={changed.length > 0} history={record.history} />}
  </form>;
}
