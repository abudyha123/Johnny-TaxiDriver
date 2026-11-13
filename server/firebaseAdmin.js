// Server-side only (Vercel Functions). Never imported by the website bundle.
// Credentials come from the FIREBASE_SERVICE_ACCOUNT environment variable (JSON of a
// service-account key), which exists only on the server – never VITE_*.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function adminDb() {
  if (!getApps().length) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      // automated tests: local emulator only
      initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-johnny-taxi-e2e' });
    } else {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!raw) throw Object.assign(new Error('notify-not-configured'), { status: 503 });
      initializeApp({ credential: cert(JSON.parse(raw)) });
    }
  }
  return getFirestore();
}
