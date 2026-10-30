import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '../components/AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, CheckCircle2, Circle, FileText, GraduationCap, Plus, RotateCcw, Star, Type, UploadCloud, Users, Video } from 'lucide-react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { readOptions } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { MediaPicker } from '../components/MediaPicker';
import { ContentOwnership } from '../components/ContentOwnership';
import { rupees } from '../components/bookReadiness';
import { courseRequirements, courseState, duration, lessonStatus, planLabel, planStatus, sectionKeys } from '../components/coachingDisplay';
const css = 'w-full p-2 border border-[#E6E8EC] rounded-xl bg-[#F7F8FA] text-sm';
const mediaUrl = id => (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '') + '/media/' + encodeURIComponent(id) + '/content';
const choiceSources = [
  ...'language subject board class state'.split(' ').map(kind => ({ key: kind, path: '/taxonomies', filters: { kind }, label: { language: 'languages', subject: 'subjects', board: 'boards', class: 'educational levels', state: 'states' }[kind] })),
  { key: 'category', path: '/taxonomies', filters: { kind: 'course_category' }, label: 'course categories' },
  { key: 'faculty', path: '/public/faculty', label: 'published instructors' },
  { key: 'books', path: '/books', label: 'published books' },
];
const choiceKeys = { languageId: 'language', subjectIds: 'subject', boardId: 'board', classId: 'class', stateId: 'state', facultyIds: 'faculty', linkedBookIds: 'books' };
// Program stays on existing courses but is no longer edited here: students never see it.
const blank = {
  courses: { title: '', description: '', whatYouWillLearn: [], benefits: [], category: '', languageId: null, boardId: null, classId: null, stateId: null, subjectIds: [], facultyIds: [], linkedBookIds: [], thumbnailId: null, syllabus: [], rightsConfirmed: false, rightsNote: '' },
  lessons: { title: '', subjectKey: '', sortOrder: 0, description: '', content: '', documentAssetId: null, videoAssetId: null, linkedBookIds: [], previewAllowed: false, status: 'draft' },
  plans: { name: '', features: [], popular: false, sortOrder: 0, free: false, price: '', durationValue: '', durationUnit: 'months', status: 'draft' }
};
const singular = { courses: 'course', lessons: 'lesson', plans: 'plan' };

function Pill({ label, tone }) { return <span className={'inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ' + tone}>{label}</span>; }
function Section({ title, hint, children }) {
  return <section className="rounded-2xl border border-[#E6E8EC] p-4 space-y-3" aria-label={title}>
    <div><h3 className="font-bold">{title}</h3>{hint && <p className="text-sm text-[#53647c] mt-0.5">{hint}</p>}</div>{children}
  </section>;
}
function Confirm({ title, children, label, danger, busy, onConfirm, onClose }) {
  const ref = useDialogFocus(true, onClose);
  return <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-4 flex items-center justify-center"><div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3 text-[#0A1D3F]">
    <h2 className="text-lg font-bold">{title}</h2><div className="text-sm space-y-2">{children}</div>
    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose}>Cancel</button>{onConfirm && <button type="button" disabled={busy} onClick={onConfirm} className={(danger ? 'bg-red-600' : 'bg-[#0A1D3F]') + ' text-white rounded-xl px-4 py-2 font-semibold disabled:opacity-50'}>{label}</button>}</div>
  </div></div>;
}
function Readiness({ items }) {
  const done = items.filter(([, ok]) => ok).length;
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{done === items.length ? 'Ready to publish' : `Ready to publish: ${done} of ${items.length}`}</span></div>
    <div className="h-2 rounded-full bg-[#E6E8EC] overflow-hidden" aria-hidden="true"><div className="h-full bg-emerald-500" style={{ width: (done / items.length * 100) + '%' }} /></div>
    <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">{items.map(([label, ok]) => <li key={label} className={'flex items-center gap-1.5 ' + (ok ? 'text-emerald-800' : 'text-[#53647c]')}>{ok ? <CheckCircle2 aria-hidden="true" size={14} /> : <Circle aria-hidden="true" size={14} />}<span>{(ok ? 'Done: ' : 'Missing: ') + label}</span></li>)}</ul>
  </div>;
}

