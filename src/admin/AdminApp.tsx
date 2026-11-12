import React, { useEffect, useMemo, useState } from 'react';
import { Phone, MessageCircle, Search, LogOut, RotateCcw, Accessibility, Users, MapPin, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { requestStore } from '../lib/requests/store';
import { resetDemoData } from '../lib/requests/demoStore';
import { RideRequest, RequestStatus, STATUSES, STATUS_LABEL_HE, toWhatsAppNumber } from '../lib/requests/types';

/**
 * Johnny's private request screen (Hebrew, mobile-first).
 * DEMO: sign-in below is a placeholder and data is fictitious and local to this browser.
 * In production the screen is shown only to Johnny's signed-in account and the data rules
 * on the server refuse everyone else – hiding this page is not what protects the data.
 */

const DEMO_PASSWORD = 'demo';
const SESSION_KEY = 'jt_demo_admin';

const STATUS_STYLE: Record<RequestStatus, string> = {
  new: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-900 border-blue-300',
  confirmed: 'bg-green-100 text-green-900 border-green-300',
  cancelled: 'bg-gray-200 text-gray-700 border-gray-300',
  completed: 'bg-slate-800 text-white border-slate-800',
};

const fmtRide = (r: RideRequest) => {
  const d = new Date(`${r.date}T${r.time || '00:00'}`);
  if (isNaN(d.getTime())) return `${r.date} ${r.time}`;
  return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' }) + ' · ' + r.time;
};
const fmtAgo = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'עכשיו';
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  if (h < 24) return `לפני ${h} שע׳`;
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
};

function customerWhatsApp(r: RideRequest) {
  const n = toWhatsAppNumber(r.phone);
  if (!n) return null;
  // Johnny edits and sends this himself – nothing is sent automatically.
  const text = `שלום ${r.name}, כאן ג׳וני טקסי בנוגע לבקשת הנסיעה ${r.code} (${fmtRide(r)}, ${r.from} ← ${r.to}).`;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

const Login: React.FC<{ onIn: () => void }> = ({ onIn }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center p-6">
      <form className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6" onSubmit={(e) => { e.preventDefault(); if (pw === DEMO_PASSWORD) { sessionStorage.setItem(SESSION_KEY, '1'); onIn(); } else setErr('סיסמה שגויה'); }}>
        <p className="text-yellow-400 font-bold">ג׳וני טקסי</p>
        <h1 className="text-2xl font-black mt-1 mb-4">כניסה לניהול בקשות</h1>
        <div className="text-sm bg-yellow-400/10 border border-yellow-400/40 text-yellow-100 rounded-lg p-3 mb-4">
          מצב הדגמה: הכניסה כאן אינה מאובטחת ונועדה רק להצגת המסך. סיסמת ההדגמה: <b className="ltr-num">demo</b>.
          בגרסה האמיתית הכניסה תהיה לחשבון של ג׳וני בלבד.
        </div>
        <label className="block text-sm mb-1" htmlFor="pw">סיסמה</label>
        <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-lg px-3 py-3 text-gray-900" autoComplete="current-password" />
        {err && <p className="text-red-300 text-sm mt-2" role="alert">{err}</p>}
        <button className="btn-yellow w-full mt-4" type="submit">כניסה</button>
      </form>
    </div>
  );
};

