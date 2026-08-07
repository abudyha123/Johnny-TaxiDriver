import React from 'react';
import Button from './ui/Button';
import { CalendarClock, Phone, MessageCircle } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative bg-gray-900 text-white pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background overlay with taxi image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/2399254/pexels-photo-2399254.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)',
          backgroundPosition: '50% 30%'
        }}
      ></div>

      {/* Decorative floating glow blobs */}
      <div className="absolute top-10 -left-20 w-72 h-72 bg-yellow-500 rounded-full blur-3xl opacity-20 animate-float pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 animate-float-delayed pointer-events-none"></div>

      {/* Yellow diagonal accent */}
      <div className="absolute bottom-0 right-0 w-full h-24 bg-yellow-500 transform translate-y-12 -skew-y-3 z-0 opacity-90"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-block px-4 py-1 rounded-full bg-yellow-500 text-gray-900 font-semibold text-sm mb-6 animate-fadeIn">
            Accessible Transportation in Haifa & the North
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slideUp">
            Mobility For Everyone, <br />
            <span className="text-gradient">Everywhere</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl animate-slideUp animation-delay-100">
            Professional wheelchair-accessible taxi service serving Haifa, the entire North region, and transfers to and from Ben Gurion Airport.
            Available 24/7 for both scheduled appointments and emergency transportation.
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
              <CalendarClock size={20} className="mr-2" />
              Book Your Ride
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                window.location.href = 'tel:+972545928999';
              }}
              className="flex items-center justify-center !text-white !border-white hover:!bg-white/10"
            >
              <Phone size={20} className="mr-2" />
              Call Now
            </Button>
          </div>

          <a
            href="https://wa.me/972545928999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-green-400 hover:text-green-300 font-medium mt-6 animate-slideUp animation-delay-200"
          >
            <MessageCircle size={18} className="mr-2" />
            Chat with us on WhatsApp
          </a>

          <div className="mt-8 flex items-center text-gray-200 animate-slideUp animation-delay-300">
            <div className="w-12 h-0.5 bg-yellow-500 mr-4"></div>
            <p className="text-sm font-medium">Israeli Ministry of Transportation Approved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
