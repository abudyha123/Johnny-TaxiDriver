// A ride request as it is stored. Saving a request is NOT a ride confirmation:
// only Johnny moves a request to "confirmed".

export const STATUSES = ['new', 'in_progress', 'confirmed', 'cancelled', 'completed'] as const;
export type RequestStatus = (typeof STATUSES)[number];

export type RequestSource = 'website' | 'phone' | 'whatsapp';
export const SOURCE_LABEL_HE: Record<RequestSource, string> = { website: 'אתר', phone: 'טלפון', whatsapp: 'וואטסאפ' };

export const STATUS_LABEL_HE: Record<RequestStatus, string> = {
  new: 'חדשה',
  in_progress: 'בטיפול',
  confirmed: 'אושרה',
  cancelled: 'בוטלה',
  completed: 'הושלמה',
};

export type StatusChange = { status: RequestStatus; at: string; by: string };

export type RideRequest = {
  id: string;                 // idempotency key, created once per form fill
  code: string;               // short reference shown to the customer and to Johnny, e.g. JT-7K3Q9
  createdAt: string;          // ISO
  name: string;
  phone: string;
  from: string;
  to: string;
  date: string;               // YYYY-MM-DD
  time: string;               // HH:MM
  passengers: number;
  wheelchair: boolean;
  wheelchairCount: number;    // 0 when no wheelchair
  email?: string;
  notes?: string;
  lang: string;
  status: RequestStatus;
  history: StatusChange[];
  trackToken?: string;        // secret for the customer's tracking link (admin-only on the request)
  source?: RequestSource;     // where the request came from (absent on early website requests)
  createdBy?: string;         // admin who entered a manual request
  demo?: boolean;
};

export type NewRideRequest = Omit<RideRequest, 'status' | 'history' | 'createdAt' | 'trackToken' | 'source' | 'createdBy'>;
/** Johnny's manual entry: same request, plus where it came from and its starting status. */
export type ManualRideRequest = NewRideRequest & { source: 'phone' | 'whatsapp'; status: 'new' | 'in_progress' | 'confirmed' };

/**
 * What the customer's tracking link can see – deliberately minimal: no name, phone,
 * addresses, accessibility details or admin history.
 */
export type TrackingInfo = { code: string; status: RequestStatus; updatedAt: string; expiresAt: string };

export type TrackingState =
  | { kind: 'loading' }
  | { kind: 'live'; info: TrackingInfo; verifiedAt: string }           // confirmed by the server just now
  | { kind: 'stale'; info: TrackingInfo; verifiedAt: string }          // connection lost – last known only
  | { kind: 'offline' }                                                // never reached the server
  | { kind: 'notFound' };                                              // wrong or expired link

/** 32 random bytes, base64url (43 chars). Unguessable; this – not the short code – grants access. */
export function newTrackToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  let s = '';
  b.forEach((x) => (s += String.fromCharCode(x)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The link stays valid until 7 days after the ride (at least 2 days, at most 120 days from now). */
export function trackExpiry(date: string, time: string, now = Date.now()): Date {
  const ride = new Date(`${date}T${time || '23:59'}`).getTime();
  const DAY = 86400000;
  const want = isNaN(ride) ? now + 30 * DAY : ride + 7 * DAY;
  return new Date(Math.min(Math.max(want, now + 2 * DAY), now + 120 * DAY));
}

/** Public address of the site used in tracking links (VITE_PUBLIC_SITE_URL in production). */
export function siteOrigin(): string {
  const u = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/+$/, '');
  return u && /^https:\/\//.test(u) ? u : window.location.origin;
}

export function trackUrl(token: string, lang: string, origin = siteOrigin()): string {
  // token in the #fragment: browsers never send it to the server or in the Referer header
  return `${origin}/track?l=${encodeURIComponent(lang)}#${token}`;
}

export function newRequestId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return 'r-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/** Short, unambiguous reference derived from the id (no 0/O/1/I). */
export function shortCode(id: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  let s = '';
  for (let i = 0; i < 5; i++) { s += alphabet[h % alphabet.length]; h = Math.floor(h / alphabet.length) ^ (i * 7919); h >>>= 0; }
  return 'JT-' + s;
}

/** Israeli mobile number → wa.me format (9725XXXXXXXX). Returns null when it can't be normalised. */
export function toWhatsAppNumber(phone: string): string | null {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('972') && d.length >= 11) return d;
  if (d.startsWith('0') && d.length === 10) return '972' + d.slice(1);
  if (d.length === 9 && d.startsWith('5')) return '972' + d;
  return null;
}
