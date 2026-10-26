import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
// Configuration here contains public browser identifiers only. Never accept a payload URL.
const config = JSON.parse(new URL(self.location.href).searchParams.get('config') || '{}');
if (config.projectId) onBackgroundMessage(getMessaging(initializeApp(config)), () => {});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(new URL('/notifications', self.location.origin).href));
});
