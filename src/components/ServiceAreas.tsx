import React, { useState } from 'react';
import Section from './ui/Section';
import { SERVICE_AREAS } from '../constants';
import { MapPin } from 'lucide-react';

const ServiceAreas: React.FC = () => {
  const [activeArea, setActiveArea] = useState(SERVICE_AREAS[0].id);

  return (
    <Section id="areas" background="light">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Areas We Serve</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Our accessible taxi service covers Haifa, the entire North region, and transfers to and from Ben Gurion Airport.
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
              <div className="absolute bottom-4 left-4 text-white">
                <div className="flex items-center">
                  <MapPin className="text-yellow-400 mr-2" size={20} />
                  <span className="font-medium">Haifa & Northern Israel Coverage</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICE_AREAS.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => setActiveArea(area.id)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeArea === area.id
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
          <div className="max-h-[400px] overflow-y-auto pr-2">
            {SERVICE_AREAS.filter(area => area.id === activeArea).map((area) => (
              <div key={area.id} className="animate-fadeIn">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="text-yellow-500 mr-2" size={20} />
                  {area.name}
                </h3>
                <p className="text-gray-700 mb-6">{area.description}</p>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Popular Destinations</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getAreaDestinations(area.name).map((dest, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          {dest}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Common Trips</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {getAreaTrips(area.name).map((trip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {trip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

// Helper functions to get area-specific content
function getAreaDestinations(areaName: string): string[] {
  const destinations: Record<string, string[]> = {
    'Ben Gurion Airport': ['Departures Terminal', 'Arrivals Terminal', 'Airport Hotels', 'Car Rental Area', 'Train Station', 'Parking Terminals'],
    'Haifa': ['Rambam Hospital', 'Haifa Port', 'Bahai Gardens', 'Carmel Center', 'Grand Canyon Mall', 'Technion'],
    'Krayot': ['Lev HaMifratz Mall', 'Kiryat Ata Center', 'Kiryat Bialik Center', 'Kiryat Motzkin Beach', 'Local Clinics', 'Train Stations'],
    'Akko': ['Old City of Akko', 'Akko Beach', 'Western Galilee Hospital', 'Akko Train Station', 'Local Market', 'City Center'],
    'Nahariya': ['Nahariya Beach Promenade', 'Galilee Medical Center', 'City Center', 'Train Station', 'Local Malls', 'Achziv Beach'],
    'Tiberias': ['Sea of Galilee Promenade', 'Poriya Hospital', 'Old City', 'Tiberias Hot Springs', 'City Center', 'Local Hotels']
  };

  return destinations[areaName] || ['Medical Centers', 'Shopping Centers', 'Cultural Sites', 'Tourist Attractions'];
}

function getAreaTrips(areaName: string): string[] {
  const trips: Record<string, string[]> = {
    'Ben Gurion Airport': [
      'Airport pickups and drop-offs',
      'Round trips for flights and travel',
      'Transfers to hotels near the airport',
      'Coordinated pickup for flight delays'
    ],
    'Haifa': [
      'Medical appointments at Rambam Hospital',
      'Cruise ship port transfers',
      'Visits to the Bahai Gardens',
      'Shopping trips to Grand Canyon Mall'
    ],
    'Krayot': [
      'Medical appointments at local clinics',
      'Shopping trips to Lev HaMifratz Mall',
      'Transportation between Krayot neighborhoods',
      'Train station transfers'
    ],
    'Akko': [
      'Visits to the Old City and markets',
      'Medical appointments at Western Galilee Hospital',
      'Beach access transportation',
      'Day trips along the western Galilee coast'
    ],
    'Nahariya': [
      'Medical visits to Galilee Medical Center',
      'Beach and promenade access',
      'Train station transfers',
      'Day trips to Achziv and the northern coast'
    ],
    'Tiberias': [
      'Medical appointments at Poriya Hospital',
      'Visits to the Sea of Galilee promenade',
      'Hotel and resort transportation',
      'Day trips around the Galilee'
    ]
  };

  return trips[areaName] || [
    'Airport transfers',
    'Medical appointments',
    'Shopping and leisure trips',
    'Special events and family gatherings'
  ];
}

export default ServiceAreas;