const RequestCard: React.FC<{ r: RideRequest; dup: boolean; onStatus: (s: RequestStatus) => Promise<void> }> = ({ r, dup, onStatus }) => {
  const [pending, setPending] = useState<RequestStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const wa = customerWhatsApp(r);
  const apply = async (s: RequestStatus) => { setBusy(true); try { await onStatus(s); } finally { setBusy(false); setPending(null); } };
  const choose = (s: RequestStatus) => (s === 'confirmed' || s === 'cancelled' ? setPending(s) : apply(s));

  return (
    <li className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold border rounded-full px-3 py-1 ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL_HE[r.status]}</span>
          <span className="ltr-num text-sm text-gray-500 font-semibold">{r.code}</span>
          {dup && <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-800 bg-orange-100 rounded-full px-2 py-1"><AlertTriangle size={14} />ייתכן שכפול</span>}
        </div>
        <span className="text-xs text-gray-500">התקבלה {fmtAgo(r.createdAt)}</span>
      </div>

      <div className="mt-3 grid gap-1.5 text-gray-900">
        <p className="text-lg font-bold">{r.name}</p>
        <p className="flex items-center gap-2"><Clock size={16} className="text-gray-500 shrink-0" /><span className="font-semibold">{fmtRide(r)}</span></p>
        <p className="flex items-start gap-2"><MapPin size={16} className="text-gray-500 shrink-0 mt-1" /><span>{r.from} <span className="text-gray-400">←</span> {r.to}</span></p>
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1"><Users size={16} className="text-gray-500" />{r.passengers} נוסעים</span>
          {r.wheelchair
            ? <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5"><Accessibility size={16} />כיסא גלגלים ×{r.wheelchairCount}</span>
            : <span className="text-gray-500">ללא כיסא גלגלים</span>}
        </p>
        {r.notes && <p className="text-sm bg-gray-50 rounded-lg px-3 py-2">{r.notes}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-green-600 text-white font-bold"><MessageCircle size={18} />וואטסאפ ללקוח</a>}
        <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-gray-300 font-bold text-gray-800"><Phone size={18} /><span className="ltr-num">{r.phone}</span></a>
      </div>

      <fieldset className="mt-4" disabled={busy}>
        <legend className="text-xs font-bold text-gray-500 mb-2">עדכון סטטוס</legend>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s} type="button" onClick={() => choose(s)} aria-pressed={r.status === s}
              className={`min-h-[40px] px-3 rounded-lg border text-sm font-bold ${r.status === s ? STATUS_STYLE[s] : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
              {STATUS_LABEL_HE[s]}
            </button>
          ))}
        </div>
        {pending && (
          <div className="mt-3 rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm" role="alertdialog" aria-label="אישור שינוי סטטוס">
            <p className="font-bold">{pending === 'confirmed' ? 'לסמן את הנסיעה כמאושרת?' : 'לסמן את הבקשה כמבוטלת?'}</p>
            <p className="text-gray-600 mt-1">הסימון כאן לא שולח הודעה ללקוח. יש לעדכן אותו בעצמך, בוואטסאפ או בטלפון.</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => apply(pending)} className="btn-yellow btn-sm">כן, {STATUS_LABEL_HE[pending]}</button>
              <button type="button" onClick={() => setPending(null)} className="min-h-[44px] px-4 rounded-xl border border-gray-300 font-bold">ביטול</button>
            </div>
          </div>
        )}
      </fieldset>

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-3 inline-flex items-center gap-1 text-sm text-gray-600 font-semibold">
        היסטוריה <ChevronDown size={16} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <ol className="mt-2 text-sm text-gray-700 space-y-1">
          {r.history.map((h, i) => (
            <li key={i}>{new Date(h.at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })} – {STATUS_LABEL_HE[h.status]} <span className="text-gray-400">({h.by})</span></li>
          ))}
        </ol>
      )}
    </li>
  );
};

const AdminApp: React.FC = () => {
  const [signedIn, setSignedIn] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [items, setItems] = useState<RideRequest[]>([]);
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'received' | 'ride'>('received');

  useEffect(() => {
    document.documentElement.lang = 'he'; document.documentElement.dir = 'rtl';
    document.title = 'ניהול בקשות | ג׳וני טקסי';
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    return () => { m.remove(); };
  }, []);

  const refresh = () => requestStore.list().then(setItems);
  useEffect(() => { if (signedIn) refresh(); }, [signedIn]);
  useEffect(() => { // new requests from the site in another tab show up here (demo)
    const on = (e: StorageEvent) => { if (e.key?.startsWith('jt_demo_requests')) refresh(); };
    window.addEventListener('storage', on); return () => window.removeEventListener('storage', on);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    STATUSES.forEach((s) => (c[s] = items.filter((r) => r.status === s).length));
    return c;
  }, [items]);

  // same phone + same ride date/time from two different submissions → flag, Johnny decides
  const dupIds = useMemo(() => {
    const seen = new Map<string, string[]>();
    items.forEach((r) => { const k = `${r.phone.replace(/\D/g, '')}|${r.date}|${r.time}`; seen.set(k, [...(seen.get(k) || []), r.id]); });
    return new Set([...seen.values()].filter((v) => v.length > 1).flat());
  }, [items]);

  const shown = useMemo(() => {
    const s = q.trim();
    return items
      .filter((r) => filter === 'all' || r.status === filter)
      .filter((r) => !s || [r.name, r.phone, r.code, r.from, r.to].some((x) => x.includes(s)))
      .sort((a, b) => (sort === 'ride' ? `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`) : b.createdAt.localeCompare(a.createdAt)));
  }, [items, filter, q, sort]);

  if (!signedIn) return <Login onIn={() => setSignedIn(true)} />;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#0b0f14] text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-yellow-400 font-bold text-sm">ג׳וני טקסי</p>
            <h1 className="text-xl font-black">בקשות נסיעה</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { resetDemoData(); refresh(); }} className="icon-btn" aria-label="איפוס נתוני ההדגמה" title="איפוס נתוני ההדגמה"><RotateCcw size={18} /></button>
            <button type="button" onClick={() => { sessionStorage.removeItem(SESSION_KEY); setSignedIn(false); }} className="icon-btn" aria-label="יציאה" title="יציאה"><LogOut size={18} /></button>
          </div>
        </div>
        <div className="bg-yellow-400 text-gray-900 text-sm font-semibold text-center px-4 py-1.5">
          הדגמה: נתונים פיקטיביים שנשמרים רק בדפדפן הזה. בקשה שנשמרת אינה אישור נסיעה.
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="tablist" aria-label="סינון לפי סטטוס">
          {(['all', ...STATUSES] as const).map((s) => (
            <button key={s} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)}
              className={`shrink-0 min-h-[40px] px-3 rounded-full border text-sm font-bold ${filter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>
              {s === 'all' ? 'הכול' : STATUS_LABEL_HE[s]} <span className="opacity-70">({counts[s] || 0})</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <label className="flex-1 min-w-[200px] relative">
            <span className="sr-only">חיפוש</span>
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם, טלפון, מספר בקשה או כתובת" className="w-full rounded-xl border border-gray-300 ps-10 pe-3 py-2.5" />
          </label>
          <label className="text-sm text-gray-700 flex items-center gap-2">מיון
            <select value={sort} onChange={(e) => setSort(e.target.value as 'received' | 'ride')} className="rounded-lg border border-gray-300 px-2 py-2">
              <option value="received">לפי זמן קבלה</option>
              <option value="ride">לפי מועד הנסיעה</option>
            </select>
          </label>
        </div>

        {shown.length === 0
          ? <p className="mt-10 text-center text-gray-500">אין בקשות להצגה.</p>
          : (
            <ul className="mt-4 grid gap-4">
              {shown.map((r) => (
                <RequestCard key={r.id} r={r} dup={dupIds.has(r.id)}
                  onStatus={async (s) => { const u = await requestStore.updateStatus(r.id, s, 'johnny (demo)'); setItems((list) => list.map((x) => (x.id === u.id ? u : x))); }} />
              ))}
            </ul>
          )}
      </main>
    </div>
  );
};

export default AdminApp;
