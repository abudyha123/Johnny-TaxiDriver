import type { RequestStore } from './store';
import { NewRideRequest, RideRequest, RequestStatus, shortCode } from './types';

// DEMO ONLY: fictitious data kept in this browser's localStorage. Not shared, not secure.
const KEY = 'jt_demo_requests_v1';

function iso(daysFromNow: number, hh: number, mm = 0) {
  const d = new Date(); d.setDate(d.getDate() + daysFromNow); d.setHours(hh, mm, 0, 0); return d;
}
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const hm = (d: Date) => d.toTimeString().slice(0, 5);

function seed(): RideRequest[] {
  const rows: Array<[string, string, string, string, number, number, number, number, RequestStatus, string?]> = [
    // name, phone, from, to, rideDay, rideHour, passengers, wheelchairs, status, notes
    ['דמו – נוסע א׳', '050-000-0001', 'רחוב הדגמה 1, חיפה', 'נתב״ג טרמינל 3', 1, 6, 2, 1, 'new', 'כיסא גלגלים ידני'],
    ['דמו – נוסעת ב׳', '052-000-0002', 'מרכז הכרמל, חיפה', 'בית חולים לדוגמה, חיפה', 0, 14, 1, 1, 'in_progress'],
    ['Demo – Passenger C', '054-000-0003', 'Demo Hotel, Haifa', 'Ben Gurion Airport', 2, 4, 3, 0, 'confirmed'],
    ['דמו – נוסע ד׳', '053-000-0004', 'קריית ים (כתובת לדוגמה)', 'עכו העתיקה', -1, 10, 2, 0, 'completed'],
    ['دمو – راكب هـ', '058-000-0005', 'عنوان تجريبي، حيفا', 'الناصرة', 3, 9, 1, 1, 'new'],
    ['דמו – נוסעת ו׳', '050-000-0006', 'נהריה (כתובת לדוגמה)', 'חיפה', 1, 18, 1, 0, 'cancelled', 'בוטל לבקשת הלקוח (דמו)'],
  ];
  return rows.map(([name, phone, from, to, day, hour, passengers, wc, status, notes], i) => {
    const id = `demo-${i + 1}`;
    const created = iso(-1, 8 + i * 2, 15);
    const ride = iso(day, hour, 30);
    const history = [{ status: 'new' as RequestStatus, at: created.toISOString(), by: 'website' }];
    if (status !== 'new') history.push({ status, at: new Date(created.getTime() + 3600_000).toISOString(), by: 'johnny (demo)' });
    return {
      id, code: shortCode(id), createdAt: created.toISOString(), name, phone, from, to,
      date: ymd(ride), time: hm(ride), passengers, wheelchair: wc > 0, wheelchairCount: wc,
      notes, lang: 'he', status, history, demo: true,
    };
  });
}

function load(): RideRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as RideRequest[];
  } catch { /* storage unavailable */ }
  const s = seed(); save(s); return s;
}
const CHANGED = 'jt-demo-changed';
function save(list: RideRequest[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(CHANGED));
}

export const demoStore: RequestStore = {
  mode: 'demo',
  async create(req: NewRideRequest) {
    await new Promise((r) => setTimeout(r, 250)); // feels like a network call
    const list = load();
    const existing = list.find((r) => r.id === req.id);
    if (existing) return { created: false, request: existing }; // same submission again → no duplicate
    const now = new Date().toISOString();
    const request: RideRequest = { ...req, createdAt: now, status: 'new', history: [{ status: 'new', at: now, by: 'website' }], demo: true };
    save([request, ...list]);
    return { created: true, request };
  },
  subscribe(onData) {
    const push = () => onData(load().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    // same tab (CHANGED) and other tabs of this browser (storage event)
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) push(); };
    window.addEventListener(CHANGED, push);
    window.addEventListener('storage', onStorage);
    push();
    return () => { window.removeEventListener(CHANGED, push); window.removeEventListener('storage', onStorage); };
  },
  async updateStatus(id: string, status: RequestStatus, by: string) {
    const list = load();
    const i = list.findIndex((r) => r.id === id);
    if (i < 0) throw new Error('not found');
    const r = list[i];
    if (r.status === status) return;
    list[i] = { ...r, status, history: [...r.history, { status, at: new Date().toISOString(), by }] };
    save(list);
  },
};

export function resetDemoData() { save(seed()); }
