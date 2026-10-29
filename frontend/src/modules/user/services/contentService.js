import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite, authenticatedUpload } from './authService';
import { queryString } from './collegeService';
export const contentService = {
  page: (key, signal) => httpClient.request('/public/content/' + encodeURIComponent(key), { signal }).then(r => r.data),
  banners: (placement = 'home', signal) => httpClient.request('/public/banners' + queryString({ placement, pageSize: 100 }), { signal }).then(r => r.data),
  settings: signal => httpClient.request('/public/settings', { signal }).then(r => r.data),
  adminList: (resource, query = {}, signal) => httpClient.request(resource + queryString(query), { signal }),
  create: (path, input) => authenticatedWrite(path, input),
  edit: (path, row, input) => authenticatedWrite(path + '/' + row.id, { ...input, expectedRevision: row.revision }, 'PATCH'),
  publish: (path, row, publish) => authenticatedWrite(path + '/' + row.id + '/publish', { publish, expectedRevision: row.revision }),
  archive: (path, row) => authenticatedWrite(path + '/' + row.id, { expectedRevision: row.revision }, 'DELETE'),
  deleteBanner: row => authenticatedWrite('/admin/content/banners/' + row.id, { expectedRevision: row.revision, remove: true }, 'DELETE'),
  async upload(file, purpose, key = crypto.randomUUID(), onState) {
    const data = new FormData(); data.append('purpose', purpose); data.append('idempotencyKey', key); data.append('file', file);
    onState?.('Uploading and validating…');
    const result = await authenticatedUpload('/media', data, true, percent => onState?.(percent === 100 ? 'Upload complete. Inspecting and scanning...' : percent === null ? 'Uploading...' : 'Uploading: ' + percent + '%'));
    onState?.(result.status === 'ready' ? 'Clean and ready' : 'Waiting for a security check'); return result;
  },
};
