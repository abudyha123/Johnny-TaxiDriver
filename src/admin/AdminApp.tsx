import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Search, LogOut, RotateCcw, Accessibility, Users, MapPin, Clock, AlertTriangle, ChevronDown, Copy, Info, Plus, PhoneCall } from 'lucide-react';
import { getRequestStore, REQUESTS_MODE } from '../lib/requests/store';
import { resetDemoData } from '../lib/requests/demoStore';
import { watchAdmin, signIn, signOutAdmin, sendReset, authErrorHe, type AuthState } from './adminAuth';
import { RideRequest, RequestStatus, STATUSES, STATUS_LABEL_HE, SOURCE_LABEL_HE, toWhatsAppNumber, trackUrl } from '../lib/requests/types';
import ManualRequestForm from './ManualRequestForm';

/**
 * Johnny's private request screen (Hebrew, mobile-first).
 * firebase mode: Firebase Authentication + an allowlist (/admins) checked again by the
 * server rules – hiding this page is not what protects the data.
 * demo mode: fictitious data local to this browser, placeholder password "demo".
 */
const IS_DEMO = REQUESTS_MODE === 'demo';

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
const rideMs = (r: RideRequest) => new Date(`${r.date}T${r.time || '00:00'}`).getTime();
const dayLabel = (r: RideRequest) => {
  const d = new Date(`${r.date}T00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const date = d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' });
  if (diff === 0) return `היום · ${date}`;
  if (diff === 1) return `מחר · ${date}`;
  if (diff < 0) return `עבר · ${date}`;
  return date;
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

const LANG_LOCALE: Record<string, string> = { he: 'he-IL', ar: 'ar-u-nu-latn', en: 'en-GB' };
function rideWhen(r: RideRequest) {
  const d = new Date(`${r.date}T${r.time || '00:00'}`);
  const loc = LANG_LOCALE[r.lang] || 'he-IL';
  return isNaN(d.getTime()) ? `${r.date} ${r.time}` : `${d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })} ${r.time}`;
}
/** Ready-made confirmation in the customer's language. Johnny sends it himself. */
function confirmationText(r: RideRequest) {
  const link = r.trackToken ? trackUrl(r.trackToken, r.lang) : '';
  const when = rideWhen(r);
  if (r.lang === 'en') return [`Hello ${r.name}, this is Johnny Taxi.`, `Your ride is confirmed: ${when}.`, `From: ${r.from}`, `To: ${r.to}`, `Request number: ${r.code}`, ...(link ? [`Track your request: ${link}`] : [])].join('\n');
  if (r.lang === 'ar') return [`مرحبًا ${r.name}، معكم جوني تاكسي.`, `تم تأكيد رحلتكم: ${when}.`, `من: ${r.from}`, `إلى: ${r.to}`, `رقم الطلب: ${r.code}`, ...(link ? [`متابعة الطلب: ${link}`] : [])].join('\n');
  return [`שלום ${r.name}, כאן ג׳וני טקסי.`, `הנסיעה שלך אושרה: ${when}.`, `מוצא: ${r.from}`, `יעד: ${r.to}`, `מספר בקשה: ${r.code}`, ...(link ? [`מעקב אחר הבקשה: ${link}`] : [])].join('\n');
}

const Login: React.FC<{ notAllowed?: string }> = ({ notAllowed }) => {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setErr(''); setInfo('');
    try { await signIn(email, pw); } catch (x) { setErr(authErrorHe(x)); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center p-6">
      <form className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6" onSubmit={submit} noValidate>
        <p className="text-yellow-400 font-bold">ג׳וני טקסי</p>
        <h1 className="text-2xl font-black mt-1 mb-4">כניסה לניהול בקשות</h1>
        {IS_DEMO && (
          <div className="text-sm bg-yellow-400/10 border border-yellow-400/40 text-yellow-100 rounded-lg p-3 mb-4">
            מצב הדגמה: הכניסה כאן אינה מאובטחת ונועדה רק להצגת המסך. סיסמת ההדגמה: <b className="ltr-num">demo</b>.
          </div>
        )}
        {notAllowed && (
          <div className="text-sm bg-red-500/15 border border-red-400/50 text-red-100 rounded-lg p-3 mb-4" role="alert">
            לחשבון <b dir="ltr">{notAllowed}</b> אין הרשאה למסך הזה.
            <button type="button" className="underline ms-1" onClick={() => signOutAdmin()}>יציאה</button>
          </div>
        )}
        {!IS_DEMO && (
          <>
            <label className="block text-sm mb-1" htmlFor="em">אימייל</label>
            <input id="em" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg px-3 py-3 text-gray-900 mb-3" autoComplete="username" required />
          </>
        )}
        <label className="block text-sm mb-1" htmlFor="pw">סיסמה</label>
        <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-lg px-3 py-3 text-gray-900" autoComplete="current-password" required />
        {err && <p className="text-red-300 text-sm mt-2" role="alert">{err}</p>}
        {info && <p className="text-green-300 text-sm mt-2" role="status">{info}</p>}
        <button className="btn-yellow w-full mt-4 disabled:opacity-60" type="submit" disabled={busy}>{busy ? 'נכנסים…' : 'כניסה'}</button>
        {!IS_DEMO && (
          <button type="button" className="w-full mt-3 text-sm text-gray-300 underline"
            onClick={async () => {
              if (!email.trim()) { setErr('כתבו קודם את האימייל.'); return; }
              try { await sendReset(email); setInfo('אם החשבון קיים, נשלח אליו קישור לאיפוס סיסמה.'); setErr(''); } catch (x) { setErr(authErrorHe(x)); }
            }}>שכחתי סיסמה</button>
        )}
      </form>
    </div>
  );
};

const RequestCard: React.FC<{ r: RideRequest; dup: boolean; moved?: boolean; onStatus: (s: RequestStatus) => Promise<void> }> = ({ r, dup, moved, onStatus }) => {
  const [pending, setPending] = useState<RequestStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const wa = customerWhatsApp(r);
  const waNum = toWhatsAppNumber(r.phone);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const apply = async (s: RequestStatus) => {
    setBusy(true); setErr('');
    try { await onStatus(s); } catch { setErr('העדכון לא נשמר. בדקו את החיבור ונסו שוב.'); } finally { setBusy(false); setPending(null); }
  };
  const choose = (s: RequestStatus) => (s === 'confirmed' || s === 'cancelled' ? setPending(s) : apply(s));

  return (
    <li className={`bg-white rounded-2xl border shadow-sm p-4 md:p-5 ${moved ? 'border-gray-400 border-dashed' : 'border-gray-200'}`}>
      {moved && <p className="mb-2 text-xs font-bold text-gray-600">הסטטוס עודכן – הכרטיס יעבור לתצוגה המתאימה כשתחליפו תצוגה.</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold border rounded-full px-3 py-1 ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL_HE[r.status]}</span>
          <span className="ltr-num text-sm text-gray-500 font-semibold">{r.code}</span>
          {r.source && r.source !== 'website' && <span className="text-xs font-bold text-purple-900 bg-purple-100 rounded-full px-2 py-1">{SOURCE_LABEL_HE[r.source]}</span>}
          {dup && <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-800 bg-orange-100 rounded-full px-2 py-1"><AlertTriangle size={14} />ייתכן שכפול</span>}
          {(r.status === 'new' || r.status === 'in_progress') && rideMs(r) < Date.now() && <span className="text-xs font-bold text-red-800 bg-red-100 rounded-full px-2 py-1">מועד הנסיעה עבר</span>}
        </div>
        <span className="text-xs text-gray-500">התקבלה {fmtAgo(r.createdAt)}</span>
      </div>

      <div className="mt-3 grid gap-1.5 text-gray-900">
        <p className="flex items-center gap-2 text-xl font-black"><Clock size={20} className="text-gray-500 shrink-0" /><span>{fmtRide(r)}</span></p>
        <p className="text-lg font-bold">{r.name}</p>
        <p className="flex items-start gap-2"><MapPin size={16} className="text-gray-500 shrink-0 mt-1" /><span>{r.from} <span className="text-gray-400">←</span> {r.to}</span></p>
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1"><Users size={16} className="text-gray-500" />{r.passengers} נוסעים</span>
          {r.wheelchair
            ? <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5"><Accessibility size={16} />כיסא גלגלים ×{r.wheelchairCount}</span>
            : <span className="text-gray-500">ללא כיסא גלגלים</span>}
        </p>
        {r.notes && <p className="text-sm bg-gray-50 rounded-lg px-3 py-2">{r.notes}</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} className="flex flex-col items-center justify-center min-h-[56px] rounded-xl bg-gray-900 text-white font-bold" aria-label={`חיוג ל${r.name}, ${r.phone}`}>
          <span className="inline-flex items-center gap-2"><PhoneCall size={18} />חיוג</span>
          <span className="ltr-num text-xs font-semibold opacity-80">{r.phone}</span>
        </a>
        {wa
          ? <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 min-h-[56px] rounded-xl border-2 border-green-600 text-green-800 font-bold"><MessageCircle size={18} />וואטסאפ ללקוח</a>
          : <span className="flex items-center justify-center min-h-[56px] rounded-xl border border-gray-200 text-xs text-gray-500 text-center px-2">אין וואטסאפ למספר הזה</span>}
      </div>

      <div className="mt-4 rounded-xl border border-green-200 bg-green-50/60 p-3">
        {r.status === 'confirmed' ? (
          waNum ? (
            <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(confirmationText(r))}`} target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 min-h-[56px] px-4 rounded-xl bg-green-700 text-white font-black text-lg">
              <MessageCircle size={20} /> שליחת אישור בוואטסאפ
            </a>
          ) : <p className="text-sm text-gray-700">מספר הטלפון לא בפורמט ישראלי – אי אפשר לפתוח וואטסאפ אוטומטית.</p>
        ) : (
          <p className="text-sm text-gray-700"><b>שליחת אישור בוואטסאפ</b> תופיע כאן אחרי סימון הבקשה כ״אושרה״.</p>
        )}
        <p className="mt-2 text-xs text-gray-600">
          הכפתור רק פותח את וואטסאפ עם הודעה מוכנה {r.lang !== 'he' && <>(בשפת הלקוח)</>} – ההודעה נשלחת רק אם לוחצים ״שליחה״ בוואטסאפ, והמערכת לא מסמנת שהיא נשלחה.
        </p>
        {r.trackToken ? (
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(trackUrl(r.trackToken!, r.lang)); setCopied(true); setTimeout(() => setCopied(false), 3000); } catch { setErr('לא ניתן להעתיק את הקישור בדפדפן הזה.'); } }}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-gray-800 underline">
            <Copy size={14} /> {copied ? 'הקישור הועתק' : 'העתקת קישור המעקב של הלקוח'}
          </button>
        ) : <p className="mt-2 text-xs text-gray-500">לבקשה זו אין קישור מעקב (נשלחה לפני שנוסף המעקב).</p>}
      </div>

      {err && <p className="mt-3 text-sm text-red-700" role="alert">{err}</p>}
      <fieldset className="mt-4" disabled={busy}>
        <legend className="text-xs font-bold text-gray-500 mb-2">עדכון סטטוס</legend>
        <p className="mb-2 text-xs text-gray-700 flex gap-1.5 items-start"><Info size={14} className="shrink-0 mt-0.5" />
          <span>שינוי סטטוס מעדכן את דף המעקב של הלקוח, אבל <b>לא שולח לו הודעה</b>. כדי שהלקוח ידע – שלחו לו בעצמכם.</span></p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s} type="button" onClick={() => choose(s)} aria-pressed={r.status === s}
              className={`min-h-[44px] px-3 rounded-lg border text-sm font-bold ${r.status === s ? STATUS_STYLE[s] : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
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
  const [authState, setAuthState] = useState<AuthState>({ kind: 'loading' });
  const [items, setItems] = useState<RideRequest[] | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'received' | 'ride'>('received');
  const [view, setView] = useState<'todo' | 'upcoming' | 'all'>('todo');
  const [manualOpen, setManualOpen] = useState(false);
  // A card whose status was just changed stays in the current view (so the WhatsApp
  // confirmation button is right there) until Johnny switches view.
  const [keep, setKeep] = useState<Set<string>>(new Set());
  const switchView = (v: 'todo' | 'upcoming' | 'all') => { setView(v); setKeep(new Set()); };

  useEffect(() => {
    document.documentElement.lang = 'he'; document.documentElement.dir = 'rtl';
    document.title = 'ניהול בקשות | ג׳וני טקסי';
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    return () => { m.remove(); };
  }, []);

  useEffect(() => {
    let off = () => {};
    let alive = true;
    watchAdmin(setAuthState).then((u) => { if (alive) off = u; else u(); }).catch(() => setAuthState({ kind: 'signedOut' }));
    return () => { alive = false; off(); };
  }, []);

  const isAdmin = authState.kind === 'admin';
  const who = authState.kind === 'admin' ? authState.user.email : '';

  // live list: a request sent from any device appears here without refreshing
  useEffect(() => {
    if (!isAdmin) { setItems(null); return; }
    let off = () => {};
    let alive = true;
    getRequestStore().then((store) => {
      if (!alive) return;
      off = store.subscribe((list) => { setItems(list); setLoadErr(''); },
        () => setLoadErr('לא הצלחנו לטעון את הבקשות. בדקו את החיבור לאינטרנט, או שאין לחשבון הרשאה.'));
    }).catch(() => setLoadErr('לא הצלחנו להתחבר למערכת הבקשות.'));
    return () => { alive = false; off(); };
  }, [isAdmin]);

  const list = useMemo(() => items || [], [items]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    STATUSES.forEach((s) => (c[s] = list.filter((r) => r.status === s).length));
    return c;
  }, [list]);

  // same phone + same ride date/time from two different submissions → flag, Johnny decides
  const dupIds = useMemo(() => {
    const seen = new Map<string, string[]>();
    list.forEach((r) => { const k = `${r.phone.replace(/\D/g, '')}|${r.date}|${r.time}`; seen.set(k, [...(seen.get(k) || []), r.id]); });
    return new Set([...seen.values()].filter((v) => v.length > 1).flat());
  }, [list]);

  const shown = useMemo(() => {
    const s = q.trim();
    return list
      .filter((r) => filter === 'all' || r.status === filter)
      .filter((r) => !s || [r.name, r.phone, r.code, r.from, r.to].some((x) => x.includes(s)))
      .sort((a, b) => (sort === 'ride' ? `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`) : b.createdAt.localeCompare(a.createdAt)));
  }, [list, filter, q, sort]);

  // "To handle": new + in progress, soonest ride first. "Upcoming": confirmed rides from
  // 3 hours ago onwards, soonest first. Both grouped by ride day.
  const todo = useMemo(() => list.filter((r) => r.status === 'new' || r.status === 'in_progress' || keep.has(r.id)).sort((a, b) => rideMs(a) - rideMs(b)), [list, keep]);
  const upcoming = useMemo(() => {
    const from = Date.now() - 3 * 3600_000;
    return list.filter((r) => (r.status === 'confirmed' && rideMs(r) >= from) || keep.has(r.id)).sort((a, b) => rideMs(a) - rideMs(b));
  }, [list, keep]);

  const renderCards = (rows: RideRequest[], grouped: boolean) => {
    const out: React.ReactNode[] = [];
    let last = '';
    rows.forEach((r) => {
      const day = dayLabel(r);
      if (grouped && day !== last) {
        out.push(<li key={`h-${r.date}`} className="pt-2 text-sm font-black text-gray-700 sticky top-[68px] z-[1] bg-gray-100/95 py-1">{day}</li>);
        last = day;
      }
      out.push(
        <RequestCard key={r.id} r={r} dup={dupIds.has(r.id)}
          moved={keep.has(r.id) && ((view === 'todo' && r.status !== 'new' && r.status !== 'in_progress') || (view === 'upcoming' && r.status !== 'confirmed'))}
          onStatus={async (st) => { setKeep((k) => new Set(k).add(r.id)); const store = await getRequestStore(); await store.updateStatus(r, st, who); }} />,
      );
    });
    return <ul className="mt-4 grid gap-4">{out}</ul>;
  };

  if (authState.kind === 'loading') {
    return <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center" role="status">טוען…</div>;
  }
  if (authState.kind !== 'admin') return <Login notAllowed={authState.kind === 'notAllowed' ? authState.email : undefined} />;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#0b0f14] text-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-yellow-400 font-bold text-sm">ג׳וני טקסי</p>
            <h1 className="text-xl font-black whitespace-nowrap">בקשות</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setManualOpen(true)} className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-yellow-400 text-gray-900 font-black text-sm whitespace-nowrap">
              <Plus size={18} /> בקשה ידנית
            </button>
            {IS_DEMO && <button type="button" onClick={() => resetDemoData()} className="icon-btn" aria-label="איפוס נתוני ההדגמה" title="איפוס נתוני ההדגמה"><RotateCcw size={18} /></button>}
            <button type="button" onClick={() => signOutAdmin()} className="icon-btn" aria-label="יציאה" title="יציאה"><LogOut size={18} /></button>
          </div>
        </div>
        {IS_DEMO ? (
          <div className="bg-yellow-400 text-gray-900 text-sm font-semibold text-center px-4 py-1.5">
            הדגמה: נתונים פיקטיביים שנשמרים רק בדפדפן הזה. בקשה שנשמרת אינה אישור נסיעה.
          </div>
        ) : (
          <div className="bg-white/10 text-gray-200 text-xs text-center px-4 py-1">
            מחובר כ־<span dir="ltr">{who}</span> · בקשות אמיתיות · שינוי סטטוס לא שולח הודעה ללקוח
          </div>
        )}
      </header>

      <nav className="sticky top-0 z-[5] bg-gray-100 border-b border-gray-200" aria-label="תצוגות">
        <div className="max-w-4xl mx-auto px-4 py-2 grid grid-cols-3 gap-2">
          {([['todo', 'לטיפול', todo.length], ['upcoming', 'מאושרות קרובות', upcoming.length], ['all', 'כל הבקשות', list.length]] as const).map(([k, label, n]) => (
            <button key={k} type="button" aria-pressed={view === k} onClick={() => switchView(k)}
              className={`min-h-[52px] rounded-xl text-sm font-black leading-tight px-1 ${view === k ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 border border-gray-300'}`}>
              {label}<span className={`block text-xs font-bold ${k === 'todo' && n > 0 && view !== k ? 'text-red-700' : 'opacity-80'}`}>{n}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {loadErr && <p className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 p-3 text-sm" role="alert">{loadErr}</p>}
        {items === null && !loadErr && <p className="mt-10 text-center text-gray-500" role="status">טוען בקשות…</p>}

        {items !== null && view === 'todo' && (
          <section aria-label="בקשות לטיפול">
            <p className="text-sm text-gray-600">בקשות חדשות ובטיפול, לפי מועד הנסיעה – הקרובה ראשונה.</p>
            {todo.length === 0 ? <p className="mt-10 text-center text-gray-500">אין בקשות שממתינות לטיפול.</p> : renderCards(todo, true)}
          </section>
        )}
        {items !== null && view === 'upcoming' && (
          <section aria-label="נסיעות מאושרות קרובות">
            <p className="text-sm text-gray-600">נסיעות שאושרו, מהשעות האחרונות והלאה, לפי מועד הנסיעה.</p>
            {upcoming.length === 0 ? <p className="mt-10 text-center text-gray-500">אין נסיעות מאושרות קרובות.</p> : renderCards(upcoming, true)}
          </section>
        )}

        {items !== null && view === 'all' && (<>
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

        {shown.length === 0 ? <p className="mt-10 text-center text-gray-500">אין בקשות להצגה.</p> : renderCards(shown, false)}
        </>)}
      </main>
      {manualOpen && <ManualRequestForm by={who} onClose={() => setManualOpen(false)} confirmationText={confirmationText} />}
    </div>
  );
};

export default AdminApp;
