import React from 'react';
import Button from './ui/Button';
import { Phone, Clock } from 'lucide-react';

const EmergencyCallout: React.FC = () => {
  return (
    <div className="bg-blue-600 text-white py-10 relative overflow-hidden">
      {/* Yellow diagonal element */}
      <div className="absolute left-0 top-0 w-full h-24 bg-yellow-500 transform -translate-y-12 skew-y-3 z-0 opacity-80"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 shadow-md">
                  <Phone className="text-blue-600" size={24} />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold">Need Emergency Transport?</h3>
              </div>
              <p className="text-blue-100 mt-2 md:text-lg pl-16">
                Our accessible taxis are available 24/7 for urgent medical appointments or emergencies.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="primary"
                size="lg"
                onClick={() => {
                  window.location.href = 'tel:+9721234567';
                }}
                className="flex items-center justify-center"
              >
                <Phone size={20} className="mr-2" />
                Call Emergency Line
              </Button>
              <div className="hidden md:flex items-center text-blue-100">
                <Clock size={20} className="mr-2 text-yellow-400" />
                <span>24/7 Availability</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCallout;