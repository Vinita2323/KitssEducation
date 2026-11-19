// One phone rule for every form (profile, registrations, franchise, admissions). It accepts an optional leading
// "+", then digits that may be grouped with spaces, dashes or brackets, with 10 to 15 digits in total. That covers
// an Indian mobile written as 9876543210, 098765 43210 or +91 98765 43210, and international numbers.
// The frontend uses the same rule (frontend/src/shared/validation/phone.js); keep the two in step.
export function isPhoneNumber(value) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text || text.length > 32 || !/^\+?[\d ()-]+$/.test(text)) return false;
  const digits = text.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 15;
}

export const PHONE_RULE = 'Enter a phone number with 10 to 15 digits, for example 98765 43210 or +91 98765 43210';
