import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { readPage, readOptions, programDTO, collegeDTO } from '../../user/services/collegeService';
const status = value => value?.toLowerCase().replaceAll(' ', '_');
const label = value => ({ in_process: 'In Process', needs_changes: 'Needs changes' }[value] ?? (value ? value[0].toUpperCase() + value.slice(1) : ''));
const intakeDTO = row => ({
  ...row, _id: row.id, status: label(row.status), applicationId: row.reference,
  courseId: row.programSnapshot ? { courseName: row.programSnapshot.name, degreeType: row.programSnapshot.degreeType } : undefined,
  collegeId: { id: row.collegeId, name: row.programSnapshot?.collegeName || row.parentCollegeName || '' },
  universityId: { id: row.universityId, name: row.parentUniversityName || row.programSnapshot?.universityName || '' },
  institutionName: row.institution?.name, institutionType: row.institution?.type, yearEstablished: row.institution?.yearEstablished,
  website: row.institution?.website, programsOffered: row.programsOffered,
  contactPerson: row.contact?.person, designation: row.contact?.designation, email: row.contact?.email, mobile: row.contact?.mobile, alternateMobile: row.contact?.alternateMobile,
  address: row.location?.address, city: row.location?.city, state: row.stateLabel || '', pincode: row.location?.pincode, googleMapsLocation: row.location?.mapsUrl,
  franchiseDocuments: Array.isArray(row.documents) ? row.documents : [], documents: {}, pendingDocuments: row.pendingDocuments ?? [],
  adminNotes: (row.notes ?? []).map(note => ({ ...note, _id: note.id, author: note.actorId, note: note.text })),
});
const filters = input => { const { search, ...rest } = input ?? {}; return { ...rest, q: search, status: rest.status && rest.status !== 'All' ? status(rest.status) : undefined }; };
const collegeAdminDTO = row => ({ ...collegeDTO(row), totalCourses: row.coursesCount, universityId: row.university ?? row.universityId });
const revision = row => { if (!Number.isSafeInteger(row?.revision)) throw new Error('Refresh the record before changing it.'); return row.revision; };
const clean = (data, fields) => Object.fromEntries(fields.filter(k => data[k] !== undefined).map(k => [k, data[k]]));
const universityInput = data => clean(data, ['name', 'shortName', 'logo', 'status', 'expectedRevision']);
const collegeInput = data => clean({ ...data, facilities: Array.isArray(data.facilities) ? data.facilities : (data.facilities || '').split(',').map(v => v.trim()).filter(Boolean) }, ['name', 'code', 'universityId', 'category', 'stateId', 'district', 'city', 'address', 'country', 'pincode', 'collegeType', 'description', 'about', 'facilities', 'admissionInformation', 'contactInformation', 'logo', 'banner', 'verification', 'status', 'expectedRevision']);
const programInput = data => { if (data.fee === '') throw new Error('Enter the approved program fee explicitly, including zero if applicable.'); return clean({ ...data, name: data.courseName, feeMinor: data.fee === undefined ? undefined : Math.round(Number(data.fee) * 100), availableSeats: data.availableSeats === undefined || data.availableSeats === '' ? undefined : Number(data.availableSeats), admissionStatus: status(data.admissionStatus) }, ['name', 'degreeType', 'duration', 'eligibility', 'feeMinor', 'availableSeats', 'description', 'admissionStatus', 'status', 'expectedRevision']); };
const adapter = { universities: row => row, colleges: collegeAdminDTO };
export const adminService = {
  async page(resource, input = {}) { const result = await readPage('/admin/' + resource, filters(input)); return { ...result, data: result.data.map(adapter[resource] ?? (resource.endsWith('applications') ? intakeDTO : row => row)) }; },
  async getUniversities(input) { return readOptions('/admin/universities', filters(input)); },
  async getColleges(input) { return (await this.page('colleges', { pageSize: 100, ...input })).data; },
  async createUniversity(data) { return authenticatedWrite('/admin/universities', universityInput(data)); },
  async updateUniversity(id, data) { return authenticatedWrite('/admin/universities/' + id, universityInput(data), 'PATCH'); },
  async toggleUniversityStatus(id, row) { return this.updateUniversity(id, { status: row.status === 'active' ? 'inactive' : 'active', expectedRevision: revision(row) }); },
  async deleteUniversity(id, row) { return authenticatedWrite('/admin/universities/' + id, { expectedRevision: revision(row) }, 'DELETE'); },
  async createCollege(data) { return collegeAdminDTO(await authenticatedWrite('/admin/colleges', collegeInput(data))); },
  async updateCollege(id, data) { return collegeAdminDTO(await authenticatedWrite('/admin/colleges/' + id, collegeInput(data), 'PATCH')); },
  async toggleCollegeStatus(id, row) { return this.updateCollege(id, { status: row.status === 'active' ? 'inactive' : 'active', expectedRevision: revision(row) }); },
  async deleteCollege(id, row) { return authenticatedWrite('/admin/colleges/' + id, { expectedRevision: revision(row) }, 'DELETE'); },
  async getCourses(collegeId, input = {}) {
    const [college, courses] = await Promise.all([httpClient.request('/admin/colleges/' + collegeId), readPage('/admin/colleges/' + collegeId + '/programs', { pageSize: 20, ...filters(input) })]);
    return { college: collegeAdminDTO(college.data), courses: courses.data.map(programDTO), meta: courses.meta };
  },
  getCollegeCourses(...args) { return this.getCourses(...args); },
  async createCourse(collegeId, data) { return programDTO(await authenticatedWrite('/admin/colleges/' + collegeId + '/programs', programInput(data))); },
  async updateCourse(id, data, collegeId) { return programDTO(await authenticatedWrite('/admin/colleges/' + collegeId + '/programs/' + id, programInput(data), 'PATCH')); },
  async toggleCourseStatus(id, row, collegeId) { return this.updateCourse(id, { status: row.status === 'active' ? 'inactive' : 'active', expectedRevision: revision(row) }, collegeId); },
  async deleteCourse(id, row, collegeId) { return authenticatedWrite('/admin/colleges/' + collegeId + '/programs/' + id, { expectedRevision: revision(row) }, 'DELETE'); },
  async getApplications(input) { return (await this.page('admission-applications', input)).data; },
  async getAdmission(id) { return intakeDTO((await httpClient.request('/admin/admission-applications/' + id)).data); },
  async updateApplicationStatus(id, value, note, expectedRevision) { return intakeDTO(await authenticatedWrite('/admin/admission-applications/' + id + '/status', { status: status(value), expectedRevision, ...(note ? { note } : {}) }, 'PATCH')); },
  async addAdminNote(id, text, idempotencyKey) { return intakeDTO(await authenticatedWrite('/admin/admission-applications/' + id + '/notes', { text, idempotencyKey })); },
  async getFranchiseRegistrations(input) { return (await this.page('franchise-applications', input)).data; },
  async getFranchise(id) { return intakeDTO((await httpClient.request('/admin/franchise-applications/' + id)).data); },
  async updateFranchiseStatus(id, value, rejectionReason, note, expectedRevision) { return intakeDTO(await authenticatedWrite('/admin/franchise-applications/' + id + '/status', { status: status(value), expectedRevision, ...(rejectionReason ? { rejectionReason } : {}), ...(note ? { note } : {}) }, 'PATCH')); },
  async addFranchiseNote(id, text, idempotencyKey) { return intakeDTO(await authenticatedWrite('/admin/franchise-applications/' + id + '/notes', { text, idempotencyKey })); },
  async getDashboardStats() { throw new Error('Platform summaries are awaiting later-stage integration.'); },
};
