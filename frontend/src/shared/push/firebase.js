// Firebase is loaded on demand so it never weighs down the first page load.

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_PUSH_ENABLED === 'true' &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  vapidKey
);

let app = null;
let messagingInstance = null;

export async function getFirebaseMessaging() {
  if (!isFirebaseConfigured) return null;
  if (typeof window === 'undefined') return null;

  let firebaseApp, firebaseMessaging;
  try { [firebaseApp, firebaseMessaging] = await Promise.all([import('firebase/app'), import('firebase/messaging')]); }
  catch { return null; }
  const { initializeApp, getApps } = firebaseApp, { getMessaging, isSupported } = firebaseMessaging;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  try {
    if (!app) {
      const existing = getApps();
      app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
    }
    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (error) {

    return null;
  }
}
