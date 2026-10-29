import { fieldLabel } from '../../../shared/ui/displayText';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '../components/AdminFields';
import { useEditorFocus } from '../components/useAdminAccessibility';
import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { MediaPicker } from '../components/MediaPicker';
import { Pagination } from '../../user/components/common/Pagination';
const paths = {
  issuers: '/admin/result-issuers',
  exams: '/admin/exams',
  records: '/admin/results/records'
};
export function AdminResultsPage() {
  const {
    can, user
  } = useAuth();
  const [tab, setTab] = useState('issuers'),
    [rows, setRows] = useState([]),
    [meta, setMeta] = useState(null),
    [page, setPage] = useState(1), [reviewStatus, setReviewStatus] = useState('');
  const [form, setForm] = useState(null),
    [values, setValues] = useState({}),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState(null);
  const [examId, setExamId] = useState(''),
    [assetId, setAssetId] = useState(null),
    [importKey, setImportKey] = useState(() => crypto.randomUUID()),
    [dryRun, setDryRun] = useState(null);
  const [correction, setCorrection] = useState(''),
    [reason, setReason] = useState(''),
    [source, setSource] = useState('');
  const refresh = async () => {
    const r = await httpClient.request(paths[tab] + '?page=' + page + (tab === 'records' && reviewStatus ? '&reviewStatus=' + reviewStatus : ''));
    setRows(r.data);
    setMeta(r.meta);
  };
  useEffect(() => {
    const c = new AbortController();
    setError('');
    setRows([]);
    httpClient.request(paths[tab] + '?page=' + page + (tab === 'records' && reviewStatus ? '&reviewStatus=' + reviewStatus : ''), {
      signal: c.signal
    }).then(r => {
      if (!c.signal.aborted) {
        setRows(r.data);
        setMeta(r.meta);
      }
    }).catch(e => {
      if (!c.signal.aborted) setError(e.message);
    });
    return () => c.abort();
  }, [tab, page, reviewStatus]);
  const run = async work => {
    setBusy(true);
    setError('');
    try {
      await work();
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const edit = row => {
    setDetail(null);
    setForm(row ?? {});
    setValues(tab === 'issuers' ? {
      key: row?.key ?? '',
      name: row?.name ?? '',
      fullName: row?.fullName ?? '',
      type: row?.type ?? 'school',
      status: row?.status ?? 'draft',
      fieldSchema: JSON.stringify(row?.fieldSchema ?? [], null, 2),
      source: JSON.stringify(row?.source ?? {
        description: '',
        authorizationReference: ''
      }, null, 2)
    } : {
      issuerId: row?.issuerId ?? '',
      key: row?.key ?? '',
      title: row?.title ?? '',
      year: row?.year ?? '',
      session: row?.session ?? '',
      status: row?.status ?? 'draft'
    });
  };
  const save = e => {
    e.preventDefault();
    run(async () => {
      const data = {
        ...values
      };
      if (tab === 'issuers') {
        data.fieldSchema = JSON.parse(data.fieldSchema);
        data.source = JSON.parse(data.source);
      } else data.year = Number(data.year);
      if (form.id) data.expectedRevision = form.revision;
      await authenticatedWrite(paths[tab] + (form.id ? '/' + form.id : ''), data, form.id ? 'PATCH' : 'POST');
      setForm(null);
    });
  };
  const importRows = commit => run(async () => {
    const result = await authenticatedWrite('/admin/results/imports', {
      examId,
      assetId,
      mappingVersion: 'kitss-results-v1',
      idempotencyKey: importKey,
      dryRun: !commit,
      ...(commit ? {
        validationToken: dryRun.validationToken
      } : {})
    });
    setDryRun(result);
  });
  const inspect = row => run(async () => {
    const result = (await httpClient.request(paths[tab] + '/' + row.id)).data;
    setDetail(result);
    setForm(null);
    setCorrection('');
    setReason('');
    setSource('');
  });
  const action = (name, row) => run(async () => {
    const input = {
      expectedRevision: row.expectedRevision,
      ...(name === 'publish' ? {} : {
        reason
      }),
      ...(name === 'corrections' ? {
        correctedFields: JSON.parse(correction),
        source
      } : {})
    };
    const result = await authenticatedWrite('/admin/results/records/' + row.id + '/' + name, input);
    setDetail(result);
  });
  const inlineEditor=useEditorFocus(Boolean(form));
  return <div className="space-y-4 min-w-0"><h1 className="text-xl font-bold text-[#0A1D3F]">Academic results</h1><p className="p-3 border rounded-xl bg-amber-50 text-sm">Official publication is disabled until trusted source authorization is separately approved. Source references entered here do not enable publication.</p>
    {error && <p role="alert" className="p-3 bg-red-50 border rounded-xl">{error}</p>}
    <div className="flex flex-wrap gap-2">{Object.keys(paths).map(t => <button aria-pressed={tab === t} key={t} disabled={busy} onClick={() => {
        setTab(t);
        setPage(1);
        setForm(null);
        setDetail(null);
      }} className={'border p-2 rounded-xl ' + (tab === t ? 'bg-[#0A1D3F] text-white' : 'bg-white')}>{t}</button>)}{tab !== 'records' && can('results.manage') && <button disabled={busy} onClick={() => edit(null)} className="bg-[#0A1D3F] text-white p-2 rounded-xl">Add {tab === 'issuers' ? 'issuer' : 'exam'}</button>}</div>
    {tab === 'records' && <AdminField className="block">Review queue<AdminSelect aria-label="Result review status" className="block border p-2 rounded-xl w-full" value={reviewStatus} onChange={e => { setReviewStatus(e.target.value); setPage(1); }}><option value="">All records</option>{['draft','submitted','approved','rejected'].map(s => <option key={s}>{s}</option>)}</AdminSelect></AdminField>}
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead><tr><th className="p-3 text-left">Record</th><th>Status</th><th>Revision</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr className="border-t" key={row.id}><td className="p-3 break-words">{row.name ?? row.title ?? row.rollNormalized}<p className="text-xs">{row.id}</p></td><td>{row.status}</td><td>{row.revision}</td><td><div className="flex flex-wrap gap-2 p-2"><button disabled={busy} onClick={() => inspect(row)}>Review</button>{tab !== 'records' && can('results.manage') && <><button disabled={busy} onClick={() => edit(row)}>Edit</button><button disabled={busy} onClick={() => window.confirm('Archive this configuration?') && run(() => authenticatedWrite(paths[tab] + '/' + row.id, {
                    expectedRevision: row.revision
                  }, 'DELETE'))}>Archive</button></>}</div></td></tr>)}</tbody></table>{!rows.length && <p className="p-4 text-sm">No records.</p>}</div>
    <Pagination meta={meta} onChange={setPage} loading={busy} />
    {form && <form onSubmit={save} ref={inlineEditor} aria-label="Result definition editor" className="p-4 bg-white rounded-xl border space-y-3"><h2 className="font-bold">{form.id ? 'Edit' : 'Add'} {tab === 'issuers' ? 'issuer' : 'exam'}</h2>{Object.keys(values).map(k => <AdminField className="block text-sm" key={k}>{fieldLabel(k)}{['fieldSchema', 'source'].includes(k) ? <AdminTextarea aria-label={k} rows={5} value={values[k]} onChange={e => setValues(p => ({
          ...p,
          [k]: e.target.value
        }))} className="block w-full border rounded-xl p-2 font-mono text-xs" /> : ['status', 'type'].includes(k) ? <AdminSelect aria-label={k} value={values[k]} onChange={e => setValues(p => ({
          ...p,
          [k]: e.target.value
        }))} className="block w-full border p-2 rounded-xl">{(k === 'type' ? ['school', 'university', 'institute'] : tab === 'issuers' ? ['draft', 'active', 'inactive'] : ['draft', 'published', 'withdrawn']).map(v => <option key={v}>{v}</option>)}</AdminSelect> : <AdminInput aria-label={k} required value={values[k]} type={k === 'year' ? 'number' : 'text'} onChange={e => setValues(p => ({
          ...p,
          [k]: e.target.value
        }))} className="block w-full border p-2 rounded-xl" />}</AdminField>)}<p className="text-xs">For verification questions, enter a JSON list with id, label, type (text/date) and required. For source details, include the description and authorizationReference.</p><button disabled={busy} className="p-3 rounded-xl bg-[#0A1D3F] text-white">Save configuration</button><button type="button" onClick={() => setForm(null)} className="p-3">Cancel</button></form>}
    {tab === 'records' && can('results.manage') && <section className="bg-white border rounded-xl p-4 space-y-3"><h2 className="font-bold">Import result drafts</h2><p className="text-xs">Upload a results JSON file in kitss-results-v1 format, with up to 200 records and a 2 MB limit. Check the file before importing. Each record needs a verified student account reference, marks, totals and an authorized source reference.</p><AdminField className="block text-sm">Exam ID<AdminInput aria-label="Import exam ID" value={examId} onChange={e => {
          setExamId(e.target.value);
          setDryRun(null);
          setImportKey(crypto.randomUUID());
        }} className="block border p-2 rounded-xl w-full" /></AdminField><MediaPicker purpose="result_import" label="Result import JSON" value={assetId} onChange={v => {
        setAssetId(v);
        setDryRun(null);
        setImportKey(crypto.randomUUID());
      }} /><button disabled={busy || !assetId || !examId} onClick={() => importRows(false)} className="border p-2 rounded-xl">Validate import</button><button disabled={busy || !dryRun?.validationToken} onClick={() => importRows(true)} className="border p-2 rounded-xl ml-2">Import validated drafts</button>{dryRun && <pre role="status" className="overflow-auto text-xs p-2">{JSON.stringify(dryRun, null, 2)}</pre>}</section>}
    {detail && <section className="bg-white border p-4 rounded-xl space-y-3"><h2 className="font-bold">Review record and audit history</h2><pre className="text-xs overflow-auto max-h-96">{JSON.stringify(detail, null, 2)}</pre>{tab === 'records' && <><AdminField className="block text-sm">Reason<AdminInput aria-label="Result action reason" value={reason} onChange={e => setReason(e.target.value)} className="block w-full border rounded-xl p-2" /></AdminField>{can('results.manage') && <button disabled={busy || !reason || detail.status !== 'draft' || !['draft','rejected'].includes(detail.review?.status ?? 'draft')} onClick={() => action('submit', detail)} className="border rounded-xl p-2">Submit for main-admin review</button>}{user?.roles.includes('super_admin') && detail.review?.status === 'submitted' && <>{['approve','reject'].map(a => <button key={a} disabled={busy || !reason} onClick={() => action(a, detail)} className="border rounded-xl p-2">{a === 'approve' ? 'Approve official result revision' : 'Reject result with reason'}</button>)}</>}{can('results.publish') && user?.roles.includes('super_admin') && <><button disabled={busy} onClick={() => action('publish', detail)} className="border rounded-xl p-2">Request publication</button><button disabled={busy || !reason} onClick={() => window.confirm('Withdraw this result?') && action('withdraw', detail)} className="border rounded-xl p-2">Withdraw result</button></>}{can('results.manage') && <><AdminField className="block text-sm">Correction source reference<AdminInput value={source} onChange={e => setSource(e.target.value)} className="w-full border p-2 rounded-xl" /></AdminField><AdminField className="block text-sm">Complete corrected row (kitss-results-v1 JSON)<AdminTextarea aria-label="Corrected result JSON" rows={8} value={correction} onChange={e => setCorrection(e.target.value)} className="block w-full border p-2 rounded-xl font-mono text-xs" /></AdminField><button disabled={busy || !reason || !source || !correction} onClick={() => action('corrections', detail)} className="border rounded-xl p-2">Create correction draft</button></>}</>}</section>}
  </div>;
}