export function AdminCoachingPage() {
  const { can } = useAuth(),
    [rows, setRows] = useState([]), [course, setCourse] = useState(null), [detail, setDetail] = useState(null), [kind, setKind] = useState('courses'),
    [form, setForm] = useState(null), [editing, setEditing] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0), [page, setPage] = useState(1), [total, setTotal] = useState(0), [q, setQ] = useState(''), [dialog, setDialog] = useState(null), [editorKind, setEditorKind] = useState('courses'),
    [choices, setChoices] = useState({ language: [], subject: [], board: [], class: [], state: [], category: [], faculty: [], books: [] });
  const [choiceErrors, setChoiceErrors] = useState({}), [choiceLoading, setChoiceLoading] = useState({}), [choiceVersion, setChoiceVersion] = useState(0);
  const base = kind === 'courses' ? '/admin/coaching/courses' : '/admin/coaching/courses/' + course.id + '/' + kind;
  const creatable = can(kind === 'plans' ? 'commerce.plans.write' : 'coaching.create');
  const archivable = can(kind === 'plans' ? 'commerce.plans.write' : 'coaching.archive');
  const writable = can(kind === 'plans' ? 'commerce.plans.write' : 'coaching.edit');
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError('');
    httpClient.request(base + '?page=' + page + '&q=' + encodeURIComponent(q), { signal: controller.signal })
      .then(r => { setRows(r.data); setTotal(r.meta.total); })
      .catch(e => { if (e.code !== 'ABORTED') { setRows([]); setError(e.message); } })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [base, page, q, version]);
  // The course workspace shows the saved course with its lesson, plan and student counts.
  useEffect(() => {
    if (!course) { setDetail(null); return; }
    const controller = new AbortController();
    httpClient.request('/admin/coaching/courses/' + course.id, { signal: controller.signal }).then(r => setDetail(r.data)).catch(e => { if (e.code !== 'ABORTED') setError(e.message); });
    return () => controller.abort();
  }, [course?.id, version]);
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
  // Clear rows on switching so one table never renders another table's records while loading.
  const go = (nextKind, nextCourse = course) => { if (nextKind !== kind || nextCourse?.id !== course?.id) setRows([]); setCourse(nextCourse); setKind(nextKind); setPage(1); setQ(''); };
  // The editor can open a course from inside its workspace without leaving the lessons or plans tab.
  const open = (row, as = kind) => {
    setChoiceVersion(value => value + 1);
    setEditing(row ?? null); setEditorKind(as);
    const defaults = structuredClone(blank[as]);
    if (row) for (const key of Object.keys(defaults)) if (row[key] !== undefined) defaults[key] = row[key];
    if (as === 'plans' && row) Object.assign(defaults, { free: row.priceMinor === 0, price: row.priceMinor > 0 ? String(row.priceMinor / 100) : '', durationValue: String(row.durationMonths ?? row.durationDays ?? ''), durationUnit: row.durationDays ? 'days' : 'months' });
    if (!row && as !== 'courses') defaults.sortOrder = rows.reduce((max, r) => Math.max(max, (r.sortOrder ?? 0) + 1), total);
    setForm(defaults);
  };
  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const write = async (work, after) => { setBusy(true); setError(''); try { await work(); after?.(); setVersion(v => v + 1); } catch (e) { setError(e.message); setDialog(null); } finally { setBusy(false); } };

  async function save(e) {
    e.preventDefault(); setError('');
    let payload = { ...form };
    const kind = editorKind, path = kind === 'courses' ? '/admin/coaching/courses' : base;
    if (kind === 'courses') payload.syllabus = sectionKeys(form.syllabus.filter(s => s.title.trim()));
    if (kind === 'plans') {
      const { free, price, durationValue, durationUnit, ...rest } = form; payload = rest;
      payload.sortOrder = Number(payload.sortOrder);
      if (free) payload.priceMinor = 0; else if (price !== '') payload.priceMinor = Math.round(Number(price) * 100);
      if (durationValue !== '') payload[durationUnit === 'days' ? 'durationDays' : 'durationMonths'] = Number(durationValue);
      payload.eligibility = 'verified_account';
      // Putting a plan on sale is the approval of its price and duration (commerce.plans.write).
      if (payload.status === 'active') payload.rulesApproved = true;
      if (payload.status === 'active' && (payload.priceMinor ?? editing?.priceMinor) === undefined) { setError('Set a price, or tick “This plan is free”, before putting the plan on sale.'); return; }
      if (payload.status === 'active' && durationValue === '' && !editing?.durationDays && !editing?.durationMonths && !free) { setError('Set how long access lasts before putting the plan on sale.'); return; }
    }
    if (kind === 'lessons') payload.sortOrder = Number(payload.sortOrder);
    if (editing) payload.expectedRevision = editing.revision;
    setBusy(true);
    try { await authenticatedWrite(path + (editing ? '/' + editing.id : ''), payload, editing ? 'PATCH' : 'POST'); setForm(null); setVersion(v => v + 1); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const remove = (row, path = base, what = kind) => setDialog({
    title: 'Archive ' + singular[what] + '?', label: 'Yes, archive', danger: true,
    body: what === 'courses' ? [`“${row.title}” leaves the catalogue and can no longer be bought.`, `${row.stats?.activeStudents ?? 0} enrolled student${row.stats?.activeStudents === 1 ? '' : 's'} keep learning until their access ends. You can restore it later.`]
      : what === 'lessons' ? [`Students can no longer open “${row.title}”. Their progress is kept.`] : [`Nobody new can buy “${row.name}”. Students who bought it keep their access period.`],
    run: () => write(() => authenticatedWrite(path + '/' + row.id, { expectedRevision: row.revision }, 'DELETE'), () => setDialog(null)) });
  const restore = row => write(() => authenticatedWrite(base + '/' + row.id + '/restore', { expectedRevision: row.revision }));
  const publishNow = (row, value) => write(() => authenticatedWrite('/admin/coaching/courses/' + row.id + '/publish', { expectedRevision: row.revision, publish: value }), () => setDialog(null));
  const publish = row => {
    if (row.status === 'published' && !row.publication?.changesPending) return setDialog({ title: 'Unpublish course?', label: 'Confirm unpublish', body: [`“${row.title}” leaves the catalogue and nobody new can enroll or buy a plan.`, `${row.stats?.activeStudents ?? 0} enrolled student${row.stats?.activeStudents === 1 ? '' : 's'} keep learning until their access ends. Publish again at any time.`], run: () => publishNow(row, false) });
    const missing = courseRequirements(row, row.stats).filter(([, ok]) => !ok);
    if (missing.length) return setDialog({ title: 'Course is not ready to publish', body: [<Readiness key="r" items={courseRequirements(row, row.stats)} />] });
    publishNow(row, true);
  };
  const move = (list, i, by) => {
    const order = [...list]; [order[i], order[i + by]] = [order[i + by], order[i]];
    write(async () => { for (const [n, row] of order.entries()) if (row.sortOrder !== n) await authenticatedWrite(base + '/' + row.id, { expectedRevision: row.revision, sortOrder: n }, 'PATCH'); });
  };

  const field = (key, label, type = 'text') => <AdminField className="block" key={key}>{label}<AdminInput aria-label={label} className={css} type={type} value={form[key] ?? ''} onChange={e => change(key, e.target.value)} required={['title', 'name'].includes(key)} /></AdminField>;
  const check = (key, label) => <AdminField className="flex gap-2 items-center"><AdminInput type="checkbox" checked={!!form[key]} onChange={e => change(key, e.target.checked)} />{label}</AdminField>;
  const select = (key, label, options, multiple = false) => {
    const source = choiceKeys[key], loading = choiceLoading[source], failed = choiceErrors[source];
    return <AdminField className="block">{label}<AdminSelect aria-label={label} className={css} multiple={multiple} disabled={loading || failed} aria-busy={Boolean(loading)} value={form[key] ?? (multiple ? [] : '')} onChange={e => change(key, multiple ? [...e.target.selectedOptions].map(o => o.value) : e.target.value || null)}>{!multiple && <option value="">{loading ? 'Loading...' : failed ? 'Choices unavailable' : 'Select ' + label.toLowerCase()}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.label ?? o.title ?? o.name}</option>)}</AdminSelect>{!loading && !failed && !options.length && <span className="block mt-1 text-sm text-[#667085]">No {label.toLowerCase()} available.</span>}</AdminField>;
  };
  const lines = (key, label, hint) => <AdminField key={key} className="block" help={hint}>{label}<AdminTextarea aria-label={label} className={css} rows={3} value={(form[key] || []).join('\n')} onChange={e => change(key, e.target.value.split('\n'))} /></AdminField>;
  const choicesWarning = Object.keys(choiceErrors).length > 0 && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm"><p>Could not load: {choiceSources.filter(source => choiceErrors[source.key]).map(source => source.label).join(', ')}. Other choices remain available.</p><button type="button" disabled={Object.values(choiceLoading).some(Boolean)} className="mt-2 underline" onClick={() => setChoiceVersion(value => value + 1)}>Retry choices</button></div>;
  const editorDialog = useDialogFocus(Boolean(form), () => setForm(null));
  const live = detail?.status === 'published', liveSections = new Set(detail?.publication?.liveSectionKeys ?? []);
  const sectionTitle = key => (detail?.syllabus ?? []).find(s => s.key === key)?.title ?? key;
  const categories = [...new Set([...choices.category.map(c => c.label), ...(form?.category ? [form.category] : [])])];

  const courseActions = row => <>
    <button type="button" onClick={() => go('lessons', row)}>Manage lessons</button>
    {can('coaching.publish') && row.status !== 'archived' && row.publication?.changesPending && <button type="button" disabled={busy} className="inline-flex items-center gap-1 text-amber-800" onClick={() => publish(row)}><UploadCloud aria-hidden="true" size={15} />Publish changes</button>}
    {can('coaching.publish') && row.status !== 'archived' && <button type="button" disabled={busy} onClick={() => row.status === 'published' ? publish({ ...row, publication: { ...row.publication, changesPending: false } }) : publish(row)}>{row.status === 'published' ? 'Unpublish' : 'Publish'}</button>}
    {writable && row.status !== 'archived' && <button type="button" disabled={busy} onClick={() => open(row)}>Edit</button>}
    {archivable && row.status !== 'archived' && <button type="button" disabled={busy} className="text-red-700" onClick={() => remove(row)}>Archive</button>}
    {archivable && row.status === 'archived' && <button type="button" disabled={busy} className="inline-flex items-center gap-1" onClick={() => restore(row)}><RotateCcw aria-hidden="true" size={15} />Restore</button>}
  </>;
  const orderButtons = (list, i, label) => <div className="flex gap-1">
    <button type="button" aria-label={'Move ' + label + ' up'} disabled={busy || !writable || i === 0} onClick={() => move(list, i, -1)} className="!px-2"><ArrowUp aria-hidden="true" size={14} /></button>
    <button type="button" aria-label={'Move ' + label + ' down'} disabled={busy || !writable || i === list.length - 1} onClick={() => move(list, i, 1)} className="!px-2"><ArrowDown aria-hidden="true" size={14} /></button>
  </div>;

  return <div className="space-y-5 text-[#0A1D3F] min-w-0">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><h1 className="flex items-center gap-2"><GraduationCap aria-hidden="true" className="w-6 h-6 text-[#FF8A00] shrink-0" /><span>Coaching Management</span></h1>
        <p className="text-sm mt-1">{course ? 'Build the syllabus, add lessons and set the plans students can buy.' : 'Create courses, publish lessons and sell plans. Enrolled students always keep their access period.'}</p></div>
      {creatable && <button disabled={busy} onClick={() => open()} className="bg-[#FF8A00] hover:bg-[#E67C00] text-white rounded-xl px-4 py-2.5 font-bold inline-flex items-center gap-1.5"><Plus aria-hidden="true" size={16} />Add {singular[kind]}</button>}
    </header>

    {course && <section className="bg-white border rounded-2xl p-4 sm:p-5 space-y-4" aria-label="Course workspace">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-28 aspect-video rounded-xl bg-gradient-to-br from-[#0A1D3F] to-[#133C8B] grid place-items-center overflow-hidden shrink-0">{detail?.thumbnailId && can('media.read') ? <img src={mediaUrl(detail.thumbnailId)} alt="" className="w-full h-full object-cover" /> : <GraduationCap aria-hidden="true" className="text-white" />}</div>
        <div className="flex-1 min-w-[12rem]">
          <h2 className="text-lg font-bold break-words">{detail?.title ?? course.title}</h2>
          <p className="text-sm text-[#53647c]">{[detail?.category, detail && `${detail.stats.lessons.published} of ${detail.stats.lessons.total} lessons published`, detail && `${detail.stats.activeStudents} active student${detail.stats.activeStudents === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</p>
          {detail && <div className="mt-2"><Pill {...courseState(detail)} /></div>}
        </div>
        {detail && <div className="flex flex-wrap gap-2">
          {can('coaching.publish') && detail.status === 'published' && detail.publication?.changesPending && <button type="button" disabled={busy} className="inline-flex items-center gap-1 text-amber-800" onClick={() => publish(detail)}><UploadCloud aria-hidden="true" size={15} />Publish changes</button>}
          {can('coaching.publish') && detail.status !== 'archived' && <button type="button" disabled={busy} onClick={() => publish(detail.status === 'published' ? { ...detail, publication: { ...detail.publication, changesPending: false } } : detail)}>{detail.status === 'published' ? 'Unpublish' : 'Publish'}</button>}
          {can('coaching.edit') && detail.status !== 'archived' && <button type="button" disabled={busy} onClick={() => open(detail, 'courses')}>Edit course</button>}
        </div>}
      </div>
      {detail && detail.status !== 'published' && detail.status !== 'archived' && <Readiness items={courseRequirements(detail, detail.stats)} />}
      {live && <p className="text-sm text-[#53647c]">This course is live. Lesson and plan changes apply straight away; course details and new sections go live when you publish changes.</p>}
      <nav className="flex flex-wrap gap-2 border-t border-[#E6E8EC] pt-3" aria-label="Course sections">
        <button type="button" onClick={() => go('courses', null)} className="inline-flex items-center gap-1"><ArrowLeft aria-hidden="true" size={15} />All courses</button>
        {['lessons', 'plans'].filter(k => can(k === 'plans' ? 'commerce.read' : 'coaching.read')).map(k => <button key={k} type="button" aria-pressed={kind === k} onClick={() => go(k)} className={kind === k ? '!bg-[#0A1D3F] !text-white !border-[#0A1D3F]' : ''}>{k === 'lessons' ? 'Lessons' : 'Course plans'}</button>)}
      </nav>
    </section>}

    <AdminInput aria-label="Search coaching" className={css} placeholder={kind === 'plans' ? 'Search plan names' : 'Search titles'} value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
    {error && <p role="alert">{error}</p>}{busy && <p role="status" className="text-sm">Loading…</p>}

    <div className="bg-white border rounded-2xl overflow-x-auto">
      {kind === 'courses' && <table className="w-full text-sm"><thead><tr><th className="text-left">Course</th><th className="text-left">Lessons &amp; plans</th><th className="text-left">Students</th><th className="text-left">Status</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}>
        <td className="min-w-[15rem]"><div className="flex items-start gap-3"><div className="w-16 aspect-video rounded-lg bg-gradient-to-br from-[#0A1D3F] to-[#133C8B] grid place-items-center overflow-hidden shrink-0">{row.thumbnailId && can('media.read') ? <img src={mediaUrl(row.thumbnailId)} alt="" loading="lazy" className="w-full h-full object-cover" /> : <GraduationCap aria-hidden="true" size={16} className="text-white" />}</div><div className="min-w-0"><p className="font-bold break-words">{row.title}</p><p className="text-sm text-[#53647c]">{row.category || 'No category'}</p></div></div></td>
        <td className="min-w-[11rem]"><p>{row.stats ? `${row.stats.lessons.published} of ${row.stats.lessons.total} lessons published` : ''}</p><p className="text-sm text-[#53647c]">{row.stats?.activePlans.length ? row.stats.activePlans.slice(0, 2).map(planLabel).join(' · ') + (row.stats.activePlans.length > 2 ? ` +${row.stats.activePlans.length - 2} more` : '') : 'No plan on sale'}</p></td>
        <td className="whitespace-nowrap"><span className="inline-flex items-center gap-1"><Users aria-hidden="true" size={14} />{row.stats?.activeStudents ?? 0}</span></td>
        <td><Pill {...courseState(row)} /></td>
        <td><div className="flex flex-wrap justify-end gap-2 ml-auto max-w-[19rem]">{courseActions(row)}</div></td>
      </tr>)}</tbody></table>}

      {kind === 'lessons' && <table className="w-full text-sm"><thead><tr><th className="text-left">Order</th><th className="text-left">Lesson</th><th className="text-left">Section</th><th className="text-left">Content</th><th className="text-left">Status</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.map((row, i) => <tr key={row.id}>
        <td>{row.status !== 'archived' && orderButtons(rows, i, row.title)}</td>
        <td className="font-semibold min-w-[12rem] break-words">{row.title}</td>
        <td className="text-[#53647c]">{sectionTitle(row.subjectKey)}</td>
        <td><div className="flex flex-wrap gap-1.5 text-xs">{row.videoAssetId && <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5FB] px-2 py-0.5"><Video aria-hidden="true" size={12} />Video</span>}{row.documentAssetId && <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5FB] px-2 py-0.5"><FileText aria-hidden="true" size={12} />PDF</span>}{row.content?.trim() && <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5FB] px-2 py-0.5"><Type aria-hidden="true" size={12} />Text</span>}{(row.linkedBookIds ?? []).length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5FB] px-2 py-0.5"><BookOpen aria-hidden="true" size={12} />Book</span>}{row.previewAllowed && <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-0.5">Free preview</span>}</div></td>
        <td><Pill label={(lessonStatus[row.status] ?? [row.status])[0]} tone={(lessonStatus[row.status] ?? [, lessonStatus.draft[1]])[1]} /></td>
        <td><div className="flex flex-wrap justify-end gap-2">{writable && row.status !== 'archived' && <button type="button" disabled={busy} onClick={() => open(row)}>Edit</button>}{archivable && row.status !== 'archived' && <button type="button" disabled={busy} className="text-red-700" onClick={() => remove(row)}>Archive</button>}{archivable && row.status === 'archived' && <button type="button" disabled={busy} onClick={() => restore(row)}>Restore</button>}</div></td>
      </tr>)}</tbody></table>}

      {kind === 'plans' && <table className="w-full text-sm"><thead><tr><th className="text-left">Order</th><th className="text-left">Plan</th><th className="text-left">Price &amp; access</th><th className="text-left">Status</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.map((row, i) => <tr key={row.id}>
        <td>{row.status !== 'archived' && orderButtons(rows, i, row.name)}</td>
        <td className="font-semibold min-w-[12rem] break-words">{row.name}</td>
        <td><span className="font-semibold">{row.priceMinor === undefined ? 'No price yet' : planLabel(row)}</span>{row.popular && <span className="ml-2 inline-flex items-center gap-1 text-xs rounded-full bg-amber-50 text-amber-800 px-2 py-0.5"><Star aria-hidden="true" size={11} />Popular</span>}</td>
        <td><Pill label={(planStatus[row.status] ?? [row.status])[0]} tone={(planStatus[row.status] ?? [, planStatus.draft[1]])[1]} /></td>
        <td><div className="flex flex-wrap justify-end gap-2">{writable && row.status !== 'archived' && <button type="button" disabled={busy} onClick={() => open(row)}>Edit</button>}{archivable && row.status !== 'archived' && <button type="button" disabled={busy} className="text-red-700" onClick={() => remove(row)}>Archive</button>}{archivable && row.status === 'archived' && <button type="button" disabled={busy} onClick={() => restore(row)}>Restore</button>}</div></td>
      </tr>)}</tbody></table>}
      {!busy && !rows.length && <p className="p-6 text-center text-[#53647c]">{q ? `No ${kind} match “${q}”.` : kind === 'courses' ? 'No courses yet. Add your first course to get started.' : kind === 'lessons' ? 'No lessons yet. Add the first lesson to this course.' : 'No plans yet. Add a free or paid plan so students can enroll.'}</p>}
    </div>
    <div className="flex items-center gap-3 text-sm"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} · {total} records</span><button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button></div>
    {!form && choicesWarning}

    {dialog && <Confirm title={dialog.title} label={dialog.label} danger={dialog.danger} busy={busy} onConfirm={dialog.run} onClose={() => setDialog(null)}>{dialog.body.map((b, i) => typeof b === 'string' ? <p key={i}>{b}</p> : b)}</Confirm>}

    {form && <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-2 sm:p-4 flex items-center justify-center"><form ref={editorDialog} role="dialog" aria-modal="true" aria-label="Coaching editor" tabIndex={-1} onSubmit={save} className="bg-white rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-[#E6E8EC]"><h2 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} {singular[editorKind]}</h2>{editorKind === 'lessons' && live && <p className="text-sm text-[#53647c]">This course is live: saved changes to a published lesson are visible to students straight away.</p>}</div>
      <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {error && <p role="alert">{error}</p>}{choicesWarning}
        {editorKind === 'courses' && <>
          <Section title="Basics">
            {field('title', 'Course title')}
            <AdminField className="block" help={choices.category.length ? 'Students browse courses by category. Manage the list in Dropdown settings.' : 'Add course categories in Dropdown settings first.'}>Category<AdminSelect aria-label="Category" className={css} value={form.category || ''} onChange={e => change('category', e.target.value)}><option value="">{choiceLoading.category ? 'Loading...' : 'Select category'}</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</AdminSelect></AdminField>
            <AdminField className="block">Description<AdminTextarea className={css} rows={4} value={form.description} onChange={e => change('description', e.target.value)} /></AdminField>
          </Section>
          <Section title="Classification" hint="Students filter the catalogue by these.">
            <div className="grid sm:grid-cols-2 gap-3">{select('languageId', 'Language', choices.language)}{select('boardId', 'Board', choices.board)}{select('classId', 'Educational level', choices.class)}{select('stateId', 'State', choices.state)}</div>
            {select('subjectIds', 'Subjects', choices.subject, true)}
          </Section>
          <Section title="Teaching team & books" hint="Hold Ctrl (Cmd on Mac) to choose more than one.">{select('facultyIds', 'Published instructors', choices.faculty, true)}{select('linkedBookIds', 'Linked published books', choices.books, true)}</Section>
          <Section title="What students get">{lines('whatYouWillLearn', 'Learning outcomes', 'One per line. Shown on the course page.')}{lines('benefits', 'Course benefits', 'One per line.')}</Section>
          <Section title="Thumbnail"><div className="grid sm:grid-cols-[9rem_1fr] gap-3 items-start"><div className="w-36 aspect-video rounded-xl border bg-[#F7F8FA] grid place-items-center overflow-hidden text-xs text-[#53647c]">{form.thumbnailId && can('media.read') ? <img src={mediaUrl(form.thumbnailId)} alt="Selected course thumbnail" className="w-full h-full object-cover" /> : 'No thumbnail yet'}</div><MediaPicker purpose="course_thumbnail" label="Course thumbnail" value={form.thumbnailId} onChange={v => change('thumbnailId', v)} /></div></Section>
          <Section title="Syllabus sections" hint="Lessons are grouped under these sections, in this order.">
            {form.syllabus.length > 0 && <ol className="space-y-2">{form.syllabus.map((s, i) => <li key={i} className="flex gap-2 items-end">
              <AdminField className="flex-1" help="">{'Section ' + (i + 1)}<AdminInput aria-label={'Section title ' + (i + 1)} className={css} value={s.title} maxLength={160} onChange={e => change('syllabus', form.syllabus.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} /></AdminField>
              <button type="button" aria-label={'Move section ' + (i + 1) + ' up'} disabled={i === 0} className="!px-2" onClick={() => { const next = [...form.syllabus]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; change('syllabus', next); }}><ArrowUp aria-hidden="true" size={14} /></button>
              <button type="button" aria-label={'Move section ' + (i + 1) + ' down'} disabled={i === form.syllabus.length - 1} className="!px-2" onClick={() => { const next = [...form.syllabus]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; change('syllabus', next); }}><ArrowDown aria-hidden="true" size={14} /></button>
              <button type="button" className="text-red-700" onClick={() => change('syllabus', form.syllabus.filter((_, j) => j !== i))}>Remove section</button>
            </li>)}</ol>}
            <button type="button" className="inline-flex items-center gap-1" onClick={() => change('syllabus', [...form.syllabus, { key: '', title: '', sortOrder: form.syllabus.length }])}><Plus aria-hidden="true" size={14} />Add section</button>
          </Section>
          <ContentOwnership confirmed={form.rightsConfirmed} note={form.rightsNote} onChange={fields => setForm(previous => ({ ...previous, ...fields }))} />
        </>}

        {editorKind === 'lessons' && <>
          <Section title="Lesson">
            {field('title', 'Lesson title')}
            <AdminField className="block" help={live ? 'Sections marked “not live yet” go live when you publish the course changes.' : ''}>Syllabus section<AdminSelect aria-label="Syllabus section" className={css} value={form.subjectKey} onChange={e => change('subjectKey', e.target.value)}><option value="">Select syllabus section</option>{(detail?.syllabus ?? course.syllabus ?? []).map(s => <option key={s.key} value={s.key}>{s.title}{live && !liveSections.has(s.key) ? ' (not live yet)' : ''}</option>)}</AdminSelect></AdminField>
            {field('description', 'Summary')}
            <AdminField className="block">Status<AdminSelect aria-label="Status" className={css} value={form.status} onChange={e => change('status', e.target.value)}>{['draft', 'published', 'locked'].map(v => <option key={v} value={v}>{lessonStatus[v][0]}</option>)}</AdminSelect></AdminField>
            {check('previewAllowed', 'Free preview: anyone can open this lesson without enrolling')}
          </Section>
          <Section title="Content" hint="Add text, a video, a PDF, or any mix. Published lessons need at least one.">
            <AdminField className="block">Authored lesson content<AdminTextarea className={css} rows={5} value={form.content} onChange={e => change('content', e.target.value)} /></AdminField>
            <MediaPicker purpose="lesson_video" label="Lesson video" value={form.videoAssetId} onChange={v => change('videoAssetId', v)} />
            <p className="text-sm text-[#53647c]">MP4 (H.264, optional AAC audio). Videos are checked and virus-scanned before use.</p>
            <MediaPicker purpose="lesson_document" label="Lesson PDF" value={form.documentAssetId} onChange={v => change('documentAssetId', v)} />
            {select('linkedBookIds', 'Linked course books', choices.books.filter(b => (detail?.linkedBookIds ?? course.linkedBookIds ?? []).includes(b.id)), true)}
          </Section>
        </>}

        {editorKind === 'plans' && <>
          <Section title="Plan">
            {field('name', 'Plan name')}
            {lines('features', 'Plan benefits', 'One per line. Shown on the plan card.')}
            {check('popular', 'Highlight this plan')}
          </Section>
          <Section title="Price & access" hint="Prepaid access. Students can renew before it ends; the new period starts when the current one finishes.">
            {check('free', 'This plan is free')}
            <div className="grid sm:grid-cols-3 gap-3">
              {!form.free && <AdminField className="block" help="">Plan price (₹)<AdminInput aria-label="Plan price (₹)" type="number" min="0" step="0.01" inputMode="decimal" className={css} value={form.price} onChange={e => change('price', e.target.value)} /></AdminField>}
              <AdminField className="block" help="">Access duration<AdminInput aria-label="Access duration" type="number" min="1" step="1" className={css} value={form.durationValue} onChange={e => change('durationValue', e.target.value)} /></AdminField>
              <AdminField className="block" help={editing && (editing.durationDays || editing.durationMonths) ? 'Fixed for this plan. Create a new plan to switch units.' : ''}>Duration unit<AdminSelect aria-label="Duration unit" className={css} disabled={Boolean(editing && (editing.durationDays || editing.durationMonths))} value={form.durationUnit} onChange={e => change('durationUnit', e.target.value)}><option value="months">Months</option><option value="days">Days</option></AdminSelect></AdminField>
            </div>
            <AdminField className="block" help={form.status === 'active' ? 'Putting a plan on sale approves its price and duration.' : 'Draft plans are not shown to students.'}>Plan status<AdminSelect aria-label="Plan status" className={css} value={form.status} onChange={e => change('status', e.target.value)}><option value="draft">Draft</option><option value="active">On sale</option></AdminSelect></AdminField>
          </Section>
          <div role="region" className="rounded-2xl border-2 border-dashed border-[#E6E8EC] p-4" aria-label="Plan preview">
            <p className="text-xs font-semibold text-[#53647c] mb-2">Students will see</p>
            <div className={'rounded-xl border p-4 max-w-xs ' + (form.popular ? 'border-[#FF8A00]' : '')}>
              {form.popular && <span className="text-xs font-bold text-[#FF8A00]">MOST POPULAR</span>}
              <p className="font-bold">{form.name || 'Plan name'}</p>
              <p className="text-xl font-extrabold">{form.free ? 'Free' : form.price ? rupees(Math.round(Number(form.price) * 100)) : '₹ –'}</p>
              <p className="text-sm text-[#53647c]">{form.durationValue ? 'Access for ' + duration({ [form.durationUnit === 'days' ? 'durationDays' : 'durationMonths']: Number(form.durationValue) }) : 'Set an access duration'}</p>
              <ul className="mt-2 text-sm list-disc pl-5">{(form.features || []).filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
          </div>
        </>}
      </div>
      <div className="flex justify-end gap-3 px-4 sm:px-6 py-3 border-t border-[#E6E8EC] bg-[#F8FAFC]"><button type="button" onClick={() => setForm(null)}>Cancel</button><button disabled={busy} className="bg-[#0A1D3F] text-white rounded-xl px-5 py-2 font-semibold disabled:opacity-60">Save {singular[editorKind]}</button></div>
    </form></div>}
  </div>;
}
// Enrollment review lives in its own page; re-exported for existing imports.
export { AdminEnrollmentsPage } from './AdminEnrollmentsPage';
