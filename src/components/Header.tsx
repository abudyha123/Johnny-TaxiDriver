import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Phone, MessageCircle } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const NAV = [
  { href: '#services', key: 'header.services' },
  { href: '#areas', key: 'header.areas' },
  { href: '#booking', key: 'header.bookNow' },
  { href: '#contact', key: 'header.contact' },
];

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled || isMenuOpen ? 'is-solid' : ''}`}>
      <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">
        <a href="#top" className="brand" aria-label={t('brand.name')}>
          <span className="brand-dot" aria-hidden="true" />
          <span>{t('brand.name')}</span>
        </a>

        <nav className="hidden lg:flex items-center gap-7" aria-label="main">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="nav-link">{t(n.key)}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher variant="dark" />
          <a href="tel:+972545928999" className="hdr-pill" aria-label={`${t('header.callNow')} 054-592-8999`}>
            <Phone size={18} aria-hidden="true" />
            <span className="ltr-num">054-592-8999</span>
          </a>
          <a href="#booking" className="btn-yellow btn-sm">{t('header.bookARide')}</a>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher variant="dark" />
          <a href="tel:+972545928999" className="icon-btn" aria-label={`${t('header.callNow')} 054-592-8999`}><Phone size={20} /></a>
          <button className="icon-btn" onClick={() => setIsMenuOpen((o) => !o)} aria-expanded={isMenuOpen} aria-controls="mobile-menu" aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div id="mobile-menu" className="md:hidden mobile-menu">
          <nav className="flex flex-col" aria-label="mobile">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setIsMenuOpen(false)} className="mobile-link">{t(n.key)}</a>
            ))}
          </nav>
          <div className="grid gap-3 mt-4">
            <a href="#booking" onClick={() => setIsMenuOpen(false)} className="btn-yellow w-full">{t('header.bookARide')}</a>
            <a href="tel:+972545928999" className="btn-outline w-full"><Phone size={18} />{t('header.callNow')}: <span className="ltr-num">054-592-8999</span></a>
            <a href="https://wa.me/972545928999" target="_blank" rel="noopener noreferrer" className="btn-outline btn-wa w-full"><MessageCircle size={18} />{t('header.whatsapp')}: <span className="ltr-num">054-592-8999</span></a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
