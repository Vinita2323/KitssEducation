import { httpClient, setCsrfToken, getIdentityEpoch, ApiError } from '../../../shared/api/httpClient';
let csrfReady;
async function csrf() {
  csrfReady ??= httpClient.request('/auth/csrf').then(({ data }) => setCsrfToken(data.csrfToken)).catch(error => { csrfReady = null; throw error; });
  await csrfReady;
}
export async function authenticatedWrite(path, json, method = 'POST', retry = true, headers = {}, { signal, expectedIdentityEpoch = getIdentityEpoch() } = {}) {
  signal?.throwIfAborted();
  if (expectedIdentityEpoch !== getIdentityEpoch()) throw new ApiError('Account changed; retry from the current account', { code: 'ABORTED' });
  await csrf();
  signal?.throwIfAborted();
  if (expectedIdentityEpoch !== getIdentityEpoch()) throw new ApiError('Account changed; retry from the current account', { code: 'ABORTED' });
  try { return (await httpClient.request(path, { method, json, headers, signal })).data; }
  catch (error) {
    if (retry && error.code === 'CSRF_INVALID') { csrfReady = null; return authenticatedWrite(path, json, method, false, headers, { signal, expectedIdentityEpoch }); }
    throw error;
  }
}
export async function authenticatedUpload(path, formData, retry = true, onUploadProgress) {
  await csrf();
  try { return (await httpClient.request(path, { method: 'POST', formData, onUploadProgress, timeout: 720000 })).data; }
  catch (error) { if (retry && error.code === 'CSRF_INVALID') { csrfReady = null; return authenticatedUpload(path, formData, false, onUploadProgress); } throw error; }
}
export function clearLegacyAuthStorage() {
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      const store = window[name];
      for (const key of ['kitss_student_user', 'kitss_auth_token', 'kitss_device_id', 'kitss_active_device_session', 'kitss_registered_users', 'kitss_last_registered_credentials', 'kitss_purchased_books', 'kitss_reading_progress', 'kitss_book_bookmarks', 'kits_coaching_mock_store']) store.removeItem(key);
    } catch { /* Storage may be disabled; authentication never depends on it. */ }
  }
}
const write = authenticatedWrite;
export const authService = {
  async getCurrentUser() {
    try { return (await httpClient.request('/auth/me')).data.user; }
    catch (error) { if (error.status === 401) return null; throw error; }
  },
  async login(identifier, password, rememberMe, kind = 'student') {
    try { return { success: true, ...await write('/auth/login', { identifier, password, rememberMe, kind, deviceLabel: 'Browser' }) }; }
    catch (error) { if (error.code === 'DEVICE_CONFLICT') return { deviceConflict: true, ...error.data }; throw error; }
  },
  transfer: data => write('/auth/session/transfer', { ...data, confirmed: true, deviceLabel: 'Browser' }),
  createAccount: data => write('/auth/accounts', data),
  resend: email => write('/auth/email/resend', { email }),
  activate: data => write('/auth/activate', data),
  acceptInvitation: data => write('/auth/invitations/accept', data),
  invite: data => write('/admin/users/invitations', data),
  revokeInvitation: id => write('/admin/users/invitations/' + encodeURIComponent(id), {}, 'DELETE'),
  forgotPassword: identifier => write('/auth/password/forgot', { identifier }),
  resetPassword: data => write('/auth/password/reset', data),
  changePassword: (currentPassword, newPassword) => write('/auth/password/change', { currentPassword, newPassword }),
  async logout() { await write('/auth/logout', {}); csrfReady = null; setCsrfToken(undefined); },
  async register() { throw new Error('Business registration is awaiting backend integration. Create and verify an identity account from Login.'); },
  updateProfile: data => write('/me/profile', data, 'PATCH'),
  getPreferences: signal => httpClient.request('/me/preferences', { signal }).then(r => r.data),
  savePreferences: data => write('/me/preferences', data, 'PATCH'),
  requestEmailChange: data => write('/me/email-change', data),
  confirmEmailChange: data => write('/me/email-change/confirm', data),
};
