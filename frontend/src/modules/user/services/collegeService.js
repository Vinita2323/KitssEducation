import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from './authService';
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
export async function readOptions(path, filters = {}, signal) {
  const rows = [];
  for (let page = 1; page <= 100; page++) {
    const result = await readPage(path, { ...filters, page, pageSize: 100 }, signal); rows.push(...result.data);
    if (!result.meta || page >= result.meta.totalPages) return rows;
  }
  throw new Error('Too many choices; narrow the selection before continuing.');
}
export const collegeService = {
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
  createFranchiseDraft: data => authenticatedWrite('/franchise-applications', data),
  updateFranchiseDraft: (draft, data) => authenticatedWrite('/franchise-applications/' + draft.id, { ...data, expectedRevision: draft.revision }, 'PATCH', true, { 'X-Draft-Capability': draft.draftCapability }),
  submitFranchiseDraft: draft => authenticatedWrite('/franchise-applications/' + draft.id + '/submit', { expectedRevision: draft.revision, declaration: { version: 'franchise-v1', accepted: true } }, 'POST', true, { 'X-Draft-Capability': draft.draftCapability }),
  async getFranchiseStatus(draft) { return (await httpClient.request('/franchise-applications/' + draft.id + '/status', { headers: { 'X-Draft-Capability': draft.draftCapability } })).data; },
};
