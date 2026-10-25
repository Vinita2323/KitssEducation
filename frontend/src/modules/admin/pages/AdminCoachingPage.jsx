import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { readOptions } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { MediaPicker } from '../components/MediaPicker';
const css = 'w-full p-2 border border-[#E6E8EC] rounded-xl bg-[#F7F8FA] text-sm';
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
  const base = kind === 'courses' ? '/admin/coaching/courses' : '/admin/coaching/courses/' + course.id + '/' + kind;
  const writable = can(kind === 'plans' ? 'commerce.plans.write' : 'learning.write');
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
    Promise.all([...'language subject board class program state'.split(' ').map(kind => readOptions('/taxonomies', {
      kind
    })), readOptions('/public/faculty', {}), readOptions('/books', {})]).then(([language, subject, board, grade, program, state, faculty, books]) => setChoices({
      language,
      subject,
      board,
      class: grade,
      program,
      state,
      faculty,
      books
    })).catch(e => setError(e.message));
  }, []);
  const open = row => {
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
        if (payload.durationDays === '') delete payload.durationDays;else payload.durationDays = Number(payload.durationDays);
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
  const field = (key, label, type = 'text') => <label className="block text-xs" key={key}>{label}<input aria-label={label} className={css} type={type} value={form[key] ?? ''} onChange={e => change(key, e.target.value)} required={['title', 'name'].includes(key)} /></label>;
  const check = (key, label) => <label className="flex gap-2 items-center text-xs"><input type="checkbox" checked={!!form[key]} onChange={e => change(key, e.target.checked)} />{label}</label>;
  const select = (key, label, options, multiple = false) => <label className="block text-xs">{label}<select aria-label={label} className={css} multiple={multiple} value={form[key] ?? (multiple ? [] : '')} onChange={e => change(key, multiple ? [...e.target.selectedOptions].map(o => o.value) : e.target.value || null)}>{!multiple && <option value="">Select explicitly</option>}{options.map(o => <option key={o.id} value={o.id}>{o.label ?? o.title ?? o.name}</option>)}</select></label>;
  return <div className="space-y-4 text-[#0A1D3F] min-w-0">
    <header className="bg-white border rounded-2xl p-5 flex flex-wrap justify-between gap-3"><div><h1 className="text-xl font-bold">Coaching Management</h1><p className="text-xs text-[#667085]">{course ? course.title : 'Courses, lessons and explicitly approved prepaid plans'}</p></div>{writable && <button disabled={busy} onClick={() => open()} className="bg-[#0A1D3F] text-white rounded-xl px-4 py-2">Add {kind.slice(0, -1)}</button>}</header>
    {course && <nav className="flex flex-wrap gap-2"><button onClick={() => {
        setCourse(null);
        setKind('courses');
        setPage(1);
      }}>All courses</button>{['lessons', 'plans'].filter(k => can(k === 'plans' ? 'commerce.read' : 'learning.read')).map(k => <button key={k} className="p-2 border rounded-lg bg-white" onClick={() => {
        setKind(k);
        setPage(1);
        setQ('');
      }}>{k === 'lessons' ? 'Lessons' : 'Course plans'}</button>)}</nav>}
    <input aria-label="Search coaching" className={css} placeholder="Search titles" value={q} onChange={e => {
      setQ(e.target.value);
      setPage(1);
    }} />
    {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">{error}</p>}{busy && <p role="status">Loading…</p>}
    <div className="bg-white border rounded-2xl overflow-x-auto"><table className="w-full text-xs"><thead><tr>{['Title / name', 'Status', 'Revision', 'Actions'].map(v => <th className="p-3 text-left" key={v}>{v}</th>)}</tr></thead><tbody>{rows.map(row => <tr className="border-t" key={row.id}><td className="p-3 min-w-32">{row.title ?? row.name}</td><td>{row.status}</td><td>{row.revision}</td><td className="p-3"><div className="flex flex-wrap gap-3">{kind === 'courses' && <button onClick={() => {
                  setCourse(row);
                  setKind('lessons');
                  setPage(1);
                  setQ('');
                }}>Manage lessons</button>}{writable && row.status !== 'archived' && <><button disabled={busy} onClick={() => open(row)}>Edit</button><button disabled={busy} onClick={() => archive(row)}>Archive</button></>}{kind === 'courses' && can('learning.publish') && row.status !== 'archived' && <button disabled={busy} onClick={() => publish(row)}>{row.status === 'published' ? 'Unpublish' : 'Publish'}</button>}</div></td></tr>)}</tbody></table>{!busy && !rows.length && <p className="p-6 text-center">No {kind} found.</p>}</div>
    <div className="flex gap-3 text-sm"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} · {total} records</span><button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button></div>
    {form && <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 flex items-center justify-center"><form onSubmit={save} className="bg-white p-5 rounded-2xl space-y-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto"><h2 className="font-bold">{editing ? 'Edit' : 'Add'} {kind.slice(0, -1)}</h2>{error && <p role="alert" className="text-red-700">{error}</p>}
      {kind === 'courses' && <>{['whatYouWillLearn','benefits'].map(key=><label key={key} className="block text-xs">{key==='benefits'?'Course benefits':'Learning outcomes'} (one per line)<textarea aria-label={key==='benefits'?'Course benefits':'Learning outcomes'} className={css} value={(form[key]||[]).join('\n')} onChange={e=>change(key,e.target.value.split('\n'))}/></label>)}{field('title', 'Course title')}{field('category', 'Category')}<label className="block text-xs">Description<textarea className={css} value={form.description} onChange={e => change('description', e.target.value)} /></label>{select('languageId', 'Language', choices.language)}{select('boardId', 'Board', choices.board)}{select('classId', 'Educational level', choices.class)}{select('programId', 'Program', choices.program)}{select('stateId', 'State', choices.state)}{select('subjectIds', 'Subjects', choices.subject, true)}{select('facultyIds', 'Published instructors', choices.faculty, true)}{select('linkedBookIds', 'Linked published books', choices.books, true)}<MediaPicker purpose="course_thumbnail" label="Course thumbnail" value={form.thumbnailId} onChange={v => change('thumbnailId', v)} /><div className="space-y-2"><h3 className="font-bold text-sm">Syllabus sections</h3>{form.syllabus.map((s, i) => <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" key={i}><input aria-label={'Section key ' + (i + 1)} className={css} value={s.key} onChange={e => change('syllabus', form.syllabus.map((x, j) => j === i ? {
                ...x,
                key: e.target.value
              } : x))} /><input aria-label={'Section title ' + (i + 1)} className={css} value={s.title} onChange={e => change('syllabus', form.syllabus.map((x, j) => j === i ? {
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
          })))}{field('sortOrder', 'Lesson order', 'number')}{field('description', 'Summary')}{select('linkedBookIds', 'Linked course books', choices.books.filter(b => (course.linkedBookIds ?? []).includes(b.id)), true)}<label className="block text-xs">Authored lesson content<textarea className={css} value={form.content} onChange={e => change('content', e.target.value)} /></label><MediaPicker purpose="lesson_document" label="Lesson PDF" value={form.documentAssetId} onChange={v => change('documentAssetId', v)} />{check('previewAllowed', 'Explicitly allow this lesson as a public preview')}<MediaPicker purpose="lesson_video" label="Lesson video" value={form.videoAssetId} onChange={v => change('videoAssetId', v)} /><p className="text-xs">MP4 H.264 with optional AAC audio. Uploads must pass inspection and scanning. Unpublish the course before replacing a lesson; existing referenced files remain protected.</p></>}
      {kind === 'plans' && <>{field('name', 'Plan name')}{field('sortOrder', 'Plan display order', 'number')}<label className="block text-xs">Plan benefits (one per line)<textarea aria-label="Plan benefits" className={css} value={(form.features||[]).join('\n')} onChange={e=>change('features',e.target.value.split('\n'))}/></label>{check('popular','Highlight this plan')}{field('priceMinor', 'INR price in minor units', 'number')}{field('durationDays', 'Explicit access duration in days', 'number')}{select('eligibility', 'Approved eligibility', [{
            id: 'verified_account',
            name: 'Verified active account'
          }])}{check('rulesApproved', 'I confirm price, duration and eligibility are approved')}<p className="text-xs">Prepaid access only. No recurring billing, free enrollment or renewal policy is enabled.</p></>}
      {kind !== 'courses' && <label className="block text-xs">Status<select aria-label="Status" className={css} value={form.status} onChange={e => change('status', e.target.value)}>{(kind === 'plans' ? ['draft', 'active', 'archived'] : ['draft', 'published', 'locked', 'archived']).map(v => <option key={v}>{v}</option>)}</select></label>}
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
  return <div className="space-y-4"><header className="bg-white border p-5 rounded-2xl"><h1 className="font-bold text-xl text-[#0A1D3F]">Enrollment Review</h1><p className="text-xs">Manual access grants are disabled. Revocation never marks an order paid or issues a refund.</p></header><select aria-label="Enrollment status" value={state} onChange={e => {
      setState(e.target.value);
      setPage(1);
    }} className={css}>{['all', 'active', 'expired', 'revoked'].map(s => <option key={s}>{s}</option>)}</select>{error && <p role="alert">{error}</p>}{busy && <p role="status">Loading…</p>}<div className="bg-white border rounded-2xl overflow-x-auto"><table className="w-full text-xs"><thead><tr>{['User reference', 'Course', 'Source order', 'Expires', 'Status', 'Actions'].map(h => <th className="p-3 text-left" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr className="border-t" key={r.id}><td className="p-3">{String(r.userId)}</td><td>{r.course.title}</td><td className="p-3 break-all">{String(r.orderId)}{r.simulated && <span className="block">SIMULATED TEST</span>}</td><td className="p-3">{new Date(r.expiresAt).toLocaleString()}</td><td>{r.state}</td><td>{can('learning.grants.manage') && r.state !== 'revoked' && <button onClick={() => revoke(r)}>Revoke access</button>}</td></tr>)}</tbody></table>{!busy && !rows.length && <p className="p-5">No enrollments found.</p>}</div><div className="flex gap-3"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page}</span><button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button></div></div>;
}
