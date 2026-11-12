// A ride request as it is stored. Saving a request is NOT a ride confirmation:
// only Johnny moves a request to "confirmed".

export const STATUSES = ['new', 'in_progress', 'confirmed', 'cancelled', 'completed'] as const;
export type RequestStatus = (typeof STATUSES)[number];

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
  demo?: boolean;
};

export type NewRideRequest = Omit<RideRequest, 'status' | 'history' | 'createdAt'>;

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
