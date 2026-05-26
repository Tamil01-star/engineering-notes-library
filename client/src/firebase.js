// Firebase initialization — reads config from Vite env vars (VITE_FIREBASE_*)
// When env vars are not set, isFirebaseReady = false and the app uses localStorage fallback.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

// True only when all required Firebase config values are present
export const isFirebaseReady = !!(cfg.apiKey && cfg.projectId && cfg.appId);

let _auth    = null;
let _db      = null;
let _storage = null;

if (isFirebaseReady) {
  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
    _auth    = getAuth(app);
    _db      = getFirestore(app);
    _storage = getStorage(app);
    console.info('[Firebase] ✅ Connected to project:', cfg.projectId);
  } catch (e) {
    console.error('[Firebase] ❌ Init failed:', e.message);
  }
} else {
  console.info('[Firebase] Running in offline/localStorage mode (no Firebase config)');
}

export const firebaseAuth    = _auth;
export const firestore       = _db;
export const firebaseStorage = _storage;
