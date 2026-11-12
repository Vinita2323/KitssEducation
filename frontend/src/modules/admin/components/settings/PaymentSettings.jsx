import React, { useEffect, useState } from 'react';
import { AdminField, AdminInput, AdminTextarea } from '../AdminFields';
import { AdminCard } from '../AdminUI';
import { same, showDay, versionName } from './settingsFormat';
import { accessExceptionNote, refundFixed, refundReasons } from './standardTerms';
import { SaveBar, Status, Toggle } from './SettingsParts';

const categories = [['course_plan', 'Course plans'], ['book', 'Books'], ['registration_fee', 'Registration fees']];
const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// The few choices admins make; everything else uses the standard rules in standardTerms.js.
const toForm = value => {
  const r = value.refunds, i = value.invoice ?? {}, a = value.manualAccess ?? {};
  return { refunds: Boolean(r?.approved && r.enabled), windowDays: r?.courseWindowDays ?? 7, refundable: Object.fromEntries(categories.map(([kind]) => [kind, Boolean(r?.categories?.[kind]?.enabled)])),
    sellerName: i.sellerName ?? '', sellerAddress: i.sellerAddress ?? '', gstin: i.gstin ?? '', grants: Boolean(a.approved), revocations: Boolean(a.paidRevocationApproved) };
};
function refundPolicy(form, saved) {
  const p = { ...refundFixed, approved: form.refunds, enabled: form.refunds, courseWindowDays: Number(form.windowDays),
    categories: Object.fromEntries(categories.map(([kind]) => [kind, { enabled: form.refundable[kind], reasons: refundReasons }])) };
  if (!form.refunds) return p;
  // A version name and start date are required while refunds are accepted; reuse them unless the rules changed.
  const unchanged = saved?.approved && saved.enabled && saved.version && saved.effectiveFrom && same({ ...saved, version: undefined, effectiveFrom: undefined }, { ...p, version: undefined, effectiveFrom: undefined });
  return { ...p, version: unchanged ? saved.version : versionName('refund-policy'), effectiveFrom: saved?.enabled && saved.effectiveFrom && Date.parse(saved.effectiveFrom) <= Date.now() ? saved.effectiveFrom : new Date().toISOString() };
}
const invoicePolicy = form => ({ sellerName: form.sellerName.trim(), sellerAddress: form.sellerAddress.trim(), ...(form.gstin.trim() ? { gstin: form.gstin.trim(), taxRegistrationStatus: 'registered' } : { taxRegistrationStatus: 'undecided' }) });
function problems(form) {
  const issues = [];
  if (form.refunds && !(Number.isInteger(Number(form.windowDays)) && Number(form.windowDays) >= 0 && Number(form.windowDays) <= 3650)) issues.push('The refund window must be a whole number of days.');
  if (form.gstin.trim() && !gstinPattern.test(form.gstin.trim())) issues.push('GSTIN must be 15 characters, like 22AAAAA0000A1Z5.');
  return issues;
}

export function PaymentSettings({ record, locked, save }) {
  const [form, setForm] = useState(() => toForm(record.value)), [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  // Other tabs share this record's revision; only changed payment settings reset the form.
  const savedJson = JSON.stringify(toForm(record.value));
  useEffect(() => { setForm(toForm(record.value)); }, [savedJson]);
  const update = fields => setForm(f => ({ ...f, ...fields }));
  const dirty = savedJson !== JSON.stringify(form), issues = problems(form), r = record.value.refunds;
  const live = Boolean(r?.approved && r.enabled && Date.parse(r.effectiveFrom) <= Date.now());
  const submit = async e => {
    e.preventDefault(); setError(''); setMessage('');
    if (issues.length) { setError(issues.join(' ')); return; }
    setBusy(true);
    try {
      await save({ refunds: refundPolicy(form, r), invoice: invoicePolicy(form), manualAccess: { approved: form.grants, paidRevocationApproved: form.revocations, description: accessExceptionNote } }, reason);
      setReason(''); setMessage('Payment and billing settings saved.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <form noValidate onSubmit={submit} className="space-y-5" aria-label="Payments and billing">
    {locked && <p className="text-sm">Only the main administrator can change these settings.</p>}
    <fieldset disabled={locked || busy} className="space-y-5">
      <AdminCard title="Refund requests" actions={<Status tone={live ? 'success' : 'neutral'}>{live ? 'Accepting requests since ' + showDay(r.effectiveFrom) : 'Not accepting requests'}</Status>} bodyClassName="space-y-4">
        <Toggle checked={form.refunds} onChange={refunds => update({ refunds })} help="Students can ask for a refund. Staff review each request; approving one never sends money automatically.">Accept refund requests</Toggle>
        {form.refunds && <>
          <AdminField help="Counted from the day payment is confirmed. Requests after this are not accepted." className="block max-w-xs">Course refund window (days)<AdminInput aria-label="Course refund window (days)" type="number" min="0" max="3650" value={form.windowDays} onChange={e => update({ windowDays: e.target.value })} /></AdminField>
          <fieldset><legend className="font-semibold text-sm">What can be refunded</legend><div className="flex flex-wrap gap-4 pt-2 text-sm">{categories.map(([kind, label]) => <label key={kind} className="flex items-center gap-2"><input type="checkbox" checked={form.refundable[kind]} onChange={e => update({ refundable: { ...form.refundable, [kind]: e.target.checked } })} />{label}</label>)}</div>
            <p className="text-xs text-[#53647c] mt-2">Students choose a reason: charged twice, technical problem, or content could not be opened. After a refund, staff review the student's access separately.</p></fieldset>
        </>}
      </AdminCard>

      <AdminCard title="Receipt details" bodyClassName="space-y-3">
        <p className="text-sm text-[#53647c]">Shown as the seller on payment receipts. Adding a GSTIN does not turn on tax charging or official GST invoices.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AdminField help="" className="block">Business name<AdminInput aria-label="Business name" maxLength={2000} value={form.sellerName} onChange={e => update({ sellerName: e.target.value })} /></AdminField>
          <AdminField help="Leave blank if not registered for GST." className="block">GSTIN (optional)<AdminInput aria-label="GSTIN" maxLength={15} value={form.gstin} onChange={e => update({ gstin: e.target.value.toUpperCase() })} /></AdminField>
          <AdminField help="" className="block sm:col-span-2">Business address<AdminTextarea aria-label="Business address" rows={2} maxLength={2000} value={form.sellerAddress} onChange={e => update({ sellerAddress: e.target.value })} /></AdminField>
        </div>
      </AdminCard>

      <AdminCard title="Access exceptions" bodyClassName="space-y-3">
        <p className="text-sm text-[#53647c]">Controls what staff may do on the Enrollments and Access Requests pages. Each grant or revocation still needs its own reason.</p>
        <Toggle checked={form.grants} onChange={grants => update({ grants })}>Staff may grant free access in exceptional cases</Toggle>
        <Toggle checked={form.revocations} onChange={revocations => update({ revocations })}>Staff may revoke access a student paid for</Toggle>
      </AdminCard>

      {issues.length > 0 && <ul className="text-sm text-red-700 list-disc pl-5">{issues.map(i => <li key={i}>{i}</li>)}</ul>}
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}{message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
      {!locked && <SaveBar reason={reason} setReason={setReason} label="Save payment settings" busy={busy} disabled={!dirty} dirty={dirty} history={record.history} />}
    </fieldset>
  </form>;
}
