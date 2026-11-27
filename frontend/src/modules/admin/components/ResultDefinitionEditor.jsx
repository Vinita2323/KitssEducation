import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../user/context/AuthContext';
import { readOptions } from '../../user/services/collegeService';

const input = 'block w-full border border-slate-200 rounded-lg p-2 mt-1 bg-white text-sm text-[#0A1D3F]';

export function ResultDefinitionEditor({ kind, record, defaultIssuerId = '', onSave, onCancel, busy }) {
  const { can } = useAuth();
  const issuer = kind === 'issuers';
  const [v, setV] = useState(() =>
    issuer
      ? {
          key: record?.key || 'issuer-' + crypto.randomUUID(),
          type: record?.type || 'university',
          sourceMode: record?.sourceMode || 'admin',
          organizationKind: record?.organizationKind || 'university',
          organizationId: record?.organizationId || '',
          name: record?.name || '',
          fullName: record?.fullName || '',
          status: record?.status || 'active',
          description: record?.source?.description || '',
          reference: record?.source?.authorizationReference || '',
          questions: record?.fieldSchema || [{ id: 'dob', label: 'Date of birth', type: 'date', required: true }],
        }
      : {
          key: record?.key || 'exam-' + crypto.randomUUID(),
          issuerId: record?.issuerId || defaultIssuerId || '',
          title: record?.title || '',
          year: record?.year || new Date().getFullYear(),
          session: record?.session || '',
          level: record?.level || '',
          status: record?.status || 'draft',
        }
  );
  const [options, setOptions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const c = new AbortController();
    setOptions([]);
    readOptions(issuer ? '/admin/results/organizations' : '/admin/result-issuers', issuer ? { kind: v.organizationKind } : {}, c.signal)
      .then(rows => {
        if (!c.signal.aborted) setOptions(issuer ? rows : rows.filter(r => r.sourceMode === 'admin' || r.id === v.issuerId));
      })
      .catch(e => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [issuer, v.organizationKind, v.issuerId]);

  const change = (key, value) => setV(p => ({ ...p, [key]: value }));
  const field = (key, label, type = 'text', required = true, placeholder = '') => (
    <label className="block text-sm font-medium text-[#0A1D3F]">
      {label}
      <input
        aria-label={label}
        type={type}
        required={required}
        placeholder={placeholder}
        className={input}
        value={v[key]}
        onChange={e => change(key, e.target.value)}
      />
    </label>
  );

  const submit = e => {
    e.preventDefault();
    onSave(
      issuer
        ? {
            key: v.key,
            type: v.type,
            sourceMode: v.sourceMode,
            ...(v.sourceMode === 'admin' ? { organizationKind: v.organizationKind, organizationId: v.organizationId } : {}),
            name: v.name,
            fullName: v.fullName,
            status: v.status,
            fieldSchema: v.questions,
            source: { description: v.description, authorizationReference: v.reference },
          }
        : { ...v, year: Number(v.year) }
    );
  };

  const examStatuses = can('results.publish') || record?.status === 'published'
    ? ['draft', 'published', 'withdrawn']
    : ['draft', 'withdrawn'];

  return (
    <form aria-label="Result definition editor" onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F]">
            {record?.id ? 'Edit' : 'Add'} {issuer ? 'result institution' : 'examination'}
          </h2>
          <p className="text-xs text-[#53647c]">
            {issuer
              ? 'Link a verified platform institution and configure student verification questions.'
              : 'Create an examination under an institution so marks can be entered or imported.'}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-gray-100 transition cursor-pointer" aria-label="Close editor">
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}
      <fieldset disabled={busy} className="space-y-3 min-w-0">
        {issuer ? (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-[#0A1D3F]">
                Result category
                <select
                  aria-label="Result category"
                  className={input}
                  disabled={Boolean(record?.id)}
                  value={v.type}
                  onChange={e => setV(p => ({ ...p, type: e.target.value, organizationKind: e.target.value === 'university' ? 'university' : 'college', organizationId: '' }))}
                >
                  <option value="university">University Result</option>
                  <option value="institute">Institute / School / Coaching</option>
                  {v.type === 'school' && <option value="school">Board Result</option>}
                </select>
              </label>
              {v.sourceMode !== 'external' && (
                <label className="block text-sm font-medium text-[#0A1D3F]">
                  Institution type
                  <select
                    aria-label="Result institution type"
                    className={input}
                    disabled={Boolean(record?.id) || v.type === 'university'}
                    value={v.organizationKind}
                    onChange={e => setV(p => ({ ...p, organizationKind: e.target.value, organizationId: '' }))}
                  >
                    {(v.type === 'university'
                      ? [['university', 'University']]
                      : [
                          ['college', 'College / Institute / School'],
                          ['franchise', 'Approved KITSS Franchise'],
                          ['course', 'Published Coaching Course'],
                        ]
                    ).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {v.sourceMode === 'external' ? (
              <p className="text-sm bg-amber-50 p-3 rounded-lg">Results for this institution are not available to students yet. Its current settings are retained.</p>
            ) : (
              <label className="block text-sm font-medium text-[#0A1D3F]">
                Platform institution
                <select
                  aria-label="Platform institution"
                  required
                  className={input}
                  disabled={Boolean(record?.id)}
                  value={v.organizationId}
                  onChange={e => {
                    const item = options.find(r => r.id === e.target.value);
                    setV(p => ({ ...p, organizationId: e.target.value, fullName: item?.name || '', name: item?.name || '' }));
                  }}
                >
                  <option value="">Select institution</option>
                  {v.organizationId && !options.some(r => r.id === v.organizationId) && <option value={v.organizationId}>{v.fullName || 'Current institution'}</option>}
                  {options.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {field('name', 'Short display name')}
              {field('fullName', 'Institution display name')}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {field('description', 'Where the marks were received from', 'text', true, 'e.g. Official exam cell sheet')}
              {field('reference', 'Permission / source reference', 'text', true, 'e.g. Memo / Letter ref')}
            </div>
            <div className="space-y-2 pt-1">
              <h3 className="font-semibold text-sm text-[#0A1D3F]">Student verification questions</h3>
              <p className="text-xs text-[#53647c]">Students must be signed in and answer these details to view their marksheet.</p>
              {v.questions.map((q, i) => (
                <div key={q.id} className="border border-slate-200 rounded-lg p-2.5 space-y-2 bg-slate-50/50">
                  <input
                    aria-label={'Verification question ' + (i + 1)}
                    required
                    value={q.label}
                    className={input}
                    placeholder="e.g. Date of birth"
                    onChange={e => change('questions', v.questions.map((item, n) => (n === i ? { ...item, label: e.target.value } : item)))}
                  />
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <select
                      aria-label={'Verification answer type ' + (i + 1)}
                      className="border border-slate-200 rounded-md px-2 py-1 bg-white"
                      value={q.type}
                      onChange={e => change('questions', v.questions.map((item, n) => (n === i ? { ...item, type: e.target.value } : item)))}
                    >
                      <option value="text">Text</option>
                      <option value="date">Date</option>
                    </select>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={e => change('questions', v.questions.map((item, n) => (n === i ? { ...item, required: e.target.checked } : item)))}
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      className="underline text-xs text-rose-700 cursor-pointer"
                      onClick={() => change('questions', v.questions.filter((_, n) => n !== i))}
                    >
                      Remove question
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={v.questions.length >= 8}
                onClick={() => change('questions', [...v.questions, { id: 'q' + crypto.randomUUID().replaceAll('-', ''), label: '', type: 'text', required: true }])}
              >
                Add verification question
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-[#0A1D3F]">
              Result institution
              <select
                aria-label="Exam institution"
                required
                disabled={Boolean(record?.id)}
                className={input}
                value={v.issuerId}
                onChange={e => change('issuerId', e.target.value)}
              >
                <option value="">Select institution</option>
                {options.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.fullName || r.name}
                  </option>
                ))}
              </select>
            </label>
            {field('title', 'Examination name', 'text', true, 'e.g. B.Sc Semester 1 Final Exam')}
            <div className="grid sm:grid-cols-3 gap-3">
              {field('year', 'Examination year', 'number')}
              {field('session', 'Academic session', 'text', true, 'e.g. May 2026')}
              {field('level', 'Class / course / batch', 'text', false, 'e.g. Class 10 / Sem 1')}
            </div>
          </>
        )}
        <label className="block text-sm font-medium text-[#0A1D3F]">
          Status
          <select aria-label="Definition status" className={input} value={v.status} onChange={e => change('status', e.target.value)}>
            {(issuer ? ['draft', 'active', 'inactive'] : examStatuses).map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="admin-btn admin-btn-primary" disabled={busy}>
            Save configuration
          </button>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}
