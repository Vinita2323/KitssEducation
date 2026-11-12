// Fixed business rules. These used to be admin fields; they rarely change, so they are set here
// and sent with every save. The server still validates them like any other value.
import { MB } from './settingsFormat';
import { refundReasonCodes } from '../../../../shared/ui/refundReasons';

export const allFileTypes = ['application/pdf', 'image/png', 'image/jpeg'];

// Optional parent or guardian consent applicants may add; staff verify it before approval when given.
export const guardianConsent = {
  appliesTo: 'minors', approved: true, version: 'guardian-consent-1',
  text: 'I am the parent or legal guardian of the applicant. I agree to this registration and allow KITSS staff to review the details and documents provided.',
};

export const franchiseFixed = {
  applicationMode: 'both', institutionTypes: ['University', 'College', 'School', 'Institute'], minimumYears: 0, reminderDays: 14,
  privacyText: 'Your application and supporting documents will be used by authorized KITSS staff to assess your franchise request. Contact KITSS to request correction or review of your information.',
};
export const franchiseRenewalFixed = { graceDays: 0, expiryAction: 'suspend' };
export const franchiseDocument = { mime: allFileTypes, maxBytes: 10 * MB };

export const refundFixed = { outsideWindow: 'deny', evidenceRequired: false, accessAfterConfirmedRefund: 'separate_review' };
export const refundReasons = refundReasonCodes;

export const accessExceptionNote = 'Staff with the right permission may grant or revoke access in exceptional cases. Every grant or revocation records its own reason.';
