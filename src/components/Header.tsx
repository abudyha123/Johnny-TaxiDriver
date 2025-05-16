import React, { useState, useEffect } from 'react';
import { Menu, X, GripHorizontal, Phone } from 'lucide-react';
import Button from './ui/Button';

const Header: React.FC = () => {
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

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <GripHorizontal className="text-yellow-500 mr-2" size={28} />
            <span className="font-bold text-xl md:text-2xl text-gray-900">AccessiTaxi</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-gray-800 hover:text-yellow-500 font-medium transition-colors">Services</a>
            <a href="#areas" className="text-gray-800 hover:text-yellow-500 font-medium transition-colors">Service Areas</a>
            <a href="#testimonials" className="text-gray-800 hover:text-yellow-500 font-medium transition-colors">Testimonials</a>
            <a href="#booking" className="text-gray-800 hover:text-yellow-500 font-medium transition-colors">Book Now</a>
            <a href="#contact" className="text-gray-800 hover:text-yellow-500 font-medium transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center">
            <a href="tel:+9721234567" className="flex items-center mr-4 text-blue-600 hover:text-blue-800 font-medium">
              <Phone size={18} className="mr-1" />
              <span>Call Now</span>
            </a>
            <Button 
              variant="primary" 
              size="md"
              onClick={() => {
                const bookingSection = document.getElementById('booking');
                bookingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Book a Ride
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-800 hover:text-yellow-500 transition-colors"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
                Services
              </a>
              <a 
                href="#areas" 
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Service Areas
              </a>
              <a 
                href="#testimonials" 
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </a>
              <a 
                href="#booking" 
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Book Now
              </a>
              <a 
                href="#contact" 
                className="text-gray-800 hover:text-yellow-500 font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
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
                Book a Ride
              </Button>
              <a 
                href="tel:+9721234567" 
                className="flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium py-2"
              >
                <Phone size={18} className="mr-1" />
                <span>Call Now: +972-123-4567</span>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;