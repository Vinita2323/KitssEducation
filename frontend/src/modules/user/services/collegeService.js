import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from './authService';
import { cachedRequest } from '../../../shared/api/requestCache';
export const queryString = values => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values ?? {})) if (value !== undefined && value !== null && value !== '' && value !== 'All') params.set(key, String(value));
  return params.size ? '?' + params : '';
};
export const programDTO = row => ({ ...row, _id: row.id, courseName: row.name, fee: row.feeMinor / 100, admissionStatus: row.admissionStatus === 'open' ? 'Open' : 'Closed' });
export const collegeDTO = row => ({ ...row, _id: row.id, location: [row.city, row.state].filter(Boolean).join(', '), parentUniversityName: row.university?.name, parentUniversityShort: row.university?.shortName });
export async function readPage(path, filters = {}, signal) {
  return httpClient.request(path + queryString(filters), { signal });
}
// Several dropdowns on one screen often ask for the same list at once; those share a single fetch.
// Nothing is kept afterwards, so editors always see the latest choices when a form is reopened.
export async function readOptions(path, filters = {}, signal) {
  if (path === '/taxonomies') return [...await cachedRequest('options:' + path + queryString(filters), 0, () => fetchAllOptions(path, filters))];
  return fetchAllOptions(path, filters, signal);
}
// Loads every page of a choice list: page 1 tells how many pages exist, the rest are fetched a few at a
// time in parallel (same rows and order as one-by-one paging, far fewer round trips for long lists).
async function fetchAllOptions(path, filters, signal) {
  const read = page => readPage(path, { ...filters, page, pageSize: 100 }, signal);
  const first = await read(1);
  const totalPages = first.meta ? first.meta.totalPages : 1;
  if (totalPages > 100) throw new Error('Too many choices; narrow the selection before continuing.');
  const rows = [...first.data];
  for (let start = 2; start <= totalPages; start += 4) {
    const batch = await Promise.all(Array.from({ length: Math.min(4, totalPages - start + 1) }, (_, i) => read(start + i)));
    for (const result of batch) rows.push(...result.data);
  }
  return rows;
}
export const collegeService = {
  async getDirectoryPage(filters = {}, signal) { const { search, ...rest } = filters; const result = await readPage('/public/institutions', { ...rest, q: search }, signal); return { ...result, data: result.data.map(collegeDTO) }; },
  async getCollegesPage(filters = {}, signal) {
    const { search, ...rest } = filters;
    const result = await readPage('/colleges', { ...rest, q: search }, signal);
    return { ...result, data: result.data.map(collegeDTO) };
  },
  async getColleges(filters = {}) { const { search, ...rest } = filters; return (await readOptions('/colleges', { ...rest, q: search })).map(collegeDTO); },
  async getUniversities(filters = {}) { return readOptions('/universities', { q: filters.search }); },
  async getCollegesByUniversity(id) { return (await readOptions('/universities/' + encodeURIComponent(id) + '/colleges')).map(collegeDTO); },
  async getCollegeById(id) {
    const [college, programs] = await Promise.all([httpClient.request('/colleges/' + encodeURIComponent(id)), readOptions('/colleges/' + encodeURIComponent(id) + '/programs')]);
    return { ...collegeDTO(college.data), courses: programs.map(programDTO) };
  },
  async getFacets(filters = {}, signal) { return (await readPage('/institutions/facets', filters, signal)).data; },
  async getTaxonomies(kind, parentId) { return readOptions('/taxonomies', { kind, parentId }); },
  async submitApplication(input) {
    const result = await authenticatedWrite('/admission-applications', { collegeId: input.collegeId, programId: input.courseId, studentDetails: input.studentDetails, idempotencyKey: input.idempotencyKey });
    return { ...result, success: true, applicationId: result.reference };
  },
};
