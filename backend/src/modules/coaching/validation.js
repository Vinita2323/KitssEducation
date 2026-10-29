import { object, id, text, revision, invalid } from '../publishing/validation.js';
export const integer = (value, min = 0, max = 100000) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw invalid('Invalid bounded integer');
  return value;
};
const bool = value => {
  if (typeof value !== 'boolean') throw invalid('Expected boolean');
  return value;
};
const choice = options => value => {
  if (!options.includes(value)) throw invalid('Invalid selection');
  return value;
};
const list = fn => value => {
  if (!Array.isArray(value) || value.length > 100) throw invalid('Invalid list');
  return value.map(fn);
};
const ref = value => value === null ? null : String(id(value));
const section = value => {
  object(value, ['key', 'title', 'sortOrder'], ['key', 'title', 'sortOrder']);
  const key = text(value.key, 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) throw invalid('Invalid section key');
  if (!text(value.title)) throw invalid('Section title is required');
  return {
    key,
    title: text(value.title),
    sortOrder: integer(value.sortOrder)
  };
};
const fields = {
  courses: {
    title: text,
    description: v => text(v, 20000),
    whatYouWillLearn: list(v => text(v,500)),
    benefits: list(v => text(v,500)),
    // Category drives the student catalogue tabs; collapse spacing so "JEE " and "JEE" match.
    category: v => text(v).replace(/\s+/g, ' '),
    boardId: ref,
    classId: ref,
    stateId: ref,
    programId: ref,
    languageId: ref,
    subjectIds: list(ref),
    facultyIds: list(ref),
    thumbnailId: ref,
    linkedBookIds: list(ref),
    syllabus: list(section),
    rightsConfirmed: bool,
    rightsNote: v => text(v, 2000)
  },
  plans: {
    name: text,
    features: list(v => text(v, 500)),
    popular: bool,
    sortOrder: integer,
    priceMinor: v => integer(v, 0, 1000000000),
    durationDays: v => integer(v, 1, 36500),
    durationMonths: v => integer(v, 1, 1200),
    eligibility: choice(['verified_account']),
    rulesApproved: bool,
    renewalApproved: value => {
      if (value !== false) throw invalid('Renewal policy is not approved');
      return false;
    },
    status: choice(['draft', 'active', 'archived'])
  },
  lessons: {
    title: text,
    description: v => text(v, 2000),
    content: v => text(v, 20000),
    subjectKey: v => text(v, 80),
    documentAssetId: ref,
    videoAssetId: ref,
    linkedBookIds: list(ref),
    sortOrder: integer,
    previewAllowed: bool,
    status: choice(['draft', 'published', 'locked', 'archived'])
  }
};
export function inputFor(kind, body, creating) {
  object(body, [...Object.keys(fields[kind]), 'expectedRevision'], creating ? kind === 'courses' ? ['title'] : kind === 'plans' ? ['name'] : ['title', 'subjectKey', 'sortOrder'] : ['expectedRevision']);
  const fieldsOut = {};
  for (const [name, value] of Object.entries(body)) if (name !== 'expectedRevision') fieldsOut[name] = fields[kind][name](value);
  if (['title', 'name', 'subjectKey'].some(k => k in fieldsOut && !fieldsOut[k])) throw invalid('Required text cannot be empty');
  if (fieldsOut.syllabus && new Set(fieldsOut.syllabus.map(s => s.key)).size !== fieldsOut.syllabus.length) throw invalid('Section keys must be unique');
  if (kind === "plans") {
    if (fieldsOut.durationDays != null && fieldsOut.durationMonths != null) throw invalid("Choose days or calendar months, not both");
    if (creating && fieldsOut.priceMinor > 0 && fieldsOut.durationDays == null && fieldsOut.durationMonths == null) fieldsOut.durationMonths = 12;
  }
  return {
    fields: fieldsOut,
    expectedRevision: creating ? undefined : revision(body.expectedRevision)
  };
}
export function pagination(query, extra = []) {
  object(query, ['page', 'pageSize', 'q', 'sort', 'category', 'subjectId', 'languageId', 'classId', 'boardId', 'stateId', 'state', ...extra]);
  return {
    page: integer(Number(query.page ?? 1), 1, 100000),
    pageSize: integer(Number(query.pageSize ?? 20), 1, 100)
  };
}
