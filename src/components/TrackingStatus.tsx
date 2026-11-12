import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock3, Loader2, WifiOff, XCircle, Flag, Hourglass } from 'lucide-react';
import { getRequestStore } from '../lib/requests/store';
import type { RequestStatus, TrackingState } from '../lib/requests/types';

export const LOCALE: Record<string, string> = { he: 'he-IL', ar: 'ar-IL', en: 'en-GB' };

export function fmtDateTime(iso: string, lang: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(LOCALE[lang] || 'he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STYLE: Record<RequestStatus, { cls: string; Icon: React.ElementType }> = {
  new: { cls: 'bg-yellow-50 border-yellow-300 text-yellow-900', Icon: Hourglass },
  in_progress: { cls: 'bg-blue-50 border-blue-300 text-blue-900', Icon: Clock3 },
  confirmed: { cls: 'bg-green-50 border-green-400 text-green-900', Icon: CheckCircle2 },
  cancelled: { cls: 'bg-gray-100 border-gray-300 text-gray-800', Icon: XCircle },
  completed: { cls: 'bg-slate-800 border-slate-800 text-white', Icon: Flag },
};

/** Live status of one request, read through its private tracking link. */
export function useTracking(token: string | null): TrackingState {
  const [state, setState] = useState<TrackingState>({ kind: 'loading' });
  useEffect(() => {
    if (!token) { setState({ kind: 'notFound' }); return; }
    let off = () => {};
    let alive = true;
    getRequestStore()
      .then((store) => { if (alive) off = store.watchTracking(token, (s) => alive && setState(s)); })
      .catch(() => alive && setState({ kind: 'offline' }));
    return () => { alive = false; off(); };
  }, [token]);
  return state;
}

const TrackingStatus: React.FC<{ state: TrackingState }> = ({ state }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  if (state.kind === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-600 py-4" role="status">
        <Loader2 className="animate-spin" size={18} aria-hidden="true" /> {t('track.loading')}
      </div>
    );
  }
  if (state.kind === 'offline') {
    return (
      <div className="rounded-xl border border-orange-300 bg-orange-50 text-orange-900 p-4 flex gap-3 items-start" role="alert">
        <WifiOff size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
        <p>{t('track.offline')}</p>
      </div>
    );
  }
  if (state.kind === 'notFound') {
    return (
      <div className="rounded-xl border border-gray-300 bg-gray-50 text-gray-800 p-4" role="alert">
        <p className="font-bold">{t('track.notFoundTitle')}</p>
        <p className="mt-1 text-sm">{t('track.notFoundDesc')}</p>
      </div>
    );
  }

  const { info } = state;
  const { cls, Icon } = STYLE[info.status] || STYLE.new;
  const stale = state.kind === 'stale';
  return (
    <div className="w-full text-start" aria-live="polite">
      <div className={`rounded-xl border-2 p-4 ${cls} ${stale ? 'opacity-70' : ''}`}>
        <p className="text-xs font-semibold opacity-80">{t('track.statusLabel')}</p>
        <p className="mt-1 flex items-center gap-2 text-xl font-black">
          <Icon size={24} aria-hidden="true" /> {t(`track.status.${info.status}`)}
        </p>
        <p className="mt-2 text-sm">{t(`track.hint.${info.status}`)}</p>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-gray-700">
        <dt className="font-semibold">{t('track.code')}</dt>
        <dd className="ltr-num font-bold text-gray-900">{info.code}</dd>
        <dt className="font-semibold">{t('track.updated')}</dt>
        <dd className="ltr-num">{fmtDateTime(info.updatedAt, lang)}</dd>
      </dl>
      {stale ? (
        <p className="mt-3 text-sm rounded-lg border border-orange-300 bg-orange-50 text-orange-900 px-3 py-2 flex gap-2 items-start" role="alert">
          <WifiOff size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
          {t('track.stale', { time: state.verifiedAt ? fmtDateTime(state.verifiedAt, lang) : '—' })}
        </p>
      ) : (
        <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
          {t('track.live', { time: fmtDateTime(state.verifiedAt, lang) })}
        </p>
      )}
    </div>
  );
};

export default TrackingStatus;
