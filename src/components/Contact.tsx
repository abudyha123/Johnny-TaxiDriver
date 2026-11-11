import React from 'react';
import Section from './ui/Section';
import { Phone, MapPin, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Contact: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Section id="contact" background="white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('header.contact')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('contact.available')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 card-hover">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center me-3">
                <Phone className="text-blue-600" size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('header.callNow')}</h3>
                <p className="text-gray-600">{t('contact.available')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="tel:0545928999"
                className="block text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {t('contact.phone')}
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 card-hover">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center me-3">
                <MessageCircle className="text-green-600" size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('contact.whatsappTitle')}</h3>
                <p className="text-gray-600">{t('contact.available')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="https://wa.me/972545928999"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-lg font-medium text-green-600 hover:text-green-800 transition-colors"
              >
                {t('contact.chatWithUs')}
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 card-hover">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center me-3">
                <MapPin className="text-blue-600" size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('contact.location')}</h3>
                <p className="text-gray-600">{t('contact.name')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Contact;
