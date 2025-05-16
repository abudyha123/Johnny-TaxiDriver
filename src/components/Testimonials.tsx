import React from 'react';
import Section from './ui/Section';
import { TESTIMONIALS } from '../constants';
import Rating from './ui/Rating';
import { Quote } from 'lucide-react';

const Testimonials: React.FC = () => {
  return (
    <Section id="testimonials" background="white">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Real experiences from people who rely on our accessible taxi service throughout Israel.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {TESTIMONIALS.map((testimonial) => (
          <div 
            key={testimonial.id} 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-start mb-4">
              <Quote className="text-yellow-400 mr-3 flex-shrink-0" size={24} />
              <p className="text-gray-700 italic">{testimonial.content}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
              </div>
              <Rating value={testimonial.rating} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <a 
          href="#booking" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          onClick={(e) => {
            e.preventDefault();
            const bookingSection = document.getElementById('booking');
            bookingSection?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>Experience our service yourself</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </Section>
  );
};

export default Testimonials;