import React from 'react';
import Button from './ui/Button';
import { CalendarClock, Phone } from 'lucide-react';

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
      
      {/* Yellow diagonal accent */}
      <div className="absolute bottom-0 right-0 w-full h-24 bg-yellow-500 transform translate-y-12 -skew-y-3 z-0 opacity-90"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-block px-4 py-1 rounded-full bg-yellow-500 text-gray-900 font-semibold text-sm mb-6 animate-fadeIn">
            Accessible Transportation Across Israel
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slideUp">
            Mobility For Everyone, <br />
            <span className="text-yellow-400">Everywhere</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl animate-slideUp animation-delay-100">
            Professional wheelchair-accessible taxi service serving all major cities in Israel. 
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
                window.location.href = 'tel:+9721234567';
              }}
              className="flex items-center justify-center"
            >
              <Phone size={20} className="mr-2" />
              Call Now
            </Button>
          </div>
          
          <div className="mt-12 flex items-center text-gray-200 animate-slideUp animation-delay-300">
            <div className="w-12 h-0.5 bg-yellow-500 mr-4"></div>
            <p className="text-sm font-medium">Israeli Ministry of Transportation Approved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;