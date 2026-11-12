// Job roles are named sets of permissions. The server still checks each permission individually,
// so a role is only a convenient way to pick a correct, complete set.
export const ownerOnly = ['accounts.roles.manage', 'results.publish'];

export const staffRoles = [
  { name: 'Content manager', summary: 'Create, edit and publish books, courses, pages, media and notifications.',
    permissions: ['books.read', 'books.create', 'books.edit', 'books.publish', 'books.archive', 'coaching.read', 'coaching.create', 'coaching.edit', 'coaching.publish', 'coaching.archive', 'content.read', 'content.write', 'content.publish', 'media.read', 'media.write', 'notifications.read', 'notifications.write', 'notifications.publish'] },
  { name: 'Admissions manager', summary: 'Manage universities and colleges, and review admission applications and registrations with their documents.',
    permissions: ['institutions.read', 'institutions.write', 'admissions.read', 'admissions.write', 'admissions.review', 'registrations.read', 'registrations.write', 'registrations.review', 'registrations.approve', 'registrations.documents.review'] },
  { name: 'Franchise manager', summary: 'Review and approve franchise applications and renewals.',
    permissions: ['institutions.read', 'franchises.read', 'franchises.write', 'franchises.review', 'franchises.approve'] },
  { name: 'Finance manager', summary: 'View orders, check payment status, set course plan prices and review refund requests.',
    permissions: ['commerce.read', 'commerce.reconcile', 'commerce.plans.write', 'refunds.read', 'refunds.review'] },
  { name: 'Results manager', summary: 'Upload and correct exam results. Publishing results stays with the owner.',
    permissions: ['results.read', 'results.manage'] },
  { name: 'Student support', summary: 'Look up students, orders, enrollments and registrations, and request exceptional access for the owner to approve.',
    permissions: ['accounts.read', 'commerce.read', 'learning.read', 'registrations.read', 'access.read', 'access.request'] },
].map(role => ({ ...role, permissions: ['dashboard.read', ...role.permissions] }));

// Plain names for the custom permission list, grouped by area.
export const permissionGroups = [
  ['Dashboard', { 'dashboard.read': 'View the dashboard' }],
  ['Books', { 'books.read': 'View books', 'books.create': 'Add books', 'books.edit': 'Edit books', 'books.publish': 'Publish books', 'books.archive': 'Archive and restore books' }],
  ['Coaching', { 'coaching.read': 'View courses', 'coaching.create': 'Add courses', 'coaching.edit': 'Edit courses and lessons', 'coaching.publish': 'Publish courses', 'coaching.archive': 'Archive and restore courses' }],
  ['Enrollments & access', { 'learning.read': 'View enrollments', 'learning.write': 'Edit learning records', 'learning.publish': 'Publish learning records', 'learning.grants.manage': 'Grant course or book access', 'access.read': 'View exceptional access requests', 'access.request': 'Request exceptional access', 'access.issue': 'Approve exceptional access', 'access.revoke': 'Revoke or restore access' }],
  ['Orders & refunds', { 'commerce.read': 'View orders and payments', 'commerce.reconcile': 'Check payment status', 'commerce.plans.write': 'Set course plan prices', 'refunds.read': 'View refund requests', 'refunds.review': 'Review refund requests' }],
  ['Institutions & admissions', { 'institutions.read': 'View universities and colleges', 'institutions.write': 'Edit universities and colleges', 'admissions.read': 'View admission applications', 'admissions.write': 'Edit admission applications', 'admissions.review': 'Review admission applications' }],
  ['Registrations', { 'registrations.read': 'View registrations', 'registrations.write': 'Add registration notes', 'registrations.review': 'Change registration status', 'registrations.approve': 'Approve teacher profiles', 'registrations.documents.review': 'Review registration documents' }],
  ['Franchise', { 'franchises.read': 'View franchise applications', 'franchises.write': 'Edit franchise applications', 'franchises.review': 'Review franchise documents', 'franchises.approve': 'Approve franchises and renewals' }],
  ['Content & notifications', { 'content.read': 'View pages and dropdown lists', 'content.write': 'Edit pages and dropdown lists', 'content.publish': 'Publish pages', 'media.read': 'View media', 'media.write': 'Upload and remove media', 'notifications.read': 'View notifications', 'notifications.write': 'Write notifications', 'notifications.publish': 'Send notifications' }],
  ['Results', { 'results.read': 'View results', 'results.manage': 'Upload and correct results' }],
  ['Administration', { 'accounts.read': 'View user accounts', 'accounts.manage': 'Suspend and restore accounts', 'settings.read': 'View site settings', 'settings.write': 'Change site settings', 'audit.read': 'View audit logs', 'operations.read': 'View job monitoring' }],
];
const labels = Object.assign({}, ...permissionGroups.map(([, items]) => items));
export const permissionLabel = permission => labels[permission] ?? permission;

// Roles fully contained in a permission set, plus anything those roles do not explain.
// `available` limits roles to what the person editing can grant; omit it to judge against the full roles.
export function describeAccess(permissions, available) {
  const has = new Set(permissions);
  const roles = staffRoles.filter(role => { const usable = available ? role.permissions.filter(p => available.includes(p)) : role.permissions; return usable.length > 0 && usable.every(p => has.has(p)); });
  const covered = new Set(roles.flatMap(role => role.permissions));
  return { roles, extras: permissions.filter(p => !covered.has(p)) };
}
export function accessSummary(permissions) {
  if (!permissions?.length) return 'No access yet';
  const { roles, extras } = describeAccess(permissions);
  return [...roles.map(r => r.name), ...(extras.length ? [roles.length ? `+${extras.length} custom` : 'Custom access'] : [])].join(', ');
}
