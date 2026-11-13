import { ManualRideRequest, NewRideRequest, RequestStatus, RideRequest, TrackingState } from './types';
import { demoStore } from './demoStore';

/**
 * Storage interface used by the booking form and the admin screen.
 *
 * Two completely separate modes – demo data never reaches the real database:
 *  - 'demo'     fictitious data kept in this browser only (localStorage).
 *  - 'firebase' real customer requests in Cloud Firestore. Server rules (firestore.rules)
 *               let the public only CREATE a valid request; reading and updating is
 *               allowed only for accounts listed in /admins by the project owner.
 *
 * The mode is 'firebase' when the VITE_FIREBASE_* variables are set, otherwise 'demo'.
 * VITE_REQUESTS_MODE=demo forces demo even when Firebase is configured.
 */
export interface RequestStore {
  readonly mode: 'demo' | 'firebase';
  /** Resolves only after the server confirmed the save. Idempotent per request id. */
  create(req: NewRideRequest): Promise<{ created: boolean; request: RideRequest; trackToken: string }>;
  /** Admin only: a request received by phone/WhatsApp, same structure + tracking link. */
  createManual(req: ManualRideRequest, by: string): Promise<{ trackToken: string }>;
  /** Live list for the admin screen. Returns an unsubscribe function. */
  subscribe(onData: (list: RideRequest[]) => void, onError: (e: Error) => void): () => void;
  /** Request + its public tracking status are changed together (one atomic write). */
  updateStatus(r: RideRequest, status: RequestStatus, by: string): Promise<void>;
  /** Live tracking status for the customer's link. Returns an unsubscribe function. */
  watchTracking(token: string, cb: (s: TrackingState) => void): () => void;
}

const env = import.meta.env;
export const REQUESTS_MODE: 'demo' | 'firebase' =
  env.VITE_REQUESTS_MODE !== 'demo' && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_APP_ID
    ? 'firebase'
    : 'demo';

let cached: Promise<RequestStore> | null = null;

/** Firebase code is downloaded only when this is first called. */
export function getRequestStore(): Promise<RequestStore> {
  if (!cached) {
    cached = REQUESTS_MODE === 'firebase'
      ? import('./firestoreStore').then((m) => m.firestoreStore)
      : Promise.resolve(demoStore);
    cached.catch(() => { cached = null; }); // a failed chunk download can be retried
  }
  return cached;
}
