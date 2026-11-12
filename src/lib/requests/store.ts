import { NewRideRequest, RequestStatus, RideRequest } from './types';
import { demoStore } from './demoStore';

/**
 * Storage interface used by the booking form and the admin screen.
 * The demo implementation keeps fictitious data in this browser only.
 * The production implementation (Firebase, planned) will keep the same interface,
 * with server-side rules: the public may only CREATE a request with status "new",
 * never read or change one; only Johnny's signed-in account may read and update.
 */
export interface RequestStore {
  readonly mode: 'demo' | 'firebase';
  /** Idempotent: creating the same id twice never makes a second request. */
  create(req: NewRideRequest): Promise<{ created: boolean; request: RideRequest }>;
  list(): Promise<RideRequest[]>;
  updateStatus(id: string, status: RequestStatus, by: string): Promise<RideRequest>;
}

export const requestStore: RequestStore = demoStore;
