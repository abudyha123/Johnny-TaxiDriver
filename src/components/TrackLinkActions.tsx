import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, ExternalLink } from 'lucide-react';

/** "Track the request" + "copy personal link", with the link visible for manual copying. */
const TrackLinkActions: React.FC<{ url: string; showOpen?: boolean }> = ({ url, showOpen = true }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied('ok'); }
    catch { setCopied('fail'); }
    setTimeout(() => setCopied('idle'), 4000);
  };
  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-3">
        {showOpen && (
          <a href={url} className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-lg font-semibold">
            <ExternalLink size={18} aria-hidden="true" /> {t('track.open')}
          </a>
        )}
        <button type="button" onClick={copy} className="inline-flex items-center gap-2 border-2 border-gray-900 text-gray-900 px-5 py-3 rounded-lg font-semibold">
          {copied === 'ok' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copied === 'ok' ? t('track.copied') : t('track.copy')}
        </button>
      </div>
      <label className="block mt-3 text-xs text-gray-600">
        <span className="sr-only">{t('track.copy')}</span>
        <input readOnly value={url} dir="ltr" onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs text-gray-700" />
      </label>
      <p className="mt-1 text-xs text-gray-600" role={copied === 'fail' ? 'alert' : undefined}>
        {copied === 'fail' ? t('track.copyFailed') : t('track.linkNote')}
      </p>
    </div>
  );
};

export default TrackLinkActions;
