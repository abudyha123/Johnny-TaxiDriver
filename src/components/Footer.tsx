import React from 'react';
import { GripHorizontal, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <GripHorizontal className="text-yellow-500 mr-2" size={24} />
                <span className="font-bold text-xl">AccessiTaxi</span>
              </div>
              <p className="text-gray-400 mb-4">
                Professional accessible taxi service providing reliable and comfortable transportation across Israel.
              </p>
              <p className="text-gray-400 text-sm">
                Israeli Ministry of Transportation License #12345
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#services" className="text-gray-400 hover:text-white transition-colors">Services</a>
                </li>
                <li>
                  <a href="#areas" className="text-gray-400 hover:text-white transition-colors">Service Areas</a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</a>
                </li>
                <li>
                  <a href="#booking" className="text-gray-400 hover:text-white transition-colors">Book a Ride</a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">
                  <span className="block">123 Rothschild Boulevard</span>
                  <span className="block">Tel Aviv, Israel</span>
                </li>
                <li>
                  <a href="tel:+9721234567" className="text-gray-400 hover:text-white transition-colors">+972-123-4567</a>
                </li>
                <li>
                  <a href="mailto:info@accessitaxi.co.il" className="text-gray-400 hover:text-white transition-colors">info@accessitaxi.co.il</a>
                </li>
              </ul>
            </div>
            
            <div className="md:col-span-3 lg:col-span-1">
              <h4 className="text-lg font-medium mb-4">Subscribe for Updates</h4>
              <p className="text-gray-400 mb-4">Get notified about new services and special offers.</p>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="px-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                />
                <button 
                  type="submit" 
                  className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-r-md font-medium transition-colors text-gray-900"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="pt-8 mt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} AccessiTaxi. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Accessibility</a>
            </div>
          </div>
          
          <div className="text-center text-gray-500 text-xs mt-8 flex items-center justify-center">
            <span>Made with</span>
            <Heart size={12} className="mx-1 text-red-500" />
            <span>for accessible transportation in Israel</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;