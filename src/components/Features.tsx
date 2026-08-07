import React from 'react';
import { useTranslation } from 'react-i18next';
import Section from './ui/Section';
import { Accessibility, Clock, MapPin, CreditCard, Phone, Shield } from 'lucide-react';

const FEATURE_ICONS = [Accessibility, Clock, MapPin, CreditCard, Phone, Shield];

type FeatureItem = { title: string; description: string };

const Features: React.FC = () => {
  const { t } = useTranslation();
  const items = t('features.items', { returnObjects: true }) as FeatureItem[];
  const vehicleFeatures = t('features.vehicleFeatures', { returnObjects: true }) as string[];

  return (
    <Section id="services" background="white" className="features-section">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('features.sectionTitle')}</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('features.sectionSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        {items.map((feature, index) => {
          const IconComponent = FEATURE_ICONS[index];

          return (
            <div
              key={index}
              className="group relative bg-white p-6 rounded-lg shadow-md border border-gray-100 card-hover overflow-hidden"
            >
              <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
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
          <div className="mb-6 md:mb-0 md:me-8 overflow-hidden rounded-lg shadow-md">
            <img
              src="/images/vehicle-ramp.jpg"
              alt="Johnny Taxi - accessible vehicle with manual wheelchair ramp"
              className="w-full md:w-64 h-48 object-cover transition-transform duration-500 hover:scale-110"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('features.vehicleTitle')}</h3>
            <p className="text-gray-700 mb-4">
              {t('features.vehicleIntro')}
            </p>
            <ul className="text-gray-700 space-y-2">
              {vehicleFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 me-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Features;
