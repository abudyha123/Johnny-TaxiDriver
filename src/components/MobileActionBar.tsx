import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, MessageCircle, CalendarClock } from 'lucide-react';

/** Call / WhatsApp / Book – always one tap away on phones (hidden while the booking form is on screen). */
const MobileActionBar: React.FC = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let formVisible = false;
    const form = document.getElementById('booking');
    const io = form ? new IntersectionObserver((e) => { formVisible = e[0].isIntersecting; update(); }, { threshold: 0.15 }) : null;
    if (form && io) io.observe(form);
    function update() { setShow(window.scrollY > window.innerHeight * 0.6 && !formVisible); }
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', update); io?.disconnect(); };
  }, []);

  return (
    <nav className={`mobile-bar md:hidden ${show ? 'is-shown' : ''}`} aria-label={t('header.bookARide')} aria-hidden={!show}>
      <a href="tel:+972545928999" className="btn-outline" tabIndex={show ? 0 : -1}><Phone size={18} aria-hidden="true" />{t('header.callNow')}</a>
      <a href="https://wa.me/972545928999" target="_blank" rel="noopener noreferrer" className="btn-outline btn-wa" tabIndex={show ? 0 : -1}><MessageCircle size={18} aria-hidden="true" />{t('header.whatsapp')}</a>
      <a href="#booking" className="btn-yellow" tabIndex={show ? 0 : -1}><CalendarClock size={18} aria-hidden="true" />{t('header.bookARide')}</a>
    </nav>
  );
};

export default MobileActionBar;
