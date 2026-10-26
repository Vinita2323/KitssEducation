import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { backendRoot } from '../../config/env.js';

export function pushPayload(token, notificationId) {
  return { token, notification: { title: 'KITSS Education', body: 'You have a new notification. Sign in to view it.' }, data: { notificationId: String(notificationId), link: '/notifications' }, webpush: { notification: { tag: 'kitss-' + notificationId } } };
}

export async function createFirebaseTransport(config = {}, logger) {
  if (!config.firebase?.pushEnabled) return { configured: false };
  try {
    const raw = config.firebase.configJson || (config.firebase.serviceAccountPath ? await readFile(path.resolve(backendRoot, config.firebase.serviceAccountPath), 'utf8') : '');
    if (!raw) return { configured: false };
    const { initializeApp, cert } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');
    const app = initializeApp({ credential: cert(JSON.parse(raw)) }, 'kitss-push');
    return { configured: true, async send(token, notificationId) {
      try {
        await getMessaging(app).send(pushPayload(token, notificationId));
        return { status: 'sent' };
      } catch (error) {
        return { status: ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(error.code) ? 'invalid_token' : 'retry' };
      }
    } };
  } catch {
    logger?.warn?.({ event: 'firebase_initialization_failed' }, 'Push delivery disabled; check private server configuration');
    return { configured: false };
  }
}
