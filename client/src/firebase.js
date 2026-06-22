// Firebase initialization — reads config from Vite env vars (VITE_FIREBASE_*)
// Set isFirebaseReady = true and provide env vars to enable Firebase mode.
// When disabled, the app uses localStorage as a fallback — Firebase SDK is
// NOT initialized at all so it cannot connect in the background.

// ⚠️  FIREBASE DISABLED — set to true and add env vars to re-enable
export const isFirebaseReady = false;

export const firebaseAuth    = null;
export const firestore       = null;
export const firebaseStorage = null;

if (isFirebaseReady) {
  console.info('[Firebase] ✅ Mode active');
} else {
  console.info('[Firebase] 🔒 Disabled — running in localStorage mode');
}
