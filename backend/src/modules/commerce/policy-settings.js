import { workflowPolicy } from '../franchise/policy.js';
import { object, text, invalid } from '../publishing/validation.js';
import { accessExpiry } from '../../utils/accessDuration.js';

const flag = value => { if (typeof value !== 'boolean') throw invalid('Explicit boolean required'); return value; };
const count = (value, max = 1000000000) => { if (!Number.isSafeInteger(value) || value < 0 || value > max) throw invalid('Invalid bounded integer'); return value; };
const choice = (value, choices) => { if (!choices.includes(value)) throw invalid('Invalid policy selection'); return value; };
function approval(input) {
  flag(input.approved);
  if (input.version != null) text(input.version, 80);
  if (input.effectiveFrom != null && (typeof input.effectiveFrom !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(input.effectiveFrom) || !Number.isFinite(Date.parse(input.effectiveFrom)))) throw invalid('UTC effective date required');
  if (input.approved && (!input.version?.trim() || !input.effectiveFrom)) throw invalid('Approval requires a policy version and effective date');
}
export function refundPolicy(input) {
  object(input, ['approved', 'version', 'effectiveFrom', 'enabled', 'courseWindowDays', 'outsideWindow', 'evidenceRequired', 'categories', 'accessAfterConfirmedRefund'], ['approved', 'enabled', 'outsideWindow', 'evidenceRequired', 'categories', 'accessAfterConfirmedRefund']);
  approval(input); flag(input.enabled); flag(input.evidenceRequired);
  const result = { ...input, courseWindowDays: count(input.courseWindowDays ?? 7, 3650) };
  choice(input.outsideWindow, ['deny', 'manual_review']);
  choice(input.accessAfterConfirmedRefund, ['retain', 'separate_review']);
  object(input.categories, ['course_plan', 'book', 'registration_fee']);
  for (const [kind, category] of Object.entries(input.categories)) {
    object(category, ['enabled', 'reasons', 'evidenceRequired'], ['enabled', 'reasons']);
    flag(category.enabled); if ('evidenceRequired' in category) flag(category.evidenceRequired);
    if (!Array.isArray(category.reasons) || category.reasons.length > 20 || category.reasons.some(v => !text(v, 80).trim())) throw invalid('Configure bounded refund reason categories');
    if (category.enabled && !category.reasons.length) throw invalid('Enabled refund category requires eligibility reasons');
    if (kind === 'book' && category.reasons.some(v => !['duplicate_charge', 'technical_failure', 'inaccessible_content'].includes(v))) throw invalid('Book refunds require an approved supported reason');
  }
  return result;
}
export function franchisePolicy(input) {
  object(input, ['approved', 'version', 'effectiveFrom', 'joining', 'renewal', 'dueRule', 'graceDays', 'requirements', 'workflowDraft', 'workflowPublished'], ['approved', 'joining', 'renewal', 'dueRule', 'requirements']);
  approval(input); choice(input.dueRule, ['activation_anniversary']);
  if (input.graceDays != null) count(input.graceDays, 365);
  if (!Array.isArray(input.requirements) || input.requirements.length > 20 || input.requirements.some(v => !text(v, 160).trim())) throw invalid('Invalid franchise requirement list');
  for (const fee of [input.joining, input.renewal]) {
    object(fee, ['enabled', 'amountMinor', 'currency'], ['enabled', 'currency']); flag(fee.enabled);
    choice(fee.currency, ['INR']); if (fee.amountMinor != null) count(fee.amountMinor);
    if (input.approved && fee.enabled && !(fee.amountMinor > 0)) throw invalid('Enabled franchise fees require an explicitly approved positive amount');
  }
  if (input.workflowDraft) workflowPolicy(input.workflowDraft); if (input.workflowPublished) workflowPolicy(input.workflowPublished);
  return { ...input };
}
export function invoicePolicy(input) {
  object(input, ['sellerName', 'sellerAddress', 'sellerTaxId', 'taxPolicyNote', 'businessType', 'taxRegistrationStatus', 'gstin', 'receiptDetails', 'financialPolicyVersion', 'taxConfigurationApproved']);
  for (const [key, value] of Object.entries(input)) {
    if (key === 'taxConfigurationApproved') flag(value);
    else text(value, 2000);
  }
  if (input.taxRegistrationStatus != null) choice(input.taxRegistrationStatus, ['undecided', 'unregistered', 'registered']);
  if (input.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(input.gstin)) throw invalid('Invalid GSTIN format; format validation does not establish legal registration');
  if (input.taxConfigurationApproved && (!input.sellerName?.trim() || !input.sellerAddress?.trim() || !input.businessType?.trim() || !input.financialPolicyVersion?.trim() || !['registered', 'unregistered'].includes(input.taxRegistrationStatus) || input.taxRegistrationStatus === 'registered' && !input.gstin)) throw invalid('Tax approval requires complete owner-supplied business and registration metadata');
  return { ...input };
}
// This is a planning projection, not affiliation activation or a payment grant.
export function franchiseFeeStatus(policy, { activationAt, lastVerifiedRenewalAt } = {}, at = new Date()) {
  if (policy?.workflowPublished && Date.parse(policy.workflowPublished.effectiveFrom) <= at.getTime()) { const p = workflowPolicy(policy.workflowPublished); return { state: 'configured', joining: p.joining, renewal: p.renewal, policyVersion: p.version, paymentCollectionEnabled: false }; }
  if (!policy?.approved || Date.parse(policy.effectiveFrom) > at.getTime()) return { state: 'configuration_required', affiliationState: 'blocked_pending_policy' };
  franchisePolicy(policy);
  const anchor = lastVerifiedRenewalAt ?? activationAt;
  const dueAt = anchor ? accessExpiry(new Date(anchor), { durationMonths: 12 }) : null;
  const graceEndsAt = dueAt && policy.graceDays != null ? new Date(dueAt.getTime() + policy.graceDays * 86400000) : null;
  return { state: !policy.renewal.enabled ? 'renewal_disabled' : !dueAt ? 'awaiting_approved_activation' : dueAt > at ? 'current' : graceEndsAt > at ? 'grace' : 'due', dueAt, graceEndsAt, graceDays: policy.graceDays ?? null, joining: policy.joining, renewal: policy.renewal, policyVersion: policy.version, affiliationState: 'blocked_pending_policy', paymentCollectionEnabled: false };
}
