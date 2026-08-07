import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES: { code: 'en' | 'he' | 'ar'; labelKey: string }[] = [
  { code: 'he', labelKey: 'language.he' },
  { code: 'en', labelKey: 'language.en' },
  { code: 'ar', labelKey: 'language.ar' }
];

type LanguageSwitcherProps = {
  className?: string;
  variant?: 'light' | 'dark';
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '', variant = 'light' }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];
  const toggleClasses =
    variant === 'dark'
      ? 'text-white hover:text-yellow-400'
      : 'text-gray-800 hover:text-yellow-500';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1 font-medium transition-colors px-2 py-1 rounded-md ${toggleClasses}`}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <Globe size={18} />
        <span className="text-sm">{t(currentLang.labelKey)}</span>
      </button>
      {isOpen && (
        <div className="absolute end-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden z-50 animate-fadeIn">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-start px-4 py-2 text-sm hover:bg-yellow-50 transition-colors ${
                i18n.language === lang.code ? 'bg-yellow-100 font-semibold text-gray-900' : 'text-gray-700'
              }`}
            >
              {t(lang.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
