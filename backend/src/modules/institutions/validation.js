import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { taxonomyKinds } from './institutions.models.js';

export const invalid = message => new AppError(422, 'INVALID_INPUT', message);
export const id = value => { if (typeof value !== 'string' || !/^[a-fA-F0-9]{24}$/.test(value)) throw invalid('Invalid resource reference'); return new mongoose.Types.ObjectId(value); };
export function object(value, allowed, required = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) throw invalid('Unexpected or missing fields');
  for (const key of required) if (value[key] === undefined || value[key] === null || value[key] === '') throw invalid(`Required field: ${key}`);
  return value;
}
const text = (v, max = 160) => { if (typeof v !== 'string' || v.length > max || /[\u0000-\u0008\u000b-\u001f]/.test(v)) throw invalid('Invalid text field'); return v.trim(); };
const integer = (v, min, max) => { if (!Number.isSafeInteger(v) || v < min || v > max) throw invalid('Invalid numeric field'); return v; };
const url = v => { v = text(v, 2048); if (!v) return ''; let parsed; try { parsed = new URL(v); } catch { throw invalid('Use a complete HTTP(S) URL'); } if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw invalid('Unsafe URL'); return v; };
const email = v => { v = text(v, 254).toLowerCase(); if (v && !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(v)) throw invalid('Invalid email address'); return v; };
const array = (v, fn, max = 40) => { if (!Array.isArray(v) || v.length > max) throw invalid('Invalid list'); return [...new Set(v.map(fn))]; };
const nested = (v, validators, required = []) => { object(v, Object.keys(validators), required); return Object.fromEntries(Object.entries(v).map(([k, value]) => [k, validators[k](value)])); };
const short = v => text(v), long = v => text(v, 20000), label = v => text(v, 80);
const enumValue = allowed => v => { if (!allowed.includes(v)) throw invalid('Invalid selection'); return v; };
const status = enumValue(['draft', 'active', 'inactive', 'archived']);
export const definitions = {
  taxonomy: { kind: enumValue(taxonomyKinds), key: v => { const s = text(v, 80).toLowerCase(); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) throw invalid('Use a canonical lowercase hyphenated key'); return s; }, label: short, parentIds: v => array(v, x => String(id(x)), 10), sortOrder: v => integer(v, 0, 100000), status: enumValue(['active', 'inactive']) },
  university: { name: short, shortName: label, logo: url, status },
  college: { name: short, universityId: v => String(id(v)), code: v => text(v, 80).toUpperCase(), category: enumValue(['University', 'College', 'School', 'Institute']), collegeType: label, description: long, about: long, address: v => text(v, 500), city: short, district: short, stateId: v => String(id(v)), country: label, pincode: v => { const s = text(v, 12); if (s && !/^\d{6}$/.test(s)) throw invalid('Use a six digit postal code'); return s; }, logo: url, banner: url, facilities: v => array(v, short), contactInformation: v => nested(v, { phone: v => text(v, 32), email, website: url }), admissionInformation: v => text(v, 2000), verification: v => nested(v, { state: enumValue(['verified', 'unverified']), source: v => text(v, 500) }, ['state']), status },
  program: { name: short, degreeType: label, duration: label, eligibility: v => text(v, 500), feeMinor: v => integer(v, 0, 10000000000), currency: enumValue(['INR']), description: long, availableSeats: v => integer(v, 0, 1000000), admissionStatus: enumValue(['open', 'closed']), status },
};
const required = { taxonomy: ['kind', 'key', 'label'], university: ['name', 'shortName'], college: ['universityId', 'name', 'code', 'category', 'address', 'city', 'district', 'stateId'], program: ['name', 'degreeType', 'duration', 'eligibility', 'feeMinor'] };
export function definitionInput(kind, input, creating = false) {
  object(input, [...Object.keys(definitions[kind]), 'expectedRevision'], creating ? required[kind] : ['expectedRevision']);
  const result = {};
  for (const [key, value] of Object.entries(input)) if (key !== 'expectedRevision') result[key] = definitions[kind][key](value);
  for (const field of required[kind]) if (field in result && !result[field]) throw invalid(`Required field: ${field}`);
  if (!creating) result.expectedRevision = integer(input.expectedRevision, 1, Number.MAX_SAFE_INTEGER);
  return result;
}
export function pageQuery(query, extra = []) {
  object(query, ['page', 'pageSize', 'q', 'sort', ...extra]);
  for (const value of Object.values(query)) if (typeof value !== 'string' || value.length > 160) throw invalid('Invalid query parameter');
  const number = (key, fallback, max) => { if (query[key] !== undefined && !/^\d+$/.test(query[key])) throw invalid('Invalid pagination'); return integer(Number(query[key] ?? fallback), 1, max); };
  if (query.sort && !['name', 'newest'].includes(query.sort)) throw invalid('Unsupported sort');
  return { page: number('page', 1, 100000), pageSize: number('pageSize', 20, 100), q: (query.q ?? '').trim(), sort: query.sort ?? 'name' };
}
export function admissionInput(input) {
  object(input, ['collegeId', 'programId', 'studentDetails', 'idempotencyKey'], ['collegeId', 'programId', 'studentDetails', 'idempotencyKey']);
  const details = nested(input.studentDetails, { fullName: short, mobileNumber: v => { const s = text(v, 32); if (!/^[+\d ()-]{10,32}$/.test(s)) throw invalid('Invalid phone number'); return s; }, email, dob: v => { const s = text(v, 10); if (s && (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s || new Date(s) > new Date())) throw invalid('Invalid birth date'); return s; }, city: short, educationalQualification: short, passingYear: v => { const s = text(v, 4); if (s && (!/^\d{4}$/.test(s) || Number(s) > new Date().getFullYear())) throw invalid('Invalid passing year'); return s; }, additionalInfo: v => text(v, 2000) }, ['fullName', 'mobileNumber', 'email']);
  if (!details.fullName || !details.email) throw invalid('Name and email are required');
  return { collegeId: String(id(input.collegeId)), programId: String(id(input.programId)), studentDetails: details, idempotencyKey: key(input.idempotencyKey) };
}
export function key(value) { const s = text(value, 80); if (!/^[\w-]{16,80}$/.test(s)) throw invalid('Use a random idempotency key of 16-80 characters'); return s; }
export function franchiseInput(input, creating = false, independent = false) {
  const validators = { universityId: v => String(id(v)), collegeId: v => String(id(v)), institution: v => nested(v, { name: short, type: short, yearEstablished: v => integer(v, 1, new Date().getFullYear()), website: url }), programsOffered: v => array(v, short), contact: v => nested(v, { person: short, designation: short, email, mobile: v => text(v, 32), alternateMobile: v => text(v, 32) }), location: v => nested(v, { address: v => text(v, 500), city: short, stateId: v => String(id(v)), pincode: v => text(v, 12), mapsUrl: url }), pendingDocuments: v => { if (!Array.isArray(v) || v.length > 5) throw invalid('Invalid pending documents'); return v.map(d => nested(d, { purpose: label, name: short, size: v => integer(v, 0, 5242880), contentType: v => text(v, 100) }, ['purpose', 'name', 'size'])); } };
  object(input, [...Object.keys(validators), creating ? 'idempotencyKey' : 'expectedRevision'], creating ? (independent ? ['idempotencyKey'] : ['universityId', 'collegeId', 'idempotencyKey']) : ['expectedRevision']);
  const result = {};
  for (const [field, value] of Object.entries(input)) if (validators[field]) result[field] = independent && ['collegeId','universityId'].includes(field) && value === null ? null : validators[field](value);
  if (creating) result.idempotencyKey = key(input.idempotencyKey);
  else result.expectedRevision = integer(input.expectedRevision, 1, Number.MAX_SAFE_INTEGER);
  return result;
}
export const revision = value => integer(value, 1, Number.MAX_SAFE_INTEGER);
export const noteText = value => { const s = text(value, 2000); if (!s) throw invalid('A note or reason is required'); return s; };
