// One phone rule for every form. It matches the server rule in backend/src/utils/phone.js; keep the two in step.
// Accepts an optional leading "+", then digits grouped with optional spaces, dashes or brackets, 10 to 15 digits
// in total: 9876543210, 098765 43210, +91 98765 43210 and international numbers all pass.
export const PHONE_MAX_LENGTH = 20;
export const PHONE_HINT = 'Enter a phone number with 10 to 15 digits, for example 98765 43210 or +91 98765 43210';

export function isPhoneNumber(value) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text || text.length > 32 || !/^\+?[\d ()-]+$/.test(text)) return false;
  const digits = text.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 15;
}

// For forms that rely on the browser's own validation: marks the field invalid with the hint until it is valid.
// An empty optional field is left valid; "required" handles emptiness.
export function phoneValidity(input) {
  const value = input.value.trim();
  input.setCustomValidity(value && !isPhoneNumber(value) ? PHONE_HINT : '');
}
