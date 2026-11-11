import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import he from './locales/he.json';
import ar from './locales/ar.json';

const RTL_LANGUAGES = ['he', 'ar'];

function applyDirection(lng: string) {
  const dir = RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
      ar: { translation: ar }
    },
    lng: 'he', // Hebrew is the default language
    fallbackLng: 'he',
    supportedLngs: ['en', 'he', 'ar'],
    interpolation: {
      escapeValue: false
    }
  });

// Apply initial direction/lang attribute
applyDirection(i18n.resolvedLanguage || i18n.language || 'he');

// Keep direction/lang attribute in sync whenever the language changes
i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
});

export default i18n;
