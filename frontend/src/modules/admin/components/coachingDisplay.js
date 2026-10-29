import { rupees } from './bookReadiness';

// Where a course stands for students. "Off sale" courses were published before: enrolled students keep learning.
export function courseState(course) {
  if (course.status === 'archived') return { key: 'removed', label: 'Archived', tone: 'bg-slate-100 text-slate-700 ring-slate-200' };
  if (course.status === 'published') return course.publication?.changesPending
    ? { key: 'changes', label: 'Live · unpublished changes', tone: 'bg-amber-50 text-amber-800 ring-amber-200' }
    : { key: 'live', label: 'Live', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' };
  return course.publication?.everPublished
    ? { key: 'offSale', label: 'Off sale', tone: 'bg-rose-50 text-rose-800 ring-rose-200' }
    : { key: 'draft', label: 'Draft', tone: 'bg-sky-50 text-sky-800 ring-sky-200' };
}

export const lessonStatus = { draft: ['Draft', 'bg-sky-50 text-sky-800 ring-sky-200'], published: ['Published', 'bg-emerald-50 text-emerald-800 ring-emerald-200'], locked: ['Coming soon', 'bg-violet-50 text-violet-800 ring-violet-200'], archived: ['Archived', 'bg-slate-100 text-slate-700 ring-slate-200'] };
export const planStatus = { draft: ['Draft', 'bg-sky-50 text-sky-800 ring-sky-200'], active: ['On sale', 'bg-emerald-50 text-emerald-800 ring-emerald-200'], archived: ['Archived', 'bg-slate-100 text-slate-700 ring-slate-200'] };

export const duration = plan => plan.durationMonths ? plan.durationMonths + (plan.durationMonths === 1 ? ' month' : ' months') : plan.durationDays ? plan.durationDays + (plan.durationDays === 1 ? ' day' : ' days') : '';
export const planLabel = plan => plan.priceMinor === 0 ? 'Free' + (duration(plan) ? ' · ' + duration(plan) : '') : rupees(plan.priceMinor) + (duration(plan) ? ' / ' + duration(plan) : '');

// Mirrors the server's publication gate (coaching.service.js publish); the server stays authoritative.
export const courseRequirements = (course, stats) => [
  ['Description', Boolean(course.description?.trim())],
  ['Category', Boolean(course.category?.trim())],
  ['Language', Boolean(course.languageId)],
  ['At least one published instructor', (course.facultyIds ?? []).length > 0],
  ['Thumbnail', Boolean(course.thumbnailId)],
  ['At least one syllabus section', (course.syllabus ?? []).length > 0],
  ['Content ownership confirmed', course.rightsConfirmed === true && Boolean(course.rightsNote?.trim())],
  ['At least one published lesson', (stats?.lessons?.published ?? 0) > 0],
  ['At least one plan on sale', (stats?.activePlans ?? []).length > 0],
];

// Stable section keys generated from titles; existing keys never change.
export function sectionKeys(sections) {
  const used = new Set(sections.map(s => s.key).filter(Boolean));
  return sections.map((s, i) => {
    if (s.key) return { ...s, sortOrder: i };
    const base = (s.title || 'section').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
    let key = base, n = 2; while (used.has(key)) key = base + '-' + n++;
    used.add(key); return { ...s, key, sortOrder: i };
  });
}
