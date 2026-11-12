// Real ride requests in Cloud Firestore (Spark plan). Every rule that protects the data
// lives in firestore.rules – this file only shapes the writes so they pass those rules.
import {
  collection, doc, onSnapshot, orderBy, query, limit, serverTimestamp,
  Timestamp, updateDoc, arrayUnion, increment, writeBatch, type DocumentData, FirestoreError,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import type { RequestStore } from './store';
import type { NewRideRequest, RideRequest, RequestStatus, StatusChange } from './types';

const SAVE_TIMEOUT_MS = 20000;
const DAY_MS = 86400000;
const toIso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : typeof v === 'string' ? v : new Date(0).toISOString());

function fromDoc(id: string, d: DocumentData): RideRequest {
  const createdAt = toIso(d.createdAt);
  const history: StatusChange[] = [
    { status: 'new', at: createdAt, by: 'website' },
    ...((d.history || []) as { status: RequestStatus; at: unknown; by: string }[]).map((h) => ({ status: h.status, at: toIso(h.at), by: h.by })),
  ];
  return {
    id, code: d.code, createdAt, name: d.name, phone: d.phone, from: d.from, to: d.to, date: d.date, time: d.time,
    passengers: d.passengers, wheelchair: d.wheelchair, wheelchairCount: d.wheelchairCount,
    email: d.email, notes: d.notes, lang: d.lang, status: d.status, history,
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

// Same day number the rules compute from the server clock (UTC days since 1970).
async function writeOnce(req: NewRideRequest, day: number) {
  const fs = db();
  const phoneKey = req.phone.replace(/[^0-9]/g, '');
  const data: Record<string, unknown> = {
    v: 1, id: req.id, code: req.code, name: req.name, phone: req.phone, phoneKey,
    from: req.from, to: req.to, date: req.date, time: req.time,
    passengers: Math.trunc(req.passengers), wheelchair: req.wheelchair, wheelchairCount: Math.trunc(req.wheelchairCount),
    lang: req.lang, status: 'new', history: [], createdAt: serverTimestamp(),
  };
  if (req.email) data.email = req.email;
  if (req.notes) data.notes = req.notes;

  // One atomic batch: the request plus the two daily counters the rules require
  // (site-wide and per phone). Either all three are written or none.
  const b = writeBatch(fs);
  b.set(doc(fs, 'requests', req.id), data);
  b.set(doc(fs, 'dailyCount', String(day)), { n: increment(1), lastId: req.id }, { merge: true });
  b.set(doc(fs, 'phoneDaily', `${day}_${phoneKey}`), { n: increment(1), lastId: req.id }, { merge: true });
  await b.commit();
}

export const firestoreStore: RequestStore = {
  mode: 'firebase',

  async create(req) {
    const attempt = async () => {
      const now = Date.now();
      const day = Math.floor(now / DAY_MS);
      try {
        await writeOnce(req, day);
      } catch (e) {
        // Only if this device's clock is within minutes of UTC midnight may it disagree with
        // the server about the day number: retry once with the neighbouring day.
        const intoDay = now - day * DAY_MS;
        const near = intoDay < 10 * 60000 ? day - 1 : intoDay > DAY_MS - 10 * 60000 ? day + 1 : null;
        if (!(e instanceof FirestoreError && e.code === 'permission-denied') || near === null) throw e;
        await writeOnce(req, near);
      }
    };
    await withTimeout(attempt(), SAVE_TIMEOUT_MS);
    const now = new Date().toISOString();
    return { created: true, request: { ...req, createdAt: now, status: 'new', history: [{ status: 'new', at: now, by: 'website' }] } };
  },

  subscribe(onData, onError) {
    const q = query(collection(db(), 'requests'), orderBy('createdAt', 'desc'), limit(200));
    return onSnapshot(q, (snap) => onData(snap.docs.map((d) => fromDoc(d.id, d.data()))), (e) => onError(e));
  },

  async updateStatus(id, status, by) {
    await withTimeout(updateDoc(doc(db(), 'requests', id), {
      status,
      history: arrayUnion({ status, at: Timestamp.now(), by }),
      updatedAt: serverTimestamp(),
      updatedBy: by,
    }), 20000);
  },
};
