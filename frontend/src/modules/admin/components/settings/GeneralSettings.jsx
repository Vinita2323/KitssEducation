import React, { useEffect, useState } from 'react';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '../AdminFields';
import { AdminCard } from '../AdminUI';
import { httpClient } from '../../../../shared/api/httpClient';
import { authenticatedWrite } from '../../../user/services/authService';
import { same } from './settingsFormat';

// Internal pages a footer link may open; mirrors the server's approved route list.
const pages = [['/home', 'Home'], ['/about', 'About'], ['/categories', 'Categories'], ['/colleges', 'Colleges'], ['/books', 'Books'], ['/coaching', 'Coaching'], ['/results', 'Results']];
const groups = [
  ['support', 'Contact details', 'Shown to visitors who need help.', [['email', 'Support email', 'email'], ['phone', 'Support phone', 'tel'], ['address', 'Office address'], ['hours', 'Support hours']]],
  ['footer', 'Footer', 'Shown at the bottom of every public page. The copyright line is added automatically.', [['description', 'Footer description', 'textarea']]],
];

function FooterLinks({ links, onChange }) {
  const update = (index, fields) => onChange(links.map((link, i) => i === index ? { ...link, ...fields } : link));
  return <fieldset className="space-y-2"><legend className="font-semibold text-sm">Footer links</legend>
    {!links.length && <p className="text-sm text-[#53647c]">No footer links.</p>}
    {links.map((link, i) => <div key={i} className="grid grid-cols-1 sm:grid-cols-[11rem_1fr_auto] gap-2 items-end rounded-xl border border-[#e1e7f0] p-2">
      <AdminField help="">Link {i + 1} opens<AdminSelect aria-label={'Footer link ' + (i + 1) + ' type'} value={link.type} onChange={e => update(i, { type: e.target.value, target: e.target.value === 'internal' ? '/about' : 'https://' })}><option value="internal">A page on this site</option><option value="external">Another website</option></AdminSelect></AdminField>
      {link.type === 'internal'
        ? <AdminField help="">Page<AdminSelect aria-label={'Footer link ' + (i + 1) + ' page'} value={link.target} onChange={e => update(i, { target: e.target.value })}>{!pages.some(([path]) => path === link.target) && <option value={link.target}>{link.target}</option>}{pages.map(([path, name]) => <option key={path} value={path}>{name}</option>)}</AdminSelect></AdminField>
        : <AdminField help="">Website address<AdminInput aria-label={'Footer link ' + (i + 1) + ' address'} type="url" placeholder="https://example.com" value={link.target} onChange={e => update(i, { target: e.target.value })} /></AdminField>}
      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onChange(links.filter((_, n) => n !== i))}>Remove</button>
    </div>)}
    <button type="button" className="admin-btn admin-btn-secondary" disabled={links.length >= 10} onClick={() => onChange([...links, { type: 'internal', target: '/about' }])}>Add footer link</button>
    <p className="text-xs text-[#53647c]">Up to 10 links. Other websites must start with https://.</p>
  </fieldset>;
}

function Group({ group, title, intro, fields, row, canWrite, onSaved }) {
  const saved = row?.value ?? {}, [form, setForm] = useState(saved), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  useEffect(() => { setForm(row?.value ?? {}); }, [row]);
  const dirty = !same(form, saved);
  const save = async e => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    // Only fields shown here are saved; retired ones, such as an old copyright line, are cleared.
    const shown = [...fields.map(([key]) => key), ...(group === 'footer' ? ['links'] : [])];
    const value = Object.fromEntries(shown.filter(k => form[k] !== undefined && (k === 'links' || form[k].trim() !== '' || saved[k] !== undefined)).map(k => [k, k === 'links' ? form[k] : form[k].trim()]));
    try { onSaved(group, await authenticatedWrite('/admin/settings/' + group, { value, expectedRevision: row?.revision ?? 0 }, 'PATCH')); setMessage(title + ' saved.'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <AdminCard title={title}><form onSubmit={save} className="space-y-3" aria-label={title + ' settings'}><p className="text-sm text-[#53647c]">{intro}</p>
    <fieldset disabled={busy || !canWrite} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{fields.map(([key, label, type]) => <AdminField key={key} help="" className={type === 'textarea' ? 'block md:col-span-2' : 'block'}>{label}{type === 'textarea'
        ? <AdminTextarea aria-label={label} rows={3} maxLength={1000} value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        : <AdminInput aria-label={label} type={type ?? 'text'} maxLength={1000} value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />}</AdminField>)}</div>
      {group === 'footer' && <FooterLinks links={form.links ?? []} onChange={links => setForm(f => ({ ...f, links }))} />}
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}{message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
      <div className="flex items-center gap-3"><button className="admin-btn admin-btn-primary" disabled={busy || !dirty}>Save {title.toLowerCase()}</button>{dirty && <span className="text-sm text-amber-800">Unsaved changes</span>}</div>
    </fieldset></form></AdminCard>;
}

export function GeneralSettings({ canWrite }) {
  const [rows, setRows] = useState(null), [error, setError] = useState('');
  useEffect(() => { const c = new AbortController(); httpClient.request('/admin/settings', { signal: c.signal }).then(r => { if (!c.signal.aborted) setRows(r.data); }).catch(e => { if (!c.signal.aborted) setError(e.message); }); return () => c.abort(); }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!rows) return <p role="status">Loading settings…</p>;
  return <div className="space-y-5">
    {!canWrite && <p className="text-sm">You can view these settings. Saving needs the settings permission.</p>}
    {groups.map(([group, title, intro, fields]) => <Group key={group} group={group} title={title} intro={intro} fields={fields} row={rows[group]} canWrite={canWrite} onSaved={(key, row) => setRows(r => ({ ...r, [key]: row }))} />)}
  </div>;
}
