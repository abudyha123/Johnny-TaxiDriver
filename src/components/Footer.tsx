import React from 'react';
import { useTranslation } from 'react-i18next';
import { GripHorizontal, Heart, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="relative bg-gray-900 text-white">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <GripHorizontal className="text-yellow-500 me-2 transition-transform duration-500 hover:rotate-180" size={24} />
                <span className="font-bold text-xl">{t('footer.brand')}</span>
              </div>
              <p className="text-gray-400 mb-4">
                {t('footer.tagline')}
              </p>
              <p className="text-gray-400 text-sm">
                {t('footer.license')}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-4">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#services" className="text-gray-400 hover:text-white transition-colors">{t('header.services')}</a>
                </li>
                <li>
                  <a href="#areas" className="text-gray-400 hover:text-white transition-colors">{t('header.areas')}</a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">{t('header.testimonials')}</a>
                </li>
                <li>
                  <a href="#booking" className="text-gray-400 hover:text-white transition-colors">{t('header.bookARide')}</a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white transition-colors">{t('header.contact')}</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-4">{t('footer.contactTitle')}</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">
                  <span className="block">{t('contact.location')}</span>
                </li>
                <li>
                  <a href="tel:+972545928999" className="text-gray-400 hover:text-white transition-colors">{t('contact.phone')}</a>
                </li>
                <li>
                  <a
                    href="https://wa.me/972545928999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 transition-colors flex items-center"
                  >
                    <MessageCircle size={14} className="me-1" />
                    {t('header.whatsapp')}
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 lg:col-span-1">
              <h4 className="text-lg font-medium mb-4">{t('footer.subscribeTitle')}</h4>
              <p className="text-gray-400 mb-4">{t('footer.subscribeDesc')}</p>
              <form className="flex">
                <input
                  type="email"
                  placeholder={t('footer.emailPlaceholder')}
                  className="px-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-s-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-e-md font-medium transition-all duration-300 text-gray-900 hover:shadow-glow"
                >
                  {t('footer.subscribeButton')}
                </button>
              </form>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} {t('footer.brand')}. {t('footer.rights')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.privacy')}</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.terms')}</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.accessibility')}</a>
            </div>
          </div>

          <div className="text-center text-gray-500 text-xs mt-8 flex items-center justify-center">
            <span>{t('footer.madeWith')}</span>
            <Heart size={12} className="mx-1 text-red-500" />
            <span>{t('footer.madeFor')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
