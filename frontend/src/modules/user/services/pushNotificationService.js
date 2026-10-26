import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, firebaseConfig, vapidKey, isFirebaseConfigured } from '../../../shared/push/firebase';
import workerUrl from '../../../shared/push/firebase-sw.js?worker&url';
import { httpClient, getIdentityEpoch } from '../../../shared/api/httpClient';
import { authenticatedWrite } from './authService';
let registeredToken = null;
export function getNotificationPermission() {
  return typeof window !== 'undefined' && typeof window.Notification !== 'undefined' ? Notification.permission : 'unsupported';
}
export async function registerFCMToken() {
  const epoch = getIdentityEpoch();
  if (!isFirebaseConfigured || !(await httpClient.request('/me/push-config')).data.enabled) throw new Error('Push delivery is not enabled by the operator');
  if (getNotificationPermission() === 'unsupported') throw new Error('Push is not supported in this browser');
  if (await Notification.requestPermission() !== 'granted') throw new Error('Notification permission was not granted');
  const messaging = await getFirebaseMessaging();
  if (!messaging) throw new Error('Push is not supported in this browser');
  const url = new URL(workerUrl, window.location.href);
  url.searchParams.set('config', JSON.stringify(firebaseConfig));
  const registration = await navigator.serviceWorker.register(url.href);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Could not register this device');
  await authenticatedWrite('/me/fcm-tokens', { token, platform: 'web', deviceLabel: 'Browser' }, 'POST', true, {}, { expectedIdentityEpoch: epoch });
  registeredToken = token;
  return true;
}
export async function unregisterFCMToken({ removeProvider = true } = {}) {
  const token = registeredToken;
  registeredToken = null;
  if (token) await authenticatedWrite('/me/fcm-tokens', { token }, 'DELETE');
  if (removeProvider) {
    const messaging = await getFirebaseMessaging();
    if (messaging) await deleteToken(messaging);
  }
}
export async function setupForegroundNotificationHandler(handler) {
  const messaging = await getFirebaseMessaging();
  return messaging ? onMessage(messaging, () => handler()) : () => {};
}
export const pushNotificationService = {
  isConfigured: isFirebaseConfigured,
  getPermission: getNotificationPermission,
  register: registerFCMToken,
  unregister: unregisterFCMToken,
  setupForegroundHandler: setupForegroundNotificationHandler,
};
