import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      {i18n.language === 'en' ? 'עברית' : 'English'}
    </button>
  );
};

export default LanguageSwitcher;