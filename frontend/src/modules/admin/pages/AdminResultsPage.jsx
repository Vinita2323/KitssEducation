import React, { useEffect, useRef, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { readOptions } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { MediaPicker } from '../components/MediaPicker';
import { Pagination } from '../../user/components/common/Pagination';
import { ResultDefinitionEditor } from '../components/ResultDefinitionEditor';
import { ResultEntryEditor } from '../components/ResultEntryEditor';
import { ArrowRight, CheckCircle2, FileText, Search, UploadCloud, X } from 'lucide-react';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import { AdminEmpty, AdminPageHeader, AdminStatus, AdminTable } from '../components/AdminUI';
import { useDebouncedValue } from '../../../shared/ui/useDebouncedValue';

const paths = { issuers: '/admin/result-issuers', exams: '/admin/exams', records: '/admin/results/records' };
const labels = { issuers: 'Result institutions', exams: 'Examinations', records: 'Student results' };
const button = 'admin-btn admin-btn-secondary admin-btn-sm';

function parseCsvLine(line) {
  const cells = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function parseSubjectsCell(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) return JSON.parse(text);
  return text.split(';').map(s => s.trim()).filter(Boolean).map(part => {
    const [code = '', name = '', max = '100', obtained = '0', grade = ''] = part.split(':').map(x => x.trim());
    return { code, name, maxMarks: Number(max), obtained: Number(obtained), ...(grade ? { grade } : {}) };
  });
}

function parseBulkRows(text, fileName, issuer) {
  if (fileName.toLowerCase().endsWith('.json') || text.trim().startsWith('[')) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('JSON file must contain an array of student rows.');
    return parsed;
  }
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must include a header row and at least one student row.');
  const headers = parseCsvLine(lines[0]);
  const schema = issuer?.fieldSchema || [];
  return lines.slice(1).map(line => {
    const vals = parseCsvLine(line);
    const cell = Object.fromEntries(headers.map((h, idx) => [h, vals[idx] ?? '']));
    const subjects = parseSubjectsCell(cell.subjects);
    const max = subjects.reduce((n, s) => n + (Number(s.maxMarks) || 0), 0);
    const obtained = subjects.reduce((n, s) => n + (Number(s.obtained) || 0), 0);
    const verificationFields = Object.fromEntries(schema.map(f => [f.id, cell['vf_' + f.id] ?? cell[f.id] ?? '']));
    return {
      rollNumber: cell.rollNumber || '',
      userPublicId: cell.userPublicId || '',
      student: {
        name: cell.studentName || cell.name || '',
        ...(cell.schoolName ? { schoolName: cell.schoolName } : {}),
        ...(cell.enrollmentNumber ? { enrollmentNumber: cell.enrollmentNumber } : {}),
      },
      subjects,
      totals: {
        max,
        obtained,
        percentage: max > 0 ? Math.round((obtained / max) * 10000) / 100 : 0,
        status: cell.status || 'PASS',
        ...(cell.grade ? { grade: cell.grade } : {}),
        ...(cell.sgpa !== '' && cell.sgpa !== undefined ? { sgpa: Number(cell.sgpa) } : {}),
        ...(cell.cgpa !== '' && cell.cgpa !== undefined ? { cgpa: Number(cell.cgpa) } : {}),
      },
      verificationFields,
      issueDate: cell.issueDate || '',
      externalId: cell.externalId || '',
    };
  });
}

export function AdminResultsPage() {
  const { can, user } = useAuth();
  const isSuperAdmin = Boolean(user?.roles?.includes('super_admin'));
  const canPublish = isSuperAdmin && can('results.publish');

  const [tab, setTab] = useState('issuers');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [reviewStatus, setReviewStatus] = useState('');
  const [issuerFilter, setIssuerFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const q = useDebouncedValue(searchInput.trim(), 250);

  const [selectedIds, setSelectedIds] = useState([]);
  const [batchReason, setBatchReason] = useState('');
  const [publishExamWithAction, setPublishExamWithAction] = useState(true);

  const [form, setForm] = useState(null);
  const [entry, setEntry] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');

  const [issuers, setIssuers] = useState([]);
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');

  // Direct CSV / JSON bulk import state (no media.write required)
  const [bulkRows, setBulkRows] = useState(null);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkCheck, setBulkCheck] = useState(null);
  const [bulkKey, setBulkKey] = useState(() => crypto.randomUUID());

  // Legacy media-based JSON import state
  const [assetId, setAssetId] = useState(null);
  const [dryRun, setDryRun] = useState(null);
  const [importKey, setImportKey] = useState(() => crypto.randomUUID());

  const alive = useRef(true);
  const identity = useRef(user?.id);
  const pendingKey = useRef(crypto.randomUUID());
  identity.current = user?.id;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const formDialog = useDialogFocus(Boolean(form), () => setForm(null));
  const detailDialog = useDialogFocus(Boolean(detail), () => setDetail(null));
  const entryDialog = useDialogFocus(Boolean(entry), () => setEntry(false));

  const buildQuery = () => {
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set('q', q);
    if (tab === 'exams' && issuerFilter) params.set('issuerId', issuerFilter);
    if (tab === 'records') {
      if (reviewStatus) params.set('reviewStatus', reviewStatus);
      if (examFilter) params.set('examId', examFilter);
    }
    return paths[tab] + '?' + params.toString();
  };

  const refresh = async () => {
    const r = await httpClient.request(buildQuery());
    if (alive.current) {
      setRows(r.data);
      setMeta(r.meta);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    const c = new AbortController();
    setError('');
    setRows([]);
    setSelectedIds([]);
    httpClient
      .request(buildQuery(), { signal: c.signal })
      .then(r => {
        if (!c.signal.aborted) {
          setRows(r.data);
          setMeta(r.meta);
        }
      })
      .catch(e => {
        if (!c.signal.aborted) setError(e.message);
      });
    if (tab === 'exams') {
      readOptions('/admin/result-issuers', {}, c.signal)
        .then(v => { if (!c.signal.aborted) setIssuers(v); })
        .catch(() => {});
    }
    if (tab === 'records') {
      readOptions('/admin/exams', {}, c.signal)
        .then(v => { if (!c.signal.aborted) setExams(v); })
        .catch(e => { if (!c.signal.aborted) setError(e.message); });
    }
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, reviewStatus, issuerFilter, examFilter, q]);

  const run = async work => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
      if (alive.current) await refresh();
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const inspect = row => run(async () => {
    setDetail((await httpClient.request(paths[tab] + '/' + row.id)).data);
    setForm(null);
    setEntry(false);
    setReason('');
    setPublishExamWithAction(true);
  });

  const saveDefinition = data => run(async () => {
    await authenticatedWrite(paths[tab] + (form.id ? '/' + form.id : ''), { ...data, ...(form.id ? { expectedRevision: form.revision } : {}) }, form.id ? 'PATCH' : 'POST');
    setForm(null);
    setMessage('Configuration saved.');
  });

  const publishExamRow = exam => run(async () => {
    await authenticatedWrite('/admin/exams/' + exam.id, { expectedRevision: exam.revision, status: 'published' }, 'PATCH');
    setMessage('Examination published. Results under it can now go live.');
  });

  const act = (action, extra = {}) => run(async () => {
    const payload = {
      expectedRevision: detail.expectedRevision,
      ...(reason.trim() ? { reason: reason.trim() } : action === 'reject' || action === 'withdraw' ? { reason } : {}),
      ...extra,
    };
    const result = await authenticatedWrite('/admin/results/records/' + detail.id + '/' + action, payload);
    setDetail((await httpClient.request(paths.records + '/' + result.id)).data);
    setReason('');
    setMessage(
      action === 'publish' || action === 'approve_and_publish'
        ? 'Result published to the student’s account.'
        : 'Result review updated.'
    );
  });

  const runBatch = action => run(async () => {
    if (!selectedIds.length) return;
    const res = await authenticatedWrite('/admin/results/records/batch-action', {
      ids: selectedIds,
      action,
      ...(batchReason.trim() ? { reason: batchReason.trim() } : {}),
      ...(action === 'approve_and_publish' || action === 'publish' ? { publishExam: publishExamWithAction } : {}),
    });
    setBatchReason('');
    const base = `${res.succeededCount} result${res.succeededCount === 1 ? '' : 's'} updated.`;
    if (res.failedCount > 0) {
      setError(`${res.failedCount} could not be updated: ${res.failed[0]?.message || 'Check status or permissions.'}`);
    }
    setMessage(base);
  });

  const saveRow = async (selectedExam, row, sourceReference, options = {}) => {
    const actor = identity.current;
    const current = () => {
      if (!alive.current || identity.current !== actor) throw new Error('Your session changed. Reopen the result before saving.');
    };
    if (entry !== 'new') {
      if (!reason.trim()) throw new Error('Enter the correction reason in the review section.');
      const updated = await authenticatedWrite('/admin/results/records/' + detail.id + '/corrections', {
        expectedRevision: detail.expectedRevision,
        reason,
        source: sourceReference,
        correctedFields: row,
        keepVerification: Boolean(options.keepVerification),
      });
      current();
      setDetail((await httpClient.request(paths.records + '/' + updated.id)).data);
      setEntry(false);
      setMessage('Correction draft created. Submit, approve and publish it to replace the old version.');
    } else {
      const submitNow = Boolean(options.submit);
      const res = await authenticatedWrite('/admin/results/records', {
        examId: selectedExam,
        rows: [row],
        submit: submitNow,
        idempotencyKey: pendingKey.current,
      });
      current();
      pendingKey.current = crypto.randomUUID();
      if (res.record?.id) {
        setDetail((await httpClient.request(paths.records + '/' + res.record.id)).data);
      }
      setEntry(false);
      setMessage(
        submitNow
          ? 'Marks saved and submitted for main-admin approval.'
          : 'Result draft saved. Submit it for main-admin review or batch-submit later.'
      );
    }
    await refresh();
  };

  const handleBulkFileSelected = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !examId) return;
    setError('');
    setMessage('');
    try {
      const text = await file.text();
      const exam = exams.find(x => x.id === examId);
      const issuer = exam ? (await httpClient.request('/admin/result-issuers/' + exam.issuerId)).data : null;
      const parsed = parseBulkRows(text, file.name, issuer);
      if (!parsed.length || parsed.length > 200) throw new Error('File must contain 1 to 200 student rows.');
      setBulkRows(parsed);
      setBulkFileName(file.name);
      setBulkKey(crypto.randomUUID());
      const checked = await authenticatedWrite('/admin/results/records/batch', {
        examId,
        rows: parsed,
        dryRun: true,
        idempotencyKey: crypto.randomUUID(),
      });
      setBulkCheck(checked);
    } catch (err) {
      setBulkRows(null);
      setBulkFileName('');
      setBulkCheck(null);
      setError(err.message || 'Could not read the uploaded file.');
    }
  };

  const commitBulkRows = submitNow => run(async () => {
    const res = await authenticatedWrite('/admin/results/records/batch', {
      examId,
      rows: bulkRows,
      dryRun: false,
      submit: submitNow,
      idempotencyKey: bulkKey,
    });
    setBulkRows(null);
    setBulkFileName('');
    setBulkCheck(null);
    setBulkKey(crypto.randomUUID());
    setMessage(`${res.imported} student result${res.imported === 1 ? '' : 's'} ${submitNow ? 'imported and submitted for approval' : 'imported as drafts'}.`);
  });

  const importFile = commit => run(async () => {
    const result = await authenticatedWrite('/admin/results/imports', {
      examId,
      assetId,
      mappingVersion: 'kitss-results-v1',
      idempotencyKey: importKey,
      dryRun: !commit,
      ...(commit ? { validationToken: dryRun.validationToken } : {}),
    });
    setDryRun(result);
    if (commit) setMessage(result.imported + ' result drafts imported. Review them before publication.');
  });

  const downloadTemplate = format => run(async () => {
    const exam = (await httpClient.request('/admin/exams/' + examId)).data;
    const issuer = (await httpClient.request('/admin/result-issuers/' + exam.issuerId)).data;
    if (format === 'csv') {
      const vfCols = issuer.fieldSchema.map(f => 'vf_' + f.id);
      const header = ['rollNumber', 'userPublicId', 'studentName', 'schoolName', 'enrollmentNumber', 'issueDate', 'externalId', 'status', 'grade', 'sgpa', 'cgpa', 'subjects', ...vfCols];
      const sample = [
        '2026-0001',
        'KITSS_STUDENT_ID',
        'Student Full Name',
        '',
        '',
        new Date().toISOString().slice(0, 10),
        'REF-001',
        'PASS',
        'A',
        '',
        '',
        'MATH:Mathematics:100:88:A;ENG:English:100:82:A',
        ...issuer.fieldSchema.map(f => (f.type === 'date' ? '2005-01-15' : 'ANSWER')),
      ];
      const csv = [header, sample].map(r => r.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'results-template.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const row = {
      rollNumber: 'REPLACE_WITH_ROLL_NUMBER',
      userPublicId: 'REPLACE_WITH_VERIFIED_STUDENT_ID',
      student: { name: 'REPLACE_WITH_STUDENT_NAME' },
      subjects: [{ code: 'SUBJECT_CODE', name: 'SUBJECT_NAME', maxMarks: 100, obtained: 0 }],
      totals: { max: 100, obtained: 0, percentage: 0, status: 'REPLACE_WITH_RESULT_STATUS' },
      verificationFields: Object.fromEntries(issuer.fieldSchema.map(f => [f.id, f.type === 'date' ? 'YYYY-MM-DD' : 'REPLACE_WITH_ANSWER'])),
      issueDate: 'YYYY-MM-DD',
      externalId: 'REPLACE_WITH_INSTITUTION_REFERENCE',
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify([row], null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results-template.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const switchTab = nextTab => {
    setTab(nextTab);
    setPage(1);
    setForm(null);
    setDetail(null);
    setEntry(false);
    setDryRun(null);
    setMessage('');
    setSearchInput('');
    setSelectedIds([]);
  };

  const allOnPageSelected = tab === 'records' && rows.length > 0 && rows.every(r => selectedIds.includes(r.id));
  const toggleAllOnPage = checked => setSelectedIds(checked ? rows.map(r => r.id) : []);
  const toggleOne = (id, checked) => setSelectedIds(prev => (checked ? [...new Set([...prev, id])] : prev.filter(x => x !== id)));

  return (
    <div className="space-y-4 min-w-0">
      <AdminPageHeader
        title="Academic results"
        description="Step 1: Set up an institution · Step 2: Add its examination · Step 3: Enter or upload marks, then approve and publish."
      />

      {error && <p role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">{error}</p>}
      {message && <p role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-3 text-sm">{message}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="admin-segmented">
          {Object.keys(paths).map(t => (
            <button className="px-3 py-2 text-sm" key={t} aria-pressed={tab === t} disabled={busy} onClick={() => switchTab(t)}>
              {labels[t]}
            </button>
          ))}
        </div>
        {can('results.manage') && tab !== 'records' && (
          <button className="admin-btn admin-btn-accent admin-toolbar-end" disabled={busy} onClick={() => { setForm({}); setDetail(null); }}>
            Add {tab === 'issuers' ? 'institution' : 'examination'}
          </button>
        )}
        {tab === 'records' && can('results.manage') && (
          <button className="admin-btn admin-btn-accent admin-toolbar-end" disabled={busy} onClick={() => { setEntry('new'); setDetail(null); setReason(''); }}>
            Enter student marks
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white border border-slate-200 rounded-xl p-3">
        <label className="block text-xs font-semibold text-[#0A1D3F]">
          Search
          <div className="relative mt-1">
            <Search aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label={tab === 'records' ? 'Search by roll number or student name' : tab === 'exams' ? 'Search examinations' : 'Search institutions'}
              placeholder={tab === 'records' ? 'Roll number or student name...' : 'Search by name...'}
              className="block w-full border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-sm bg-white"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setPage(1); }}
            />
          </div>
        </label>

        {tab === 'exams' && (
          <label className="block text-xs font-semibold text-[#0A1D3F]">
            Institution filter
            <select
              aria-label="Filter examinations by institution"
              className="block border border-slate-200 rounded-lg p-1.5 mt-1 w-full text-sm bg-white"
              value={issuerFilter}
              onChange={e => { setIssuerFilter(e.target.value); setPage(1); }}
            >
              <option value="">All institutions</option>
              {issuers.map(i => <option key={i.id} value={i.id}>{i.fullName || i.name}</option>)}
            </select>
          </label>
        )}

        {tab === 'records' && (
          <>
            <label className="block text-xs font-semibold text-[#0A1D3F]">
              Examination filter
              <select
                aria-label="Filter results by examination"
                className="block border border-slate-200 rounded-lg p-1.5 mt-1 w-full text-sm bg-white"
                value={examFilter}
                onChange={e => { setExamFilter(e.target.value); setPage(1); }}
              >
                <option value="">All examinations</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{[ex.title, ex.level, ex.year, ex.session].filter(Boolean).join(' / ')}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-[#0A1D3F]">
              Review queue
              <select
                aria-label="Result review status"
                className="block border border-slate-200 rounded-lg p-1.5 mt-1 w-full text-sm bg-white"
                value={reviewStatus}
                onChange={e => { setReviewStatus(e.target.value); setPage(1); }}
              >
                <option value="">All records</option>
                {['draft', 'submitted', 'approved', 'rejected'].map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </>
        )}
      </div>

      {/* Batch Actions Bar for Student Results */}
      {tab === 'records' && selectedIds.length > 0 && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-[#0A1D3F]">{selectedIds.length} selected</span>
            <input
              type="text"
              aria-label="Batch review note"
              placeholder="Optional note (required for Reject)"
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white min-w-48"
              value={batchReason}
              onChange={e => setBatchReason(e.target.value)}
            />
            {canPublish && (
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0A1D3F] cursor-pointer">
                <input type="checkbox" checked={publishExamWithAction} onChange={e => setPublishExamWithAction(e.target.checked)} />
                Auto-publish draft exams
              </label>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {can('results.manage') && (
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" disabled={busy} onClick={() => runBatch('submit')}>
                Submit selected
              </button>
            )}
            {canPublish && (
              <>
                <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" disabled={busy} onClick={() => runBatch('approve_and_publish')}>
                  Approve &amp; publish selected
                </button>
                <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" disabled={busy || !batchReason.trim()} onClick={() => runBatch('reject')}>
                  Reject selected
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AdminTable>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {tab === 'records' && (
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all results on page"
                    checked={allOnPageSelected}
                    onChange={e => toggleAllOnPage(e.target.checked)}
                  />
                </th>
              )}
              <th className="p-3 text-left">{tab === 'records' ? 'Student / Roll number' : tab === 'exams' ? 'Examination' : 'Institution'}</th>
              {tab === 'records' && <th className="p-3 text-left">Exam &amp; Marks</th>}
              {tab === 'exams' && <th className="p-3 text-left">Institution</th>}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-t border-slate-100">
                {tab === 'records' && (
                  <td data-label="Select" className="p-3">
                    <input
                      type="checkbox"
                      aria-label={'Select ' + (row.student?.name || row.rollNormalized)}
                      checked={selectedIds.includes(row.id)}
                      onChange={e => toggleOne(row.id, e.target.checked)}
                    />
                  </td>
                )}
                <td data-label={tab === 'records' ? 'Student' : tab === 'exams' ? 'Examination' : 'Institution'} className="p-3 break-words">
                  <span className="font-semibold text-[#0A1D3F]">{row.fullName || row.title || row.student?.name}</span>
                  <p className="text-xs text-slate-600">
                    {tab === 'records'
                      ? [row.rollNormalized, row.candidatePublicId, row.revision > 1 ? `Rev ${row.revision}` : ''].filter(Boolean).join(' · ')
                      : [row.level, row.year, row.session].filter(Boolean).join(' · ') || row.type || ''}
                  </p>
                </td>
                {tab === 'records' && (
                  <td data-label="Exam & Marks" className="p-3 text-xs">
                    <div className="font-medium text-[#0A1D3F]">{row.examTitle || '—'}</div>
                    <div className="text-slate-600">
                      {row.totals ? `${row.totals.obtained}/${row.totals.max} (${row.totals.percentage}%) · ${row.totals.status}` : '—'}
                    </div>
                    {row.examStatus === 'draft' && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                        Exam is draft
                      </span>
                    )}
                  </td>
                )}
                {tab === 'exams' && (
                  <td data-label="Institution" className="p-3 text-xs text-slate-700">
                    {row.issuerName || '—'}
                  </td>
                )}
                <td data-label="Status" className="p-2">
                  <AdminStatus value={row.status}>{row.status}</AdminStatus>
                  {tab === 'records' && <p className="text-xs admin-meta">Review: {row.review?.status || 'draft'}</p>}
                </td>
                <td data-label="Actions" className="p-2">
                  <div className="flex flex-wrap gap-2">
                    <button className={button} disabled={busy} onClick={() => inspect(row)}>
                      Review
                    </button>
                    {tab === 'issuers' && (
                      <button
                        className={button}
                        disabled={busy}
                        onClick={() => {
                          setIssuerFilter(row.id);
                          switchTab('exams');
                        }}
                      >
                        View exams <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 inline ml-1" />
                      </button>
                    )}
                    {tab === 'exams' && (
                      <>
                        <button
                          className={button}
                          disabled={busy}
                          onClick={() => {
                            setExamFilter(row.id);
                            setExamId(row.id);
                            switchTab('records');
                          }}
                        >
                          Marks <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 inline ml-1" />
                        </button>
                        {canPublish && row.status === 'draft' && (
                          <button className="admin-btn admin-btn-primary admin-btn-sm" disabled={busy} onClick={() => publishExamRow(row)}>
                            Publish exam
                          </button>
                        )}
                      </>
                    )}
                    {tab !== 'records' && can('results.manage') && (
                      <>
                        <button className={button} disabled={busy} onClick={() => { setForm(row); setDetail(null); }}>
                          Edit
                        </button>
                        <button
                          className={button}
                          disabled={busy}
                          onClick={() => window.confirm('Archive this configuration?') && run(() => authenticatedWrite(paths[tab] + '/' + row.id, { expectedRevision: row.revision }, 'DELETE'))}
                        >
                          Archive
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <AdminEmpty icon={FileText}>
            <p className="text-sm">No records found.</p>
          </AdminEmpty>
        )}
      </AdminTable>
      <Pagination meta={meta} onChange={setPage} loading={busy} />

      {form && (
        <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 sm:p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150">
          <div
            ref={formDialog}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={(form.id ? 'Edit ' : 'Add ') + (tab === 'issuers' ? 'result institution' : 'examination')}
            className="admin-dialog w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl rounded-2xl"
          >
            <ResultDefinitionEditor
              key={tab + ':' + (form.id || 'new')}
              kind={tab}
              record={form}
              defaultIssuerId={tab === 'exams' ? issuerFilter : ''}
              busy={busy}
              onSave={saveDefinition}
              onCancel={() => setForm(null)}
            />
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 sm:p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150">
          <div
            ref={detailDialog}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={'Review ' + (detail.student?.name || detail.fullName || detail.title || 'record')}
            className="admin-dialog w-full max-w-2xl"
          >
            <section aria-label="Result review" className="admin-card p-5 sm:p-6 space-y-4 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl bg-white rounded-2xl text-left">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E6E8EC]">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F]">{detail.student?.name || detail.fullName || detail.title}</h2>
                  {tab === 'records' && (
                    <p className="text-xs text-[#53647c]">
                      {[detail.issuerName, detail.examTitle, detail.examSession].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <button type="button" onClick={() => setDetail(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-gray-100 transition cursor-pointer" aria-label="Close result review">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {tab === 'records' ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <AdminStatus value={detail.status}>{detail.status}</AdminStatus>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#0A1D3F] font-semibold">
                      Review: {detail.review?.status || 'draft'}
                    </span>
                    {detail.examStatus === 'draft' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                        Parent examination is still draft
                      </span>
                    )}
                    {detail.supersedesId && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold">
                        Correction (Rev {detail.revision})
                      </span>
                    )}
                  </div>
                  <p className="text-sm">Roll number: <strong>{detail.rollNormalized}</strong> · Academic version: {detail.revision}</p>
                  <p className="text-sm">Student User ID: <code>{detail.candidatePublicId}</code></p>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-2 text-left">Subject</th>
                          <th className="p-2 text-center">Maximum</th>
                          <th className="p-2 text-center">Obtained</th>
                          <th className="p-2 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.subjects.map(s => (
                          <tr key={s.code} className="border-t border-slate-100">
                            <td className="p-2">{s.name}</td>
                            <td className="p-2 text-center">{s.maxMarks}</td>
                            <td className="p-2 text-center font-semibold">{s.obtained}</td>
                            <td className="p-2 text-center">{s.grade || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="font-semibold text-sm text-[#0A1D3F]">
                    Total: {detail.totals.obtained} / {detail.totals.max} ({detail.totals.percentage}%) · {detail.totals.status}
                  </p>
                  {detail.review?.reason && <p className="text-xs text-[#53647c]">Last review note: {detail.review.reason}</p>}
                  {can('media.read') && detail.source?.assetId && (
                    <a className="underline text-sm block" href={'/api/v1/media/' + detail.source.assetId + '/content'} target="_blank" rel="noreferrer">
                      View uploaded marks file
                    </a>
                  )}
                  <label className="block text-sm font-medium text-[#0A1D3F]">
                    Review / correction reason
                    <input
                      aria-label="Result action reason"
                      disabled={busy}
                      placeholder="Optional for Submit / Approve / Publish; required for Reject, Withdraw or Correction"
                      className="block w-full border border-slate-200 rounded-lg p-2 mt-1 disabled:bg-slate-100"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  </label>
                  {canPublish && detail.status === 'draft' && detail.examStatus === 'draft' && (
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0A1D3F] cursor-pointer">
                      <input type="checkbox" checked={publishExamWithAction} onChange={e => setPublishExamWithAction(e.target.checked)} />
                      Also publish the parent examination ({detail.examTitle}) so students can view this result
                    </label>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {can('results.manage') && (
                      <button
                        className={button}
                        disabled={busy || detail.status !== 'draft' || !['draft', 'rejected'].includes(detail.review?.status || 'draft')}
                        onClick={() => act('submit')}
                      >
                        Submit for main-admin review
                      </button>
                    )}
                    {canPublish && detail.status === 'draft' && (
                      <button
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        disabled={busy}
                        onClick={() => act('approve_and_publish', { publishExam: publishExamWithAction })}
                      >
                        Approve &amp; publish now
                      </button>
                    )}
                    {isSuperAdmin && detail.review?.status === 'submitted' && ['approve', 'reject'].map(a => (
                      <button
                        key={a}
                        className={button}
                        disabled={busy || (a === 'reject' && !reason.trim())}
                        onClick={() => act(a)}
                      >
                        {a === 'approve' ? 'Approve result' : 'Reject result'}
                      </button>
                    ))}
                    {canPublish && (
                      <>
                        <button
                          className={button}
                          disabled={busy || detail.status !== 'draft' || detail.review?.status !== 'approved'}
                          onClick={() => act('publish', { ...(detail.supersedesId ? { supersedePrevious: true } : {}), ...(detail.examStatus === 'draft' && publishExamWithAction ? { publishExam: true } : {}) })}
                        >
                          Publish result
                        </button>
                        <button
                          className={button}
                          disabled={busy || !reason.trim() || detail.status === 'withdrawn'}
                          onClick={() => window.confirm('Withdraw this result from the student’s account?') && act('withdraw')}
                        >
                          Withdraw result
                        </button>
                      </>
                    )}
                    {can('results.manage') && (
                      <button
                        className={button}
                        disabled={busy || !reason.trim() || detail.status === 'withdrawn'}
                        onClick={() => setEntry('correction')}
                      >
                        Create correction draft
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#53647c]">
                    Tip: Main admins can click <strong>Approve &amp; publish now</strong> to publish in one step (including superseding older revisions on corrections).
                  </p>
                </>
              ) : (
                <div className="text-sm space-y-1">
                  {detail.type && <p>Category: {detail.type === 'university' ? 'University' : detail.type === 'institute' ? 'Institute / School / Coaching' : 'Board'}</p>}
                  {detail.level && <p>Class / course / batch: {detail.level}</p>}
                  {detail.session && <p>Session: {detail.session}</p>}
                  {detail.source && <p>Result source: {detail.source.description} · Reference: {detail.source.authorizationReference}</p>}
                </div>
              )}
              {detail.audit?.length > 0 && (
                <details>
                  <summary className="text-sm cursor-pointer font-medium">Activity history</summary>
                  {detail.audit.map((a, i) => (
                    <p className="text-xs py-1 text-[#53647c]" key={i}>
                      {a.action.replaceAll('_', ' ')} — {new Date(a.at).toLocaleString()}
                    </p>
                  ))}
                </details>
              )}
            </section>
          </div>
        </div>
      )}

      {entry && (
        <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 sm:p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150">
          <div
            ref={entryDialog}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={entry === 'new' ? 'Enter student marks' : 'Create corrected result'}
            className="admin-dialog w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl rounded-2xl"
          >
            <ResultEntryEditor
              key={entry === 'new' ? 'new' : detail.id}
              record={entry === 'new' ? null : detail}
              defaultExamId={entry === 'new' ? examFilter : ''}
              onSave={saveRow}
              onCancel={() => setEntry(false)}
            />
          </div>
        </div>
      )}

      {tab === 'records' && can('results.manage') && (
        <details className="admin-card p-5">
          <summary className="font-semibold cursor-pointer text-[#0A1D3F]">Upload multiple students’ results (CSV or JSON)</summary>
          <div className="space-y-4 mt-3">
            <p className="text-sm text-[#53647c]">
              Pick an examination, download the Excel-friendly CSV template (or JSON template), upload your filled file to preview and validate every row, then import.
            </p>
            <label className="block text-sm font-medium text-[#0A1D3F]">
              Examination
              <select
                aria-label="Import examination"
                className="block w-full border border-slate-200 rounded-lg p-2 mt-1 bg-white"
                value={examId}
                onChange={e => {
                  setExamId(e.target.value);
                  setDryRun(null);
                  setBulkRows(null);
                  setBulkCheck(null);
                  setImportKey(crypto.randomUUID());
                }}
              >
                <option value="">Select examination</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>
                    {[e.title, e.level, e.year, e.session].filter(Boolean).join(' / ')}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={!examId || busy} onClick={() => downloadTemplate('csv')}>
                Download CSV template
              </button>
              <button type="button" className={button} disabled={!examId || busy} onClick={() => downloadTemplate('json')}>
                Download result template (JSON)
              </button>
            </div>

            <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <label className="block text-sm font-semibold text-[#0A1D3F]">
                Upload CSV or JSON marks sheet (up to 200 rows)
                <input
                  type="file"
                  aria-label="Upload CSV or JSON marks sheet"
                  accept=".csv,.json,text/csv,application/json"
                  disabled={!examId || busy}
                  onChange={handleBulkFileSelected}
                  className="block w-full text-xs text-slate-600 mt-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:text-xs file:font-semibold file:text-[#0A1D3F] cursor-pointer"
                />
              </label>

              {bulkFileName && bulkCheck && (
                <div className="space-y-2.5 bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#0A1D3F] inline-flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-[#FF8A00]" />
                      {bulkFileName}: {bulkCheck.validRows} of {bulkCheck.rows} rows valid
                    </span>
                    {bulkCheck.errors?.length === 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready to import
                      </span>
                    )}
                  </div>
                  {bulkCheck.errors?.length > 0 && (
                    <ul className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 space-y-1 max-h-40 overflow-y-auto">
                      {bulkCheck.errors.map((err, i) => (
                        <li key={i}>
                          Row {err.row}{err.rollNumber ? ` (${err.rollNumber})` : ''}: {err.message || err.code}
                        </li>
                      ))}
                    </ul>
                  )}
                  {bulkCheck.errors?.length === 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" disabled={busy} onClick={() => commitBulkRows(false)}>
                        Import {bulkCheck.validRows} drafts
                      </button>
                      <button type="button" className="admin-btn admin-btn-accent admin-btn-sm" disabled={busy} onClick={() => commitBulkRows(true)}>
                        Import &amp; submit all for approval
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {can('media.write') && (
              <details className="border border-slate-200 rounded-xl p-3 bg-white">
                <summary className="text-xs font-semibold text-[#53647c] cursor-pointer">Import JSON via Media Library (advanced)</summary>
                <div className="space-y-3 mt-3">
                  <MediaPicker purpose="result_import" label="Results file" value={assetId} onChange={v => { setAssetId(v); setDryRun(null); setImportKey(crypto.randomUUID()); }} />
                  <div className="flex flex-wrap gap-2">
                    <button className={button} disabled={busy || !examId || !assetId} onClick={() => importFile(false)}>Check results file</button>
                    <button className={button} disabled={busy || !dryRun?.validationToken || dryRun.dryRun === false} onClick={() => importFile(true)}>Import checked drafts</button>
                  </div>
                  {dryRun && (
                    <p role="status" className="text-sm">
                      {dryRun.dryRun ? dryRun.validRows + ' of ' + dryRun.rows + ' rows are valid.' : dryRun.imported + ' drafts imported.'}
                      {dryRun.errors?.length > 0 ? ' Errors: ' + dryRun.errors.map(e => `Row ${e.row || '?'}: ${e.message || e.code}`).join('; ') : ''}
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
