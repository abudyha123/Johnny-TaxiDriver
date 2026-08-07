import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Section from './ui/Section';
import { MapPin } from 'lucide-react';

type AreaItem = {
  name: string;
  description: string;
  destinations: string[];
  trips: string[];
};

const ServiceAreas: React.FC = () => {
  const { t } = useTranslation();
  const areas = t('areas.items', { returnObjects: true }) as AreaItem[];
  const [activeArea, setActiveArea] = useState(0);
  const active = areas[activeArea] || areas[0];

  return (
    <Section id="areas" background="light">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('areas.sectionTitle')}</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('areas.sectionSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden card-hover">
            <div className="relative aspect-video">
              <img
                src="https://images.pexels.com/photos/1468937/pexels-photo-1468937.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Map of Northern Israel showing service areas"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
              <div className="absolute bottom-4 start-4 text-white">
                <div className="flex items-center">
                  <MapPin className="text-yellow-400 me-2" size={20} />
                  <span className="font-medium">{t('areas.mapLabel')}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {areas.map((area, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveArea(index)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeArea === index
                        ? 'bg-yellow-500 text-gray-900 shadow-glow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 md:p-8 card-hover">
          <div className="max-h-[400px] overflow-y-auto pe-2">
            {active && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="text-yellow-500 me-2" size={20} />
                  {active.name}
                </h3>
                <p className="text-gray-700 mb-6">{active.description}</p>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">{t('areas.popularDestinations')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {active.destinations.map((dest, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full me-2"></span>
                          {dest}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">{t('areas.commonTrips')}</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {active.trips.map((trip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 me-2">•</span>
                          {trip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default ServiceAreas;
