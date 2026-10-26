// Presets are editable selections, never roles or authorization overrides.
export const permissionPresets = Object.freeze({
  'Content Manager': ['books.read', 'books.create', 'books.edit', 'coaching.read', 'coaching.create', 'coaching.edit', 'media.read', 'media.write'],
  'Admission Manager': ['admissions.read', 'admissions.write', 'registrations.read', 'registrations.review', 'registrations.documents.review'],
  'Finance Manager': ['commerce.read', 'refunds.read', 'refunds.review'],
  'Franchise Manager': ['franchises.read', 'franchises.write'],
  'Support Manager': ['commerce.read', 'registrations.read'],
});
export function presetSelection(name, available) {
  return (permissionPresets[name] ?? []).filter(permission => available.includes(permission));
}
