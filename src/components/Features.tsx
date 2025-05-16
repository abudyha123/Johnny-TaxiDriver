import React from 'react';
import Section from './ui/Section';
import { FEATURES, ICON_COMPONENTS } from '../constants';

const Features: React.FC = () => {
  return (
    <Section id="services" background="white" className="features-section">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Specialized Services</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We provide comprehensive accessible transportation solutions designed for comfort, safety, and independence.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        {FEATURES.map((feature) => {
          const IconComponent = ICON_COMPONENTS[feature.icon as keyof typeof ICON_COMPONENTS];
          
          return (
            <div 
              key={feature.id} 
              className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                {IconComponent && <IconComponent className="text-yellow-600" size={24} />}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-16 max-w-4xl mx-auto bg-blue-50 rounded-xl p-6 md:p-8 border border-blue-100">
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-6 md:mb-0 md:mr-8">
            <img 
              src="https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="Accessible taxi with ramp" 
              className="w-full md:w-64 h-48 object-cover rounded-lg shadow-md"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Vehicles</h3>
            <p className="text-gray-700 mb-4">
              Our fleet features specially modified vehicles with:
            </p>
            <ul className="text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">✓</span>
                Hydraulic wheelchair ramps and lifts
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">✓</span>
                Secure wheelchair locking systems
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">✓</span>
                Extra spacious interiors with climate control
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">✓</span>
                Safety equipment exceeding regulatory standards
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Features;