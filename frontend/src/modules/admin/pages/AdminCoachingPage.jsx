import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '../components/AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { readOptions } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { MediaPicker } from '../components/MediaPicker';
const css = 'w-full p-2 border border-[#E6E8EC] rounded-xl bg-[#F7F8FA] text-sm';
const choiceSources = [
  ...'language subject board class program state'.split(' ').map(kind => ({ key: kind, path: '/taxonomies', filters: { kind }, label: { language: 'languages', subject: 'subjects', board: 'boards', class: 'educational levels', program: 'programs', state: 'states' }[kind] })),
  { key: 'faculty', path: '/public/faculty', label: 'published instructors' },
  { key: 'books', path: '/books', label: 'published books' },
];
const choiceKeys = { languageId: 'language', subjectIds: 'subject', boardId: 'board', classId: 'class', programId: 'program', stateId: 'state', facultyIds: 'faculty', linkedBookIds: 'books' };
const blank = {
  courses: {
    title: '',
    description: '',
    whatYouWillLearn: [],
    benefits: [],
    category: '',
    languageId: null,
    boardId: null,
    classId: null,
    stateId: null,
    programId: null,
    subjectIds: [],
    facultyIds: [],
    linkedBookIds: [],
    thumbnailId: null,
    syllabus: [],
    rightsConfirmed: false,
    rightsNote: ''
  },
  lessons: {
    title: '',
    subjectKey: '',
    sortOrder: 0,
    description: '',
    content: '',
    documentAssetId: null,
    videoAssetId: null,
    linkedBookIds: [],
    previewAllowed: false,
    status: 'draft'
  },
  plans: {
    name: '',
    features: [],
    popular: false,
    sortOrder: 0,
    priceMinor: '',
    durationDays: '',
    durationMonths: '',
    eligibility: '',
    rulesApproved: false,
    status: 'draft'
  }
};
export function AdminCoachingPage() {
  const {
      can
    } = useAuth(),
    [rows, setRows] = useState([]),
    [course, setCourse] = useState(null),
    [kind, setKind] = useState('courses'),
    [form, setForm] = useState(null),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [q, setQ] = useState(''),
    [choices, setChoices] = useState({
      language: [],
      subject: [],
      board: [],
      class: [],
      program: [],
      state: [],
      faculty: [],
      books: []
    });
  const [choiceErrors, setChoiceErrors] = useState({}), [choiceLoading, setChoiceLoading] = useState({}), [choiceVersion, setChoiceVersion] = useState(0);
  const base = kind === 'courses' ? '/admin/coaching/courses' : '/admin/coaching/courses/' + course.id + '/' + kind;
  const creatable = can(kind === 'plans' ? 'commerce.plans.write' : 'coaching.create');
  const archivable = can(kind === 'plans' ? 'commerce.plans.write' : 'coaching.archive');
  const writable = can(kind === 'plans' ? 'commerce.plans.write' : 'coaching.edit');
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError('');
    httpClient.request(base + '?page=' + page + '&q=' + encodeURIComponent(q), {
      signal: controller.signal
    }).then(r => {
      setRows(r.data);
      setTotal(r.meta.total);
    }).catch(e => {
      if (e.code !== 'ABORTED') {
        setRows([]);
        setError(e.message);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [base, page, q, version]);
  useEffect(() => {
    const controller = new AbortController();
    setChoiceErrors({});
    setChoiceLoading(Object.fromEntries(choiceSources.map(source => [source.key, true])));
    for (const source of choiceSources) {
      readOptions(source.path, source.filters, controller.signal)
        .then(options => { if (!controller.signal.aborted) setChoices(previous => ({ ...previous, [source.key]: options })); })
        .catch(() => { if (!controller.signal.aborted) setChoiceErrors(previous => ({ ...previous, [source.key]: true })); })
        .finally(() => { if (!controller.signal.aborted) setChoiceLoading(previous => ({ ...previous, [source.key]: false })); });
    }
    return () => controller.abort();
  }, [choiceVersion]);
  const open = row => {
    setChoiceVersion(value => value + 1);
    setEditing(row ?? null);
    const defaults = structuredClone(blank[kind]);
    if (row) for (const key of Object.keys(defaults)) if (row[key] !== undefined) defaults[key] = row[key];
    setForm(defaults);
  };
  const change = (key, value) => setForm(f => ({
    ...f,
    [key]: value
  }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...form,
        ...(editing ? {
          expectedRevision: editing.revision
        } : {})
      };
      if (kind === 'plans') {
        payload.sortOrder = Number(payload.sortOrder);
        if (payload.priceMinor === '') delete payload.priceMinor;else payload.priceMinor = Number(payload.priceMinor);
        for (const unit of ['durationDays', 'durationMonths']) { if (payload[unit] === '' || payload[unit] == null) delete payload[unit]; else payload[unit] = Number(payload[unit]); }
        if (!payload.eligibility) delete payload.eligibility;
      }
      if (kind === 'lessons') payload.sortOrder = Number(payload.sortOrder);
      await authenticatedWrite(base + (editing ? '/' + editing.id : ''), payload, editing ? 'PATCH' : 'POST');
      setForm(null);
      setVersion(v => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function archive(row) {
    if (!confirm('Archive this ' + kind.slice(0, -1) + '? Historical references are retained.')) return;
    setBusy(true); setError('');
    try {
      await authenticatedWrite(base + '/' + row.id, {
        expectedRevision: row.revision
      }, 'DELETE');
      setVersion(v => v + 1);
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  }
  async function publish(row) {
    setBusy(true); setError('');
    try {
      await authenticatedWrite('/admin/coaching/courses/' + row.id + '/publish', {
        expectedRevision: row.revision,
        publish: row.status !== 'published'
      });
      setVersion(v => v + 1);
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  }
  const field = (key, label, type = 'text') => <AdminField className="block text-xs" key={key}>{label}<AdminInput aria-label={label} className={css} type={type} value={form[key] ?? ''} onChange={e => change(key, e.target.value)} required={['title', 'name'].includes(key)} /></AdminField>;
  const check = (key, label) => <AdminField className="flex gap-2 items-center text-xs"><AdminInput type="checkbox" checked={!!form[key]} onChange={e => change(key, e.target.checked)} />{label}</AdminField>;
  const select = (key, label, options, multiple = false) => {
    const source = choiceKeys[key], loading = choiceLoading[source], failed = choiceErrors[source];
    return <AdminField className="block text-xs">{label}<AdminSelect aria-label={label} className={css} multiple={multiple} disabled={loading || failed} aria-busy={Boolean(loading)} value={form[key] ?? (multiple ? [] : '')} onChange={e => change(key, multiple ? [...e.target.selectedOptions].map(o => o.value) : e.target.value || null)}>{!multiple && <option value="">{loading ? 'Loading...' : failed ? 'Choices unavailable' : 'Select ' + label.toLowerCase()}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.label ?? o.title ?? o.name}</option>)}</AdminSelect>{!loading && !failed && !options.length && <span className="block mt-1 text-[#667085]">No {label.toLowerCase()} available.</span>}</AdminField>;
  };
  const choicesWarning = Object.keys(choiceErrors).length > 0 && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm"><p>Could not load: {choiceSources.filter(source => choiceErrors[source.key]).map(source => source.label).join(', ')}. Other choices remain available.</p><button type="button" disabled={Object.values(choiceLoading).some(Boolean)} className="mt-2 underline" onClick={() => setChoiceVersion(value => value + 1)}>Retry choices</button></div>;
  const editorDialog = useDialogFocus(Boolean(form), () => setForm(null));
  return <div className="space-y-4 text-[#0A1D3F] min-w-0">
    <header className="bg-white border rounded-2xl p-5 flex flex-wrap justify-between gap-3"><div><h1 className="text-xl font-bold">Coaching Management</h1><p className="text-xs text-[#667085]">{course ? course.title : 'Courses, lessons and explicitly approved prepaid plans'}</p></div>{creatable && <button disabled={busy} onClick={() => open()} className="bg-[#0A1D3F] text-white rounded-xl px-4 py-2">Add {kind.slice(0, -1)}</button>}</header>
    {course && <nav className="flex flex-wrap gap-2"><button onClick={() => {
        setCourse(null);
        setKind('courses');
        setPage(1);
      }}>All courses</button>{['lessons', 'plans'].filter(k => can(k === 'plans' ? 'commerce.read' : 'coaching.read')).map(k => <button key={k} className="p-2 border rounded-lg bg-white" onClick={() => {
        setKind(k);
        setPage(1);
        setQ('');
      }}>{k === 'lessons' ? 'Lessons' : 'Course plans'}</button>)}</nav>}
    <AdminInput aria-label="Search coaching" className={css} placeholder="Search titles" value={q} onChange={e => {
      setQ(e.target.value);
      setPage(1);
    }} />
    {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">{error}</p>}{busy && <p role="status">Loading…</p>}
    <div className="bg-white border rounded-2xl overflow-x-auto"><table className="w-full text-xs"><thead><tr>{['Title / name', 'Status', 'Revision', 'Actions'].map(v => <th className="p-3 text-left" key={v}>{v}</th>)}</tr></thead><tbody>{rows.map(row => <tr className="border-t" key={row.id}><td className="p-3 min-w-32">{row.title ?? row.name}</td><td>{row.status}</td><td>{row.revision}</td><td className="p-3"><div className="flex flex-wrap gap-3">{kind === 'courses' && <button onClick={() => {
                  setCourse(row);
                  setKind('lessons');
                  setPage(1);
                  setQ('');
                }}>Manage lessons</button>}{writable && row.status !== 'archived' && <button disabled={busy} onClick={() => open(row)}>Edit</button>}{archivable && row.status !== 'archived' && <button disabled={busy} onClick={() => archive(row)}>Archive</button>}{kind === 'courses' && can('coaching.publish') && row.status !== 'archived' && <button disabled={busy} onClick={() => publish(row)}>{row.status === 'published' ? 'Unpublish' : 'Publish'}</button>}</div></td></tr>)}</tbody></table>{!busy && !rows.length && <p className="p-6 text-center">No {kind} found.</p>}</div>
    <div className="flex gap-3 text-sm"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} · {total} records</span><button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button></div>
    {!form && choicesWarning}
    {form && <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 flex items-center justify-center"><form ref={editorDialog} role="dialog" aria-modal="true" aria-label="Coaching editor" tabIndex={-1} onSubmit={save} className="bg-white p-5 rounded-2xl space-y-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto"><h2 className="font-bold">{editing ? 'Edit' : 'Add'} {kind.slice(0, -1)}</h2>{error && <p role="alert" className="text-red-700">{error}</p>}{choicesWarning}
      {kind === 'courses' && <>{['whatYouWillLearn','benefits'].map(key=><AdminField key={key} className="block text-xs">{key==='benefits'?'Course benefits':'Learning outcomes'} (one per line)<AdminTextarea aria-label={key==='benefits'?'Course benefits':'Learning outcomes'} className={css} value={(form[key]||[]).join('\n')} onChange={e=>change(key,e.target.value.split('\n'))}/></AdminField>)}{field('title', 'Course title')}{field('category', 'Category')}<AdminField className="block text-xs">Description<AdminTextarea className={css} value={form.description} onChange={e => change('description', e.target.value)} /></AdminField>{select('languageId', 'Language', choices.language)}{select('boardId', 'Board', choices.board)}{select('classId', 'Educational level', choices.class)}{select('programId', 'Program', choices.program)}{select('stateId', 'State', choices.state)}{select('subjectIds', 'Subjects', choices.subject, true)}{select('facultyIds', 'Published instructors', choices.faculty, true)}{select('linkedBookIds', 'Linked published books', choices.books, true)}<MediaPicker purpose="course_thumbnail" label="Course thumbnail" value={form.thumbnailId} onChange={v => change('thumbnailId', v)} /><div className="space-y-2"><h3 className="font-bold text-sm">Syllabus sections</h3>{form.syllabus.map((s, i) => <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" key={i}><AdminInput aria-label={'Section key ' + (i + 1)} className={css} value={s.key} onChange={e => change('syllabus', form.syllabus.map((x, j) => j === i ? {
                ...x,
                key: e.target.value
              } : x))} /><AdminInput aria-label={'Section title ' + (i + 1)} className={css} value={s.title} onChange={e => change('syllabus', form.syllabus.map((x, j) => j === i ? {
                ...x,
                title: e.target.value
              } : x))} /><button type="button" onClick={() => change('syllabus', form.syllabus.filter((_, j) => j !== i))}>Remove section</button></div>)}<button type="button" onClick={() => change('syllabus', [...form.syllabus, {
              key: '',
              title: '',
              sortOrder: form.syllabus.length
            }])}>Add section</button></div>{check('rightsConfirmed', 'Licensing and source evidence confirmed')}{field('rightsNote', 'Licensing evidence / source note')}</>}
      {kind === 'lessons' && <>{field('title', 'Lesson title')}{select('subjectKey', 'Syllabus section', (course.syllabus ?? []).map(s => ({
            id: s.key,
            name: s.title
          })))}{field('sortOrder', 'Lesson order', 'number')}{field('description', 'Summary')}{select('linkedBookIds', 'Linked course books', choices.books.filter(b => (course.linkedBookIds ?? []).includes(b.id)), true)}<AdminField className="block text-xs">Authored lesson content<AdminTextarea className={css} value={form.content} onChange={e => change('content', e.target.value)} /></AdminField><MediaPicker purpose="lesson_document" label="Lesson PDF" value={form.documentAssetId} onChange={v => change('documentAssetId', v)} />{check('previewAllowed', 'Explicitly allow this lesson as a public preview')}<MediaPicker purpose="lesson_video" label="Lesson video" value={form.videoAssetId} onChange={v => change('videoAssetId', v)} /><p className="text-xs">MP4 H.264 with optional AAC audio. Uploads must pass inspection and scanning. Unpublish the course before replacing a lesson; existing referenced files remain protected.</p></>}
      {kind === 'plans' && <>{field('name', 'Plan name')}{field('sortOrder', 'Plan display order', 'number')}<AdminField className="block text-xs">Plan benefits (one per line)<AdminTextarea aria-label="Plan benefits" className={css} value={(form.features||[]).join('\n')} onChange={e=>change('features',e.target.value.split('\n'))}/></AdminField>{check('popular','Highlight this plan')}{field('priceMinor', 'INR price in minor units', 'number')}<p>New paid plans default to 12 calendar months when both duration fields are blank. Existing day plans keep their duration. Choose one unit; create a replacement plan to change units.</p>{field('durationDays', 'Explicit access duration in days', 'number')}{field('durationMonths', 'Access duration in calendar months', 'number')}{select('eligibility', 'Approved eligibility', [{
            id: 'verified_account',
            name: 'Verified active account'
          }])}{check('rulesApproved', 'I confirm price, duration and eligibility are approved')}<p className="text-xs">Prepaid access only. No recurring billing, free enrollment or renewal policy is enabled.</p></>}
      {kind !== 'courses' && <AdminField className="block text-xs">Status<AdminSelect aria-label="Status" className={css} value={form.status} onChange={e => change('status', e.target.value)}>{(kind === 'plans' ? ['draft', 'active', 'archived'] : ['draft', 'published', 'locked', 'archived']).map(v => <option key={v}>{v}</option>)}</AdminSelect></AdminField>}
      <div className="flex gap-3"><button disabled={busy} className="bg-[#0A1D3F] text-white p-2 rounded-lg">Save {kind.slice(0, -1)}</button><button type="button" onClick={() => setForm(null)}>Cancel</button></div>
    </form></div>}
  </div>;
}
export function AdminEnrollmentsPage() {
  const {
      can
    } = useAuth(),
    [rows, setRows] = useState([]),
    [error, setError] = useState(''),
    [state, setState] = useState('all'),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [version, setVersion] = useState(0),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    httpClient.request('/admin/enrollments?state=' + state + '&page=' + page, {
      signal: controller.signal
    }).then(r => {
      setRows(r.data);
      setTotal(r.meta.total);
    }).catch(e => {
      if (e.code !== 'ABORTED') setError(e.message);
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [state, page, version]);
  async function revoke(row) {
    const reason = prompt('Reason for revoking this enrollment');
    if (!reason?.trim()) return;
    try {
      await authenticatedWrite('/admin/entitlements/' + row.id + '/revoke', {
        kind: 'course',
        reason,
        expectedRevision: row.revision
      });
      setVersion(v => v + 1);
    } catch (e) {
      setError(e.message);
    }
  }
  return <div className="space-y-4"><header className="bg-white border p-5 rounded-2xl"><h1 className="font-bold text-xl text-[#0A1D3F]">Enrollment Review</h1><p className="text-xs">Manual access grants are disabled. Revocation never marks an order paid or issues a refund.</p></header><AdminSelect aria-label="Enrollment status" value={state} onChange={e => {
      setState(e.target.value);
      setPage(1);
    }} className={css}>{['all', 'active', 'expired', 'revoked'].map(s => <option key={s}>{s}</option>)}</AdminSelect>{error && <p role="alert">{error}</p>}{busy && <p role="status">Loading…</p>}<div className="bg-white border rounded-2xl overflow-x-auto"><table className="w-full text-xs"><thead><tr>{['User reference', 'Course', 'Source order', 'Expires', 'Status', 'Actions'].map(h => <th className="p-3 text-left" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr className="border-t" key={r.id}><td className="p-3">{String(r.userId)}</td><td>{r.course.title}</td><td className="p-3 break-all">{String(r.orderId)}{r.simulated && <span className="block">SIMULATED TEST</span>}</td><td className="p-3">{new Date(r.expiresAt).toLocaleString()}</td><td>{r.state}</td><td>{can('access.revoke') && r.state !== 'revoked' && <button onClick={() => revoke(r)}>Revoke access</button>}</td></tr>)}</tbody></table>{!busy && !rows.length && <p className="p-5">No enrollments found.</p>}</div><div className="flex gap-3"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page}</span><button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button></div></div>;
}
