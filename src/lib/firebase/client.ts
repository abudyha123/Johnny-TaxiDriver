// Firebase client (Spark / no-cost plan). Loaded lazily: only when a request is saved
// or when Johnny opens /admin, so the public page does not pay for it on first load.
//
// The values below come from Vercel environment variables (VITE_FIREBASE_*).
// A Firebase web config is an identifier, not a secret: security comes from
// firestore.rules on the server, not from hiding these values.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (app) return app;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error('firebase-not-configured');
  }
  app = initializeApp(firebaseConfig);
  // Automated tests only (CI build flag): talk to the local emulators, never a real project.
  if (env.VITE_FIREBASE_EMULATOR === '1') {
    connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
    connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
    return app;
  }
  // Optional extra flood protection. Turned on only when a site key is configured
  // (see FIREBASE_SETUP.md – enable only after confirming it needs no billing account).
  const siteKey = env.VITE_APPCHECK_RECAPTCHA_V3_SITE_KEY as string | undefined;
  if (siteKey) {
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
  }
  return app;
}

export const db = (): Firestore => getFirestore(getApp());
export const auth = (): Auth => getAuth(getApp());
