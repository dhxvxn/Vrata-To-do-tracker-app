// Firebase initialization for optional cross-device sync. All values are the
// PUBLIC web config (safe to ship in the browser). When they're absent the app
// runs entirely on localStorage — sync is simply disabled.

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Public Firebase web config. These are safe to commit — Firebase security is
// enforced by Firestore rules + Authentication authorized domains, not by hiding
// these values. Env vars (VITE_FIREBASE_*) override these if set.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBqYSMaKeP17DXmbQ95vBEv4T2Ittlgzhw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vrata-baf66.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vrata-baf66',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vrata-baf66.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '582450748277',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:582450748277:web:8acc8d53ac6bc9fbe2913c',
};

export const isFirebaseConfigured = (): boolean =>
  !!(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
