import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from './authService';
const changed = result => {
  window.dispatchEvent(new Event('kitss:notifications-changed'));
  return result;
};
export const notificationService = {
  list: (page = 1, signal) => httpClient.request('/me/notifications?page=' + page, {
    signal
  }),
  async getNotifications() {
    return (await this.list()).data;
  },
  async markAsRead(id) {
    return changed(await authenticatedWrite('/me/notifications/' + id + '/read', {}, 'PUT'));
  },
  async markAllAsRead(through) {
    return changed(await authenticatedWrite('/me/notifications/read-all', {
      through: through ?? new Date().toISOString()
    }));
  }
};
