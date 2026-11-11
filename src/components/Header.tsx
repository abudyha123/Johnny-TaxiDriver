import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, GripHorizontal, Phone, MessageCircle } from 'lucide-react';
import Button from './ui/Button';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinkClass =
    "relative text-gray-800 hover:text-yellow-500 font-medium transition-colors after:content-[''] after:absolute after:start-0 after:-bottom-1 after:w-0 after:h-0.5 after:bg-yellow-500 after:transition-all after:duration-300 hover:after:w-full";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center group cursor-pointer">
            <GripHorizontal
              className="text-yellow-500 me-2 transition-transform duration-500 group-hover:rotate-180"
              size={28}
            />
            <span className="font-bold text-xl md:text-2xl text-gray-900">
              Accessi<span className="text-gradient">Taxi</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#services" className={navLinkClass}>{t('header.services')}</a>
            <a href="#areas" className={navLinkClass}>{t('header.areas')}</a>
            <a href="#testimonials" className={navLinkClass}>{t('header.testimonials')}</a>
            <a href="#booking" className={navLinkClass}>{t('header.bookNow')}</a>
            <a href="#contact" className={navLinkClass}>{t('header.contact')}</a>
          </nav>

          <div className="hidden md:flex items-center">
            <a href="tel:+972545928999" className="flex items-center me-3 text-blue-600 hover:text-blue-800 font-medium transition-transform hover:scale-105">
              <Phone size={18} className="me-1" />
              <span>{t('header.callNow')}</span>
            </a>
            <a
              href="https://wa.me/972545928999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center me-4 text-green-600 hover:text-green-700 font-medium transition-transform hover:scale-105"
            >
              <MessageCircle size={18} className="me-1" />
              <span>{t('header.whatsapp')}</span>
            </a>
            <LanguageSwitcher className="me-4" />
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const bookingSection = document.getElementById('booking');
                bookingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('header.bookARide')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              className="text-gray-800 hover:text-yellow-500 transition-colors"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white shadow-lg border-t border-gray-100 py-4 px-4 animate-fadeIn">
            <nav className="flex flex-col space-y-3">
              <a
                href="#services"
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('header.services')}
              </a>
              <a
                href="#areas"
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('header.areas')}
              </a>
              <a
                href="#testimonials"
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('header.testimonials')}
              </a>
              <a
                href="#booking"
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('header.bookNow')}
              </a>
              <a
                href="#contact"
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('header.contact')}
              </a>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  setIsMenuOpen(false);
                  const bookingSection = document.getElementById('booking');
                  bookingSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('header.bookARide')}
              </Button>
              <a
                href="tel:+972545928999"
                className="flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium py-2"
              >
                <Phone size={18} className="me-1" />
                <span>{t('header.callNow')}: 054-592-8999</span>
              </a>
              <a
                href="https://wa.me/972545928999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-green-600 hover:text-green-700 font-medium py-2"
              >
                <MessageCircle size={18} className="me-1" />
                <span>{t('header.whatsapp')}: 054-592-8999</span>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
