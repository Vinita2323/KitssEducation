import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { httpClient } from '../../../shared/api/httpClient';
import { readOptions } from '../../user/services/collegeService';
import { useDebouncedValue } from '../../../shared/ui/useDebouncedValue';

const style = 'block w-full min-w-0 border border-slate-200 rounded-lg p-2 mt-1 bg-white text-sm text-[#0A1D3F]';
const today = () => new Date().toISOString().slice(0, 10);

export function ResultEntryEditor({ record, defaultExamId = '', onSave, onCancel }) {
  const [exams, setExams] = useState([]);
  const [issuer, setIssuer] = useState(null);
  const [examId, setExamId] = useState(record?.examId || defaultExamId || '');
  const [v, setV] = useState(() => ({
    userPublicId: record?.candidatePublicId || '',
    rollNumber: record?.rollNormalized || '',
    name: record?.student?.name || '',
    schoolName: record?.student?.schoolName || '',
    enrollmentNumber: record?.student?.enrollmentNumber || '',
    issueDate: record?.issueDate ? String(record.issueDate).slice(0, 10) : today(),
    externalId: record?.source?.externalId || '',
    status: record?.totals?.status || 'PASS',
    grade: record?.totals?.grade || '',
    sgpa: record?.totals?.sgpa ?? '',
    cgpa: record?.totals?.cgpa ?? '',
  }));
  const [subjects, setSubjects] = useState(record?.subjects || [{ code: '', name: '', maxMarks: 100, obtained: '', grade: '' }]);
  const [verification, setVerification] = useState({});
  const [keepVerification, setKeepVerification] = useState(Boolean(record));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');

  // Quick student search so admins don't need to leave this screen to find User IDs
  const [studentQuery, setStudentQuery] = useState('');
  const debouncedQuery = useDebouncedValue(studentQuery.trim(), 250);
  const [studentMatches, setStudentMatches] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    readOptions('/admin/exams', {}, c.signal)
      .then(rows => {
        if (!c.signal.aborted) setExams(rows);
      })
      .catch(e => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, []);

  useEffect(() => {
    const c = new AbortController();
    setIssuer(null);
    setVerification({});
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      httpClient
        .request('/admin/result-issuers/' + exam.issuerId, { signal: c.signal })
        .then(r => {
          if (!c.signal.aborted) setIssuer(r.data);
        })
        .catch(e => {
          if (!c.signal.aborted) setError(e.message);
        });
    }
    return () => c.abort();
  }, [examId, exams]);

  useEffect(() => {
    if (record || debouncedQuery.length < 2) {
      setStudentMatches([]);
      return;
    }
    const c = new AbortController();
    setSearchingStudents(true);
    httpClient
      .request('/admin/results/students?q=' + encodeURIComponent(debouncedQuery), { signal: c.signal })
      .then(r => {
        if (!c.signal.aborted) setStudentMatches(r.data || []);
      })
      .catch(() => {
        if (!c.signal.aborted) setStudentMatches([]);
      })
      .finally(() => {
        if (!c.signal.aborted) setSearchingStudents(false);
      });
    return () => c.abort();
  }, [debouncedQuery, record]);

  const pickStudent = student => {
    setV(p => ({
      ...p,
      userPublicId: student.id,
      name: student.name,
    }));
    if (student.dob && issuer?.fieldSchema?.some(f => f.id === 'dob')) {
      setVerification(p => ({ ...p, dob: student.dob }));
    }
    setStudentMatches([]);
    setStudentQuery('');
  };

  const liveMax = subjects.reduce((n, s) => n + (Number(s.maxMarks) || 0), 0);
  const liveObtained = subjects.reduce((n, s) => n + (Number(s.obtained) || 0), 0);
  const livePercent = liveMax > 0 ? Math.round((liveObtained / liveMax) * 10000) / 100 : 0;

  const field = (key, label, { type = 'text', required = true, disabled = false, placeholder = '' } = {}) => (
    <label className="block text-sm font-medium text-[#0A1D3F]">
      {label}
      <input
        aria-label={label}
        className={style}
        value={v[key]}
        type={type}
        placeholder={placeholder}
        step={['sgpa', 'cgpa'].includes(key) ? 'any' : undefined}
        disabled={disabled}
        required={required}
        onChange={e => setV(p => ({ ...p, [key]: e.target.value }))}
      />
    </label>
  );

  const saveWithOptions = async (submitNow = false) => {
    setBusy(true);
    setError('');
    try {
      const marks = subjects.map(s => ({
        code: s.code,
        name: s.name,
        maxMarks: Number(s.maxMarks),
        obtained: Number(s.obtained),
        ...(s.grade ? { grade: s.grade } : {}),
      }));
      const max = marks.reduce((n, s) => n + s.maxMarks, 0);
      const obtained = marks.reduce((n, s) => n + s.obtained, 0);
      await onSave(
        examId,
        {
          userPublicId: v.userPublicId,
          rollNumber: v.rollNumber,
          student: {
            name: v.name,
            ...(v.schoolName ? { schoolName: v.schoolName } : {}),
            ...(v.enrollmentNumber ? { enrollmentNumber: v.enrollmentNumber } : {}),
          },
          subjects: marks,
          totals: {
            max,
            obtained,
            percentage: max > 0 ? Math.round((obtained / max) * 10000) / 100 : 0,
            status: v.status,
            ...(v.grade ? { grade: v.grade } : {}),
            ...(v.sgpa !== '' ? { sgpa: Number(v.sgpa) } : {}),
            ...(v.cgpa !== '' ? { cgpa: Number(v.cgpa) } : {}),
          },
          verificationFields: verification,
          issueDate: v.issueDate,
          externalId: v.externalId,
        },
        reference,
        { submit: submitNow, keepVerification: Boolean(record && keepVerification) }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = e => {
    e.preventDefault();
    const submitMode = e.nativeEvent?.submitter?.dataset?.submitMode === 'submit';
    saveWithOptions(submitMode);
  };

  return (
    <form aria-label="Student result editor" onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F]">{record ? 'Create corrected result' : 'Enter student marks'}</h2>
          <p className="text-xs text-[#53647c]">
            {record ? 'Edit marks or student details to create a new draft revision.' : 'Search a verified student, enter marks, and save as draft or submit for approval.'}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-gray-100 transition cursor-pointer" aria-label="Close editor">
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        <label className="block text-sm font-medium text-[#0A1D3F]">
          Examination
          <select aria-label="Student result examination" className={style} required disabled={Boolean(record)} value={examId} onChange={e => setExamId(e.target.value)}>
            <option value="">Select examination</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {[e.title, e.level, e.year, e.session].filter(Boolean).join(' / ')}
              </option>
            ))}
          </select>
        </label>

        {!record && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <label className="block text-xs font-semibold text-[#0A1D3F]">
              Quick find verified student (optional — auto-fills User ID & Name)
              <div className="relative mt-1">
                <Search aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search verified student"
                  placeholder="Type student name, email or KITSS ID..."
                  className="block w-full border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 bg-white text-sm text-[#0A1D3F]"
                  value={studentQuery}
                  onChange={e => setStudentQuery(e.target.value)}
                />
              </div>
            </label>
            {searchingStudents && <p className="text-xs text-[#53647c]">Searching verified students...</p>}
            {studentMatches.length > 0 && (
              <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white max-h-40 overflow-y-auto">
                {studentMatches.map(s => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => pickStudent(s)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="font-semibold text-[#0A1D3F]">{s.name} <span className="font-normal text-[#53647c]">({s.email})</span></span>
                      <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{s.id}</code>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {field('userPublicId', 'Student User ID', { disabled: Boolean(record), placeholder: 'e.g. KITSS...' })}
          {field('rollNumber', 'Student roll number', { disabled: Boolean(record), placeholder: 'e.g. 2026-0001' })}
          {field('name', 'Student name')}
          {field('issueDate', 'Result issue date', { type: 'date' })}
          {field('schoolName', 'Student institution', { required: false })}
          {field('enrollmentNumber', 'Enrollment number', { required: false })}
        </div>

        {issuer?.fieldSchema?.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-sm text-[#0A1D3F]">Student verification answers</h3>
              {record && (
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0A1D3F] cursor-pointer">
                  <input type="checkbox" checked={keepVerification} onChange={e => setKeepVerification(e.target.checked)} />
                  Keep existing verification answers
                </label>
              )}
            </div>
            {(!record || !keepVerification) &&
              issuer.fieldSchema.map(f => (
                <label className="block text-sm font-medium text-[#0A1D3F]" key={f.id}>
                  {f.label}
                  <input
                    aria-label={'Answer: ' + f.label}
                    type={f.type === 'date' ? 'date' : 'text'}
                    required={f.required}
                    className={style}
                    value={verification[f.id] || ''}
                    onChange={e => setVerification(p => ({ ...p, [f.id]: e.target.value }))}
                  />
                </label>
              ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <h3 className="font-semibold text-sm text-[#0A1D3F]">Subject marks</h3>
          <span className="text-xs font-semibold bg-slate-100 text-[#0A1D3F] px-2.5 py-1 rounded-full">
            Live total: {liveObtained} / {liveMax} ({livePercent}%)
          </span>
        </div>

        {subjects.map((s, i) => (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border border-slate-200 rounded-lg p-2.5 bg-slate-50/30" key={i}>
            {[
              ['code', 'Subject code'],
              ['name', 'Subject name'],
              ['maxMarks', 'Maximum marks'],
              ['obtained', 'Obtained marks'],
              ['grade', 'Subject grade'],
            ].map(([key, label]) => (
              <label key={key} className="text-xs font-medium text-[#0A1D3F]">
                {label}
                <input
                  aria-label={label + ' ' + (i + 1)}
                  className={style}
                  type={['maxMarks', 'obtained'].includes(key) ? 'number' : 'text'}
                  min={key === 'maxMarks' ? 1 : key === 'obtained' ? 0 : undefined}
                  max={key === 'obtained' ? s.maxMarks : undefined}
                  required={key !== 'grade'}
                  value={s[key] ?? ''}
                  onChange={e => setSubjects(p => p.map((item, n) => (n === i ? { ...item, [key]: e.target.value } : item)))}
                />
              </label>
            ))}
            <button
              type="button"
              className="text-xs underline text-rose-700 col-span-2 sm:col-span-5 text-left cursor-pointer disabled:opacity-40"
              disabled={subjects.length === 1}
              onClick={() => setSubjects(p => p.filter((_, n) => n !== i))}
            >
              Remove subject
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={subjects.length >= 40}
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={() => setSubjects(p => [...p, { code: '', name: '', maxMarks: 100, obtained: '', grade: '' }])}
        >
          Add subject
        </button>

        <div className="grid sm:grid-cols-2 gap-3">
          {field('status', 'Result status', { placeholder: 'PASS / FAIL / COMPARTMENT' })}
          {field('grade', 'Overall grade', { required: false })}
          {field('sgpa', 'SGPA', { type: 'number', required: false })}
          {field('cgpa', 'CGPA', { type: 'number', required: false })}
          {field('externalId', 'Institution result reference', { placeholder: 'e.g. Sheet #12 / Register ref' })}
        </div>

        {record && (
          <label className="block text-sm font-medium text-[#0A1D3F]">
            Correction source reference
            <input aria-label="Correction source reference" required className={style} value={reference} onChange={e => setReference(e.target.value)} />
          </label>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <button disabled={busy || !issuer} data-submit-mode="draft" className="admin-btn admin-btn-primary">
            {busy ? 'Saving...' : record ? 'Save correction draft' : 'Save result draft'}
          </button>
          {!record && (
            <button disabled={busy || !issuer} data-submit-mode="submit" className="admin-btn admin-btn-accent">
              {busy ? 'Saving...' : 'Save & submit for approval'}
            </button>
          )}
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}
