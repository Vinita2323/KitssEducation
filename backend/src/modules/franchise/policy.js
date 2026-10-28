import { object, text, invalid } from '../publishing/validation.js';
const choice = (v, values) => { if (!values.includes(v)) throw invalid('Unsupported franchise policy selection'); return v; };
const integer = (v, min, max) => { if (!Number.isSafeInteger(v) || v < min || v > max) throw invalid('Invalid franchise policy amount or interval'); return v; };
const boolean = v => { if (typeof v !== 'boolean') throw invalid('Choose true or false'); return v; };
export function workflowPolicy(input) {
  object(input, ['version','effectiveFrom','applicationMode','institutionTypes','minimumYears','documents','privacyText','agreement','joining','renewal','reminderDays','existingRecords', 'acceptingApplications'], ['version','effectiveFrom','applicationMode','institutionTypes','minimumYears','documents','privacyText','agreement','joining','renewal','reminderDays','existingRecords']);
  const p = structuredClone(input); p.acceptingApplications = boolean(input.acceptingApplications ?? true);
  p.version = text(p.version, 80); if (!p.version || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(p.effectiveFrom) || !Number.isFinite(Date.parse(p.effectiveFrom))) throw invalid('Policy version and UTC effective date required');
  choice(p.applicationMode, ['independent','linked','both']); choice(p.existingRecords, ['prospective']);
  if (!Array.isArray(p.institutionTypes) || !p.institutionTypes.length || p.institutionTypes.length > 20) throw invalid('Choose supported institution types');
  p.institutionTypes = [...new Set(p.institutionTypes.map(v => text(v, 80)))]; if (p.institutionTypes.some(v => !v)) throw invalid('Institution type required');
  integer(p.minimumYears, 0, 200); integer(p.reminderDays, 0, 180);
  if (!Array.isArray(p.documents) || p.documents.length > 10) throw invalid('At most ten document requirements');
  p.documents = p.documents.map(d => { object(d, ['key','label','required','mime','maxBytes'], ['key','label','required','mime','maxBytes']); if (!/^[a-z][a-z0-9_-]{0,49}$/.test(d.key)) throw invalid('Invalid document key'); const label = text(d.label, 100); if (!label) throw invalid('Document label required'); boolean(d.required); integer(d.maxBytes, 1, 10485760); if (!Array.isArray(d.mime) || !d.mime.length || d.mime.some(m => !['application/pdf','image/png','image/jpeg'].includes(m))) throw invalid('Use PDF, PNG or JPEG documents'); return { ...d, label }; });
  if (new Set(p.documents.map(d => d.key)).size !== p.documents.length) throw invalid('Duplicate document keys');
  p.privacyText = text(p.privacyText, 10000); object(p.agreement, ['version','text'], ['version','text']);
  p.agreement = { version: text(p.agreement.version, 80), text: text(p.agreement.text, 20000) }; if (!p.privacyText || !p.agreement.version || !p.agreement.text) throw invalid('Review privacy notice and agreement before publication');
  for (const [kind, fee] of [['joining', p.joining], ['renewal', p.renewal]]) { object(fee, kind === 'joining' ? ['enabled','amountMinor','currency'] : ['enabled','amountMinor','currency','months','graceDays','expiryAction'], kind === 'joining' ? ['enabled','amountMinor','currency'] : ['enabled','amountMinor','currency','months','graceDays','expiryAction']); boolean(fee.enabled); integer(fee.amountMinor, 0, 1000000000); choice(fee.currency, ['INR']); if (!fee.enabled && fee.amountMinor !== 0) throw invalid('Disabled fees must have zero amount'); }
  integer(p.renewal.months, 1, 120); integer(p.renewal.graceDays, 0, 365); choice(p.renewal.expiryAction, ['suspend','manual_review']);
  return p;
}
export function initialWorkflowPolicy() { return {
  acceptingApplications: true, version: 'franchise-policy-1', effectiveFrom: new Date().toISOString(), applicationMode: 'both', institutionTypes: ['University','College','School','Institute'], minimumYears: 0,
  documents: ['registration_proof','authorization_letter'].map((key, i) => ({ key, label: i ? 'Authorization letter' : 'Institution registration proof', required: true, mime: ['application/pdf','image/png','image/jpeg'], maxBytes: 5242880 })),
  privacyText: 'Your application and supporting documents will be used by authorized KITSS staff to assess your franchise request. Contact KITSS to request correction or review of your information.',
  agreement: { version: 'franchise-agreement-1', text: 'I am authorized to apply for this institution. I confirm that the information and documents supplied are accurate. Submission and payment do not grant affiliation; affiliation starts only after KITSS approves and activates the application. I will use KITSS branding only while affiliation is active and in accordance with the agreed terms.' },
  joining: { enabled: false, amountMinor: 0, currency: 'INR' }, renewal: { enabled: false, amountMinor: 0, currency: 'INR', months: 12, graceDays: 0, expiryAction: 'suspend' }, reminderDays: 14, existingRecords: 'prospective',
}; }
