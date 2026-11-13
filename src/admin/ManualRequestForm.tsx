import React, { useRef, useState } from 'react';
import { X, MessageCircle, Copy, Check } from 'lucide-react';
import { getRequestStore } from '../lib/requests/store';
import { newRequestId, shortCode, trackUrl, toWhatsAppNumber, type ManualRideRequest, type RideRequest } from '../lib/requests/types';

/**
 * Johnny's manual entry for a request received by phone or WhatsApp (admin screen only).
 * Same request structure, same statuses, same tracking link as a website request;
 * marked with its source. Nothing is sent to the customer automatically.
 */
type Props = { by: string; onClose: () => void; confirmationText: (r: RideRequest) => string };

const empty = {
  source: 'phone' as 'phone' | 'whatsapp', status: 'new' as 'new' | 'in_progress' | 'confirmed',
  name: '', phone: '', from: '', to: '', date: '', time: '', passengers: '1',
  wheelchair: '' as '' | 'yes' | 'no', wheelchairCount: '1', notes: '', lang: 'he',
};

const field = 'w-full rounded-xl border border-gray-300 px-3 py-3 text-base bg-white';
const lbl = 'block text-sm font-bold text-gray-800 mb-1';

const ManualRequestForm: React.FC<Props> = ({ by, onClose, confirmationText }) => {
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [saved, setSaved] = useState<RideRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const idRef = useRef(newRequestId()); // one id per entry – a retry can't create a duplicate
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'חובה';
    if (!/^[0-9 +()-]{7,20}$/.test(f.phone.trim()) || f.phone.replace(/\D/g, '').length < 7) e.phone = 'מספר טלפון לא תקין';
    if (f.from.trim().length < 2) e.from = 'חובה';
    if (f.to.trim().length < 2) e.to = 'חובה';
    if (!f.date) e.date = 'חובה';
    if (!f.time) e.time = 'חובה';
    if (!f.wheelchair) e.wheelchair = 'יש לבחור';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy || saved || !validate()) return;
    setBusy(true); setSaveErr('');
    const req: ManualRideRequest = {
      id: idRef.current, code: shortCode(idRef.current),
      name: f.name.trim(), phone: f.phone.trim(), from: f.from.trim(), to: f.to.trim(),
      date: f.date, time: f.time, passengers: Number(f.passengers),
      wheelchair: f.wheelchair === 'yes', wheelchairCount: f.wheelchair === 'yes' ? Number(f.wheelchairCount) : 0,
      notes: f.notes.trim() || undefined, lang: f.lang, source: f.source, status: f.status,
    };
    try {
      const store = await getRequestStore();
      const { trackToken } = await store.createManual(req, by);
      const now = new Date().toISOString();
      setSaved({ ...req, createdAt: now, history: [], trackToken });
    } catch {
      setSaveErr('הבקשה לא נשמרה. בדקו את החיבור ונסו שוב (לא תיווצר כפילות).');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="manual-title">
      <div className="bg-gray-50 w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto sm:rounded-2xl">
        <div className="sticky top-0 z-10 bg-[#0b0f14] text-white px-4 py-3 flex items-center justify-between">
          <h2 id="manual-title" className="text-lg font-black">בקשה ידנית</h2>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="סגירה"><X size={20} /></button>
        </div>

        {saved ? (
          <div className="p-4 space-y-4" role="status">
            <p className="text-xl font-black text-gray-900">הבקשה נשמרה – <span className="ltr-num">{saved.code}</span></p>
            <p className="text-sm text-gray-700">היא מופיעה ברשימה עם סימון ״{saved.source === 'phone' ? 'טלפון' : 'וואטסאפ'}״. לא נשלחה שום הודעה ללקוח.</p>
            {saved.trackToken && (
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="text-sm font-bold mb-2">קישור המעקב של הלקוח</p>
                <input readOnly dir="ltr" value={trackUrl(saved.trackToken, saved.lang)} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-md border border-gray-300 bg-gray-50 px-2 py-2 text-xs" />
                <button type="button" className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-gray-300 font-bold text-sm"
                  onClick={async () => { try { await navigator.clipboard.writeText(trackUrl(saved.trackToken!, saved.lang)); setCopied(true); } catch { /* select manually */ } }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'הועתק' : 'העתקת הקישור'}
                </button>
              </div>
            )}
            {saved.status === 'confirmed' && toWhatsAppNumber(saved.phone) && (
              <div>
                <a href={`https://wa.me/${toWhatsAppNumber(saved.phone)}?text=${encodeURIComponent(confirmationText(saved))}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-green-700 text-white font-black">
                  <MessageCircle size={20} /> שליחת אישור בוואטסאפ
                </a>
                <p className="mt-1 text-xs text-gray-600">פותח את וואטסאפ עם הודעה מוכנה. ההודעה נשלחת רק אם לוחצים ״שליחה״ בוואטסאפ.</p>
              </div>
            )}
            <button type="button" onClick={onClose} className="btn-yellow w-full">סגירה</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="p-4 space-y-4">
            <fieldset>
              <legend className={lbl}>מקור הפנייה</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['phone', 'whatsapp'] as const).map((s) => (
                  <label key={s} className={`min-h-[48px] rounded-xl border-2 flex items-center justify-center gap-2 font-bold cursor-pointer ${f.source === s ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white'}`}>
                    <input type="radio" name="source" value={s} checked={f.source === s} onChange={set('source')} className="sr-only" />
                    {s === 'phone' ? 'שיחת טלפון' : 'וואטסאפ'}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label className={lbl} htmlFor="m-name">שם הלקוח</label>
              <input id="m-name" className={field} value={f.name} onChange={set('name')} autoComplete="off" aria-invalid={!!errors.name} />
              {errors.name && <p className="text-sm text-red-700 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className={lbl} htmlFor="m-phone">טלפון</label>
              <input id="m-phone" type="tel" dir="ltr" inputMode="tel" className={field} value={f.phone} onChange={set('phone')} aria-invalid={!!errors.phone} />
              {errors.phone && <p className="text-sm text-red-700 mt-1">{errors.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl} htmlFor="m-date">תאריך</label>
                <input id="m-date" type="date" className={field} value={f.date} onChange={set('date')} aria-invalid={!!errors.date} />
                {errors.date && <p className="text-sm text-red-700 mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className={lbl} htmlFor="m-time">שעה</label>
                <input id="m-time" type="time" className={field} value={f.time} onChange={set('time')} aria-invalid={!!errors.time} />
                {errors.time && <p className="text-sm text-red-700 mt-1">{errors.time}</p>}
              </div>
            </div>
            <div>
              <label className={lbl} htmlFor="m-from">מוצא</label>
              <input id="m-from" className={field} value={f.from} onChange={set('from')} aria-invalid={!!errors.from} />
              {errors.from && <p className="text-sm text-red-700 mt-1">{errors.from}</p>}
            </div>
            <div>
              <label className={lbl} htmlFor="m-to">יעד</label>
              <input id="m-to" className={field} value={f.to} onChange={set('to')} aria-invalid={!!errors.to} />
              {errors.to && <p className="text-sm text-red-700 mt-1">{errors.to}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl} htmlFor="m-pass">נוסעים</label>
                <select id="m-pass" className={field} value={f.passengers} onChange={set('passengers')}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl} htmlFor="m-lang">שפת הלקוח</label>
                <select id="m-lang" className={field} value={f.lang} onChange={set('lang')}>
                  <option value="he">עברית</option><option value="ar">ערבית</option><option value="en">אנגלית</option>
                </select>
              </div>
            </div>
            <fieldset>
              <legend className={lbl}>כיסא גלגלים</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['yes', 'no'] as const).map((v) => (
                  <label key={v} className={`min-h-[48px] rounded-xl border-2 flex items-center justify-center font-bold cursor-pointer ${f.wheelchair === v ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white'}`}>
                    <input type="radio" name="wheelchair" value={v} checked={f.wheelchair === v} onChange={set('wheelchair')} className="sr-only" />
                    {v === 'yes' ? 'כן' : 'לא'}
                  </label>
                ))}
              </div>
              {errors.wheelchair && <p className="text-sm text-red-700 mt-1">{errors.wheelchair}</p>}
              {f.wheelchair === 'yes' && (
                <label className="mt-2 flex items-center gap-2 text-sm font-bold">כמה כיסאות
                  <select className="rounded-lg border border-gray-300 px-3 py-2" value={f.wheelchairCount} onChange={set('wheelchairCount')}>
                    {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              )}
            </fieldset>
            <div>
              <label className={lbl} htmlFor="m-notes">הערות (רשות)</label>
              <textarea id="m-notes" rows={2} className={field} value={f.notes} onChange={set('notes')} maxLength={1000} />
            </div>
            <fieldset>
              <legend className={lbl}>סטטוס התחלתי</legend>
              <select className={field} value={f.status} onChange={set('status')} aria-label="סטטוס התחלתי">
                <option value="new">חדשה – עוד לא אושרה</option>
                <option value="in_progress">בטיפול</option>
                <option value="confirmed">אושרה – כבר סיכמתי עם הלקוח</option>
              </select>
            </fieldset>
            <p className="text-xs text-gray-600">השמירה לא שולחת הודעה ללקוח. אחרי השמירה יופיעו קישור המעקב ו(אם אושרה) כפתור שליחת אישור בוואטסאפ.</p>
            {saveErr && <p className="text-sm text-red-700" role="alert">{saveErr}</p>}
            <div className="sticky bottom-0 bg-gray-50 pt-2 pb-3">
              <button type="submit" className="btn-yellow w-full disabled:opacity-60" disabled={busy}>{busy ? 'שומרים…' : 'שמירת הבקשה'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManualRequestForm;
