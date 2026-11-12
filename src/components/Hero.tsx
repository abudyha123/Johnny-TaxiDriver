import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Phone, MessageCircle } from 'lucide-react';

const img = (w: number) => `${import.meta.env.BASE_URL}images/hero-taxi-${w}.webp`;

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="hero relative bg-[#0b0f14] text-white overflow-hidden" aria-labelledby="hero-title">
      <div className="container mx-auto px-4 md:px-6 hero-grid">
        <div className="hero-copy">
          <span className="tag-sign rise d1">{t('hero.badge')}</span>
          <h1 id="hero-title" className="font-display font-black leading-[1.03] tracking-tight mt-5 mb-4 text-[40px] sm:text-5xl lg:text-[4.4rem]">
            <span className="rise-word"><span>{t('hero.headline1')}</span></span>
            <br />
            <span className="rise-word"><span className="hero-hl">{t('hero.headline2')}</span></span>
          </h1>
          <p className="rise d3 text-slate-300 text-[17px] md:text-xl leading-relaxed max-w-[34rem] mb-6">{t('hero.description')}</p>
          <span className="road-dash rise d3" aria-hidden="true" />
          <div className="rise d4 flex flex-col sm:flex-row gap-3">
            <a href="#booking" className="btn-yellow">
              <CalendarClock size={20} aria-hidden="true" />
              {t('hero.bookRide')}
            </a>
            <a href="tel:+972545928999" className="btn-outline">
              <Phone size={20} aria-hidden="true" />
              {t('hero.callNow')}
              <span className="ltr-num text-[15px] opacity-80 font-semibold">054-592-8999</span>
            </a>
          </div>
          <a href="https://wa.me/972545928999" target="_blank" rel="noopener noreferrer" className="rise d5 wa-link mt-5">
            <span className="wa-ico" aria-hidden="true"><MessageCircle size={20} /></span>
            <span className="wa-text">{t('hero.whatsappCta')}</span>
          </a>
        </div>

        <figure className="hero-media">
          <picture>
            <source type="image/webp" srcSet={`${img(900)} 900w, ${img(1400)} 1400w, ${img(2400)} 2400w`} sizes="(min-width:1024px) 58vw, 100vw" />
            <img src={img(1400)} width={1400} height={781} fetchPriority="high" alt={t('hero.imageAlt')} />
          </picture>
        </figure>
      </div>
    </section>
  );
};

export default Hero;
