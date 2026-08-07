import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './ui/Button';
import { CalendarClock, Phone, MessageCircle, ShieldCheck } from 'lucide-react';

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative bg-gray-900 text-white pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Decorative floating glow blobs */}
      <div className="absolute top-10 -left-20 w-72 h-72 bg-yellow-500 rounded-full blur-3xl opacity-20 animate-float pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 animate-float-delayed pointer-events-none"></div>

      {/* Yellow diagonal accent */}
      <div className="absolute bottom-0 right-0 w-full h-24 bg-yellow-500 transform translate-y-12 -skew-y-3 z-0 opacity-90"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <div className="inline-block px-4 py-1 rounded-full bg-yellow-500 text-gray-900 font-semibold text-sm mb-6 animate-fadeIn">
              {t('hero.badge')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slideUp">
              {t('hero.headline1')} <br />
              <span className="text-gradient">{t('hero.headline2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl animate-slideUp animation-delay-100">
              {t('hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slideUp animation-delay-200">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  const bookingSection = document.getElementById('booking');
                  bookingSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center"
              >
                <CalendarClock size={20} className="me-2" />
                {t('hero.bookRide')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  window.location.href = 'tel:+972545928999';
                }}
                className="flex items-center justify-center !text-white !border-white hover:!bg-white/10"
              >
                <Phone size={20} className="me-2" />
                {t('hero.callNow')}
              </Button>
            </div>

            <a
              href="https://wa.me/972545928999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-green-400 hover:text-green-300 font-medium mt-6 animate-slideUp animation-delay-200"
            >
              <MessageCircle size={18} className="me-2" />
              {t('hero.whatsappCta')}
            </a>

            <div className="mt-8 flex items-center text-gray-200 animate-slideUp animation-delay-300">
              <div className="w-12 h-0.5 bg-yellow-500 me-4"></div>
              <p className="text-sm font-medium">{t('hero.approved')}</p>
            </div>
          </div>

          <div className="relative animate-fadeIn">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
              <img
                src="/images/vehicle-front.jpg"
                alt="Johnny Taxi - wheelchair accessible vehicle"
                className="w-full h-64 md:h-80 lg:h-[420px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 start-6 bg-white text-gray-900 rounded-xl shadow-xl px-5 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} className="text-gray-900" />
              </div>
              <p className="font-semibold text-sm leading-tight">{t('hero.approved')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
