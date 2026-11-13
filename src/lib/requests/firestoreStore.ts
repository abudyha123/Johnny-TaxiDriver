// Real ride requests in Cloud Firestore (Spark plan). Every rule that protects the data
// lives in firestore.rules – this file only shapes the writes so they pass those rules.
import {
  collection, doc, onSnapshot, orderBy, query, limit, serverTimestamp,
  Timestamp, arrayUnion, increment, writeBatch, type DocumentData, FirestoreError,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import type { RequestStore } from './store';
import { newTrackToken, trackExpiry, type ManualRideRequest, type NewRideRequest, type RideRequest, type RequestStatus, type StatusChange, type TrackingInfo } from './types';

const SAVE_TIMEOUT_MS = 20000;
const DAY_MS = 86400000;
const toIso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : typeof v === 'string' ? v : new Date(0).toISOString());

function fromDoc(id: string, d: DocumentData): RideRequest {
  const createdAt = toIso(d.createdAt);
  const manual = d.source === 'phone' || d.source === 'whatsapp';
  const history: StatusChange[] = [
    { status: 'new', at: createdAt, by: manual ? `${d.createdBy} (${d.source === 'phone' ? 'טלפון' : 'וואטסאפ'})` : 'website' },
    ...((d.history || []) as { status: RequestStatus; at: unknown; by: string }[]).map((h) => ({ status: h.status, at: toIso(h.at), by: h.by })),
  ];
  return {
    id, code: d.code, createdAt, name: d.name, phone: d.phone, from: d.from, to: d.to, date: d.date, time: d.time,
    passengers: d.passengers, wheelchair: d.wheelchair, wheelchairCount: d.wheelchairCount,
    email: d.email, notes: d.notes, lang: d.lang, status: d.status, history,
    trackToken: typeof d.trackToken === 'string' ? d.trackToken : undefined,
    source: d.source || 'website', createdBy: d.createdBy,
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

// Same day number the rules compute from the server clock (UTC days since 1970).
async function writeOnce(req: NewRideRequest, day: number, trackToken: string) {
  const fs = db();
  const phoneKey = req.phone.replace(/[^0-9]/g, '');
  const data: Record<string, unknown> = {
    v: 1, id: req.id, code: req.code, name: req.name, phone: req.phone, phoneKey,
    from: req.from, to: req.to, date: req.date, time: req.time,
    passengers: Math.trunc(req.passengers), wheelchair: req.wheelchair, wheelchairCount: Math.trunc(req.wheelchairCount),
    lang: req.lang, status: 'new', history: [], createdAt: serverTimestamp(),
    trackToken, source: 'website',
  };
  if (req.email) data.email = req.email;
  if (req.notes) data.notes = req.notes;

  // One atomic batch: the private request, its public tracking status (separate document,
  // minimal fields) and the two daily counters the rules require. All or nothing.
  const b = writeBatch(fs);
  b.set(doc(fs, 'requests', req.id), data);
  b.set(doc(fs, 'tracking', trackToken), {
    v: 1, rid: req.id, code: req.code, status: 'new',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(trackExpiry(req.date, req.time)),
  });
  b.set(doc(fs, 'dailyCount', String(day)), { n: increment(1), lastId: req.id }, { merge: true });
  b.set(doc(fs, 'phoneDaily', `${day}_${phoneKey}`), { n: increment(1), lastId: req.id }, { merge: true });
  await b.commit();
}

function requestData(req: NewRideRequest) {
  const data: Record<string, unknown> = {
    v: 1, id: req.id, code: req.code, name: req.name, phone: req.phone, phoneKey: req.phone.replace(/[^0-9]/g, ''),
    from: req.from, to: req.to, date: req.date, time: req.time,
    passengers: Math.trunc(req.passengers), wheelchair: req.wheelchair, wheelchairCount: Math.trunc(req.wheelchairCount),
    lang: req.lang, createdAt: serverTimestamp(),
  };
  if (req.email) data.email = req.email;
  if (req.notes) data.notes = req.notes;
  return data;
}

export const firestoreStore: RequestStore = {
  async createManual(req: ManualRideRequest, by: string) {
    const fs = db();
    const trackToken = newTrackToken();
    const history = req.status === 'new' ? [] : [{ status: req.status, at: Timestamp.now(), by }];
    const b = writeBatch(fs);
    b.set(doc(fs, 'requests', req.id), {
      ...requestData(req), status: req.status, history, trackToken, source: req.source, createdBy: by,
    });
    b.set(doc(fs, 'tracking', trackToken), {
      v: 1, rid: req.id, code: req.code, status: req.status,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(trackExpiry(req.date, req.time)),
    });
    await withTimeout(b.commit(), 20000);
    return { trackToken };
  },

  mode: 'firebase',

  async create(req) {
    const trackToken = newTrackToken();
    const attempt = async () => {
      const now = Date.now();
      const day = Math.floor(now / DAY_MS);
      try {
        await writeOnce(req, day, trackToken);
      } catch (e) {
        // Only if this device's clock is within minutes of UTC midnight may it disagree with
        // the server about the day number: retry once with the neighbouring day.
        const intoDay = now - day * DAY_MS;
        const near = intoDay < 10 * 60000 ? day - 1 : intoDay > DAY_MS - 10 * 60000 ? day + 1 : null;
        if (!(e instanceof FirestoreError && e.code === 'permission-denied') || near === null) throw e;
        await writeOnce(req, near, trackToken);
      }
    };
    await withTimeout(attempt(), SAVE_TIMEOUT_MS);
    // Saved for sure. Ask the server to tell Johnny – fire-and-forget: the server checks the
    // request exists itself, and a failure here never changes what the customer sees.
    try {
      fetch('/api/notify-new-request', {
        method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: req.id }),
      }).catch(() => {});
    } catch { /* ignore */ }
    const now = new Date().toISOString();
    return { created: true, trackToken, request: { ...req, createdAt: now, status: 'new', history: [{ status: 'new', at: now, by: 'website' }], trackToken } };
  },

  subscribe(onData, onError) {
    const q = query(collection(db(), 'requests'), orderBy('createdAt', 'desc'), limit(200));
    return onSnapshot(q, (snap) => onData(snap.docs.map((d) => fromDoc(d.id, d.data()))), (e) => onError(e));
  },

  async updateStatus(r, status, by) {
    const fs = db();
    // Request and public tracking status change in one atomic batch; the rules refuse
    // either one alone, so the two can't disagree.
    const b = writeBatch(fs);
    b.update(doc(fs, 'requests', r.id), {
      status,
      history: arrayUnion({ status, at: Timestamp.now(), by }),
      updatedAt: serverTimestamp(),
      updatedBy: by,
    });
    if (r.trackToken) b.update(doc(fs, 'tracking', r.trackToken), { status, updatedAt: serverTimestamp() });
    await withTimeout(b.commit(), 20000);
  },

  watchTracking(token, cb) {
    let info: TrackingInfo | null = null;
    let verifiedAt = '';
    let gone = false; // wrong/expired link – final
    cb({ kind: 'loading' });
    const report = () => {
      if (gone) return;
      if (!info) return cb(navigator.onLine ? { kind: 'loading' } : { kind: 'offline' });
      const fresh = navigator.onLine && !lastFromCache;
      cb(fresh ? { kind: 'live', info, verifiedAt } : { kind: 'stale', info, verifiedAt });
    };
    let lastFromCache = true;
    const off = onSnapshot(doc(db(), 'tracking', token), { includeMetadataChanges: true }, (snap) => {
      lastFromCache = snap.metadata.fromCache;
      if (!snap.exists()) { if (!snap.metadata.fromCache) { gone = true; cb({ kind: 'notFound' }); } return; }
      const d = snap.data();
      const next: TrackingInfo = { code: d.code, status: d.status, updatedAt: toIso(d.updatedAt), expiresAt: toIso(d.expiresAt) };
      if (new Date(next.expiresAt).getTime() < Date.now()) { gone = true; info = null; cb({ kind: 'notFound' }); return; }
      info = next;
      if (!snap.metadata.fromCache) verifiedAt = new Date().toISOString();
      report();
    }, (e) => {
      // wrong or expired token → the rules refuse the read
      if (e.code === 'permission-denied' || e.code === 'not-found') { gone = true; cb({ kind: 'notFound' }); }
      else report();
    });
    // A watchdog: if nothing has been confirmed by the server for a while, say so.
    const onNet = () => { if (!navigator.onLine) lastFromCache = true; report(); };
    window.addEventListener('online', onNet);
    window.addEventListener('offline', onNet);
    const t = setTimeout(() => { if (!info && !gone) cb({ kind: 'offline' }); }, 15000);
    return () => { clearTimeout(t); off(); window.removeEventListener('online', onNet); window.removeEventListener('offline', onNet); };
  },
};
