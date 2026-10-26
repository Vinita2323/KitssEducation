// Existing broad grants remain valid for existing staff. New assignments may
// select individual actions; they are never expanded into broad write grants.
export const granularPermissions = Object.freeze({
  books: ['read', 'create', 'edit', 'publish', 'archive'],
  coaching: ['read', 'create', 'edit', 'publish', 'archive'],
  registrations: ['review', 'approve', 'documents.review'],
  franchises: ['approve'],
  refunds: ['read', 'review'],
  access: ['read', 'request', 'issue', 'revoke'],
});
export const granularNames = Object.entries(granularPermissions).flatMap(([module, actions]) => actions.map(action => module + '.' + action));
export function hasPermission(user, permission, grants) {
  if (grants.includes(permission)) return true;
  const legacy = permission.startsWith('books.') || permission.startsWith('coaching.')
    ? (permission.endsWith('.read') ? 'learning.read' : permission.endsWith('.publish') ? 'learning.publish' : 'learning.write')
    : ({ 'learning.read': 'access.read', 'access.revoke': 'learning.grants.manage', 'registrations.review': 'registrations.write', 'registrations.approve': 'registrations.write' })[permission];
  return Boolean(legacy && grants.includes(legacy));
}
