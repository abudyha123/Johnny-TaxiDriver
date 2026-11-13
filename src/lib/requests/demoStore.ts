import type { RequestStore } from './store';
import { ManualRideRequest, NewRideRequest, RideRequest, RequestStatus, TrackingInfo, shortCode, newTrackToken, trackExpiry } from './types';

// DEMO ONLY: fictitious data kept in this browser's localStorage. Not shared, not secure.
const KEY = 'jt_demo_requests_v1';
const TKEY = 'jt_demo_tracking_v1'; // token → minimal tracking info (mirrors the real split)

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
      notes, lang: 'he', status, history, demo: true, trackToken: `demo-track-${i + 1}-` + 'x'.repeat(30),
    };
  });
}

type TrackMap = Record<string, TrackingInfo>;
function loadTracks(): TrackMap {
  try { return JSON.parse(localStorage.getItem(TKEY) || '{}') as TrackMap; } catch { return {}; }
}
function saveTracks(m: TrackMap) {
  try { localStorage.setItem(TKEY, JSON.stringify(m)); } catch { /* ignore */ }
}
function trackFor(r: RideRequest): TrackingInfo {
  const last = r.history[r.history.length - 1];
  return { code: r.code, status: r.status, updatedAt: last?.at || r.createdAt, expiresAt: trackExpiry(r.date, r.time).toISOString() };
}

function load(): RideRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as RideRequest[];
  } catch { /* storage unavailable */ }
  const s = seed();
  const m = loadTracks(); s.forEach((r) => { if (r.trackToken) m[r.trackToken] = trackFor(r); }); saveTracks(m);
  save(s); return s;
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
    if (existing) return { created: false, request: existing, trackToken: existing.trackToken || '' }; // no duplicate
    const now = new Date().toISOString();
    const trackToken = newTrackToken();
    const request: RideRequest = { ...req, createdAt: now, status: 'new', history: [{ status: 'new', at: now, by: 'website' }], demo: true, trackToken };
    const m = loadTracks(); m[trackToken] = trackFor(request); saveTracks(m);
    save([request, ...list]);
    return { created: true, request, trackToken };
  },
  async createManual(req: ManualRideRequest, by: string) {
    await new Promise((r) => setTimeout(r, 250));
    const list = load();
    const now = new Date().toISOString();
    const trackToken = newTrackToken();
    const history = [{ status: 'new' as RequestStatus, at: now, by: `${by} (${req.source === 'phone' ? 'טלפון' : 'וואטסאפ'})` }];
    if (req.status !== 'new') history.push({ status: req.status, at: now, by });
    const { source, status, ...rest } = req;
    const request: RideRequest = { ...rest, createdAt: now, status, history, demo: true, trackToken, source, createdBy: by };
    const m = loadTracks(); m[trackToken] = trackFor(request); saveTracks(m);
    save([request, ...list]);
    return { trackToken };
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
  async updateStatus(r0: RideRequest, status: RequestStatus, by: string) {
    const list = load();
    const i = list.findIndex((r) => r.id === r0.id);
    if (i < 0) throw new Error('not found');
    const r = list[i];
    if (r.status === status) return;
    const next = { ...r, status, history: [...r.history, { status, at: new Date().toISOString(), by }] };
    list[i] = next;
    if (next.trackToken) { const m = loadTracks(); m[next.trackToken] = trackFor(next); saveTracks(m); }
    save(list);
  },

  watchTracking(token, cb) {
    const push = () => {
      const info = loadTracks()[token];
      if (!info || new Date(info.expiresAt).getTime() < Date.now()) cb({ kind: 'notFound' });
      else cb({ kind: 'live', info, verifiedAt: new Date().toISOString() });
    };
    const onStorage = (e: StorageEvent) => { if (e.key === TKEY || e.key === KEY) push(); };
    window.addEventListener(CHANGED, push);
    window.addEventListener('storage', onStorage);
    cb({ kind: 'loading' });
    const t = setTimeout(push, 200);
    return () => { clearTimeout(t); window.removeEventListener(CHANGED, push); window.removeEventListener('storage', onStorage); };
  },
};

export function resetDemoData() { localStorage.removeItem(TKEY); localStorage.removeItem(KEY); load(); }
