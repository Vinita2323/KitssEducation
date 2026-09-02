import { mockNotifications, mockAnnouncements } from "../data/mockNotifications";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const notificationService = {
  async getNotifications() {
    await delay(300);
    return mockNotifications;
  },

  async markAsRead(id) {
    await delay(150);
    const item = mockNotifications.find((n) => n.id === id);
    if (item) item.isRead = true;
    return { success: true };
  },

  async markAllAsRead() {
    await delay(200);
    mockNotifications.forEach((n) => (n.isRead = true));
    return { success: true };
  },

  async getAnnouncements() {
    await delay(250);
    return mockAnnouncements;
  }
};
