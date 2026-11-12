import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Phone } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TrackingStatus, { useTracking } from '../components/TrackingStatus';
import TrackLinkActions from '../components/TrackLinkActions';
import { REQUESTS_MODE } from '../lib/requests/store';

/**
 * Public tracking page: /track?l=he#<token>
 * The token lives in the #fragment, so it never reaches a server log or a Referer header.
 * Only minimal status data is shown; the page is excluded from search engines.
 */
const TrackPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const token = useMemo(() => {
    const raw = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    return /^[A-Za-z0-9_-]{20,64}$/.test(raw) ? raw : null;
  }, []);
  const state = useTracking(token);

  useEffect(() => {
    const l = new URLSearchParams(window.location.search).get('l');
    if (l && ['he', 'en', 'ar'].includes(l) && l !== i18n.language) i18n.changeLanguage(l);
    const metas = [['robots', 'noindex, nofollow'], ['referrer', 'no-referrer']].map(([name, content]) => {
      const m = document.createElement('meta'); m.name = name; m.content = content; document.head.appendChild(m); return m;
    });
    return () => metas.forEach((m) => m.remove());
  }, [i18n]);

  useEffect(() => { document.title = `${t('track.title')} | ${t('brand.name')}`; }, [t, i18n.language]);

  // keep the language in the address so a refresh or a copied link opens in the same language
  useEffect(() => {
    const u = new URL(window.location.href);
    if (u.searchParams.get('l') !== i18n.language) { u.searchParams.set('l', i18n.language); history.replaceState(null, '', u.toString()); }
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-[#0b0f14] text-white">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <a href="/" className="font-black text-lg"><span className="text-yellow-400">●</span> {t('brand.name')}</a>
          <LanguageSwitcher variant="dark" />
        </div>
      </header>
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-black text-gray-900 mb-4">{t('track.title')}</h1>
        {REQUESTS_MODE === 'demo' && (
          <p className="mb-4 text-sm font-semibold text-orange-900 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">{t('track.demoNote')}</p>
        )}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <TrackingStatus state={state} />
          {(state.kind === 'live' || state.kind === 'stale') && (
            <p className="mt-4 text-xs text-gray-600">{t('track.validUntil', { date: new Date(state.info.expiresAt).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : `${i18n.language}-IL`) })}</p>
          )}
        </section>
        {(state.kind === 'live' || state.kind === 'stale') && (
          <section className="mt-4 bg-white rounded-2xl border border-gray-200 p-5">
            <TrackLinkActions url={window.location.href} showOpen={false} />
          </section>
        )}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <a href="tel:+972545928999" className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-white border border-gray-300 font-bold text-gray-900">
            <Phone size={18} aria-hidden="true" /> {t('track.call')}
          </a>
          <a href="https://wa.me/972545928999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-green-600 text-white font-bold">
            <MessageCircle size={18} aria-hidden="true" /> {t('track.whatsapp')}
          </a>
        </section>
      </main>
    </div>
  );
};

export default TrackPage;
