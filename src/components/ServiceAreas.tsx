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
          Our accessible taxi service covers major cities and communities throughout Israel.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative aspect-video">
              <img 
                src="https://images.pexels.com/photos/1468937/pexels-photo-1468937.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Map of Israel showing service areas" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <div className="flex items-center">
                  <MapPin className="text-yellow-400 mr-2" size={20} />
                  <span className="font-medium">Nationwide Coverage</span>
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
                        ? 'bg-yellow-500 text-gray-900' 
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
        
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
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
    'Tel Aviv': ['Ben Gurion Airport', 'Medical Centers', 'Tel Aviv Port', 'Dizengoff Center', 'Sarona Market', 'Rothschild Boulevard'],
    'Jerusalem': ['Western Wall', 'Hadassah Medical Center', 'Mahane Yehuda Market', 'Israel Museum', 'Malha Mall', 'Mount of Olives'],
    'Haifa': ['Bahai Gardens', 'Rambam Hospital', 'Haifa Port', 'Carmel Center', 'Grand Canyon Mall', 'Technion'],
    'Beersheba': ['Soroka Medical Center', 'Ben-Gurion University', 'Grand Canyon Mall', 'Old City', 'Beer Sheva River Park', 'Negev Mall'],
    'Netanya': ['Poleg Beach', 'Laniado Hospital', 'Ir Yamim Mall', 'Netanya Promenade', 'Wingate Institute', 'City Center'],
    'Eilat': ['Eilat Airport', 'Coral Beach', 'Ice Mall', 'Dolphin Reef', 'Eilat Promenade', 'Yotvata']
  };
  
  return destinations[areaName] || ['Medical Centers', 'Shopping Centers', 'Cultural Sites', 'Tourist Attractions'];
}

function getAreaTrips(areaName: string): string[] {
  const trips: Record<string, string[]> = {
    'Tel Aviv': [
      'Airport transfers to/from Ben Gurion',
      'Medical appointments at Ichilov Hospital',
      'Day trips to Jaffa Old City',
      'Cruise ship port pickups'
    ],
    'Jerusalem': [
      'Accessible tours of the Old City',
      'Transportation to religious sites',
      'Medical visits to Hadassah Ein Kerem',
      'Day trips to the Dead Sea'
    ],
    'Haifa': [
      'Cruiseship port transfers',
      'Visits to Rambam Medical Center',
      'Day trips to Akko and northern coast',
      'Transportation to Bahai Gardens'
    ],
    'Beersheba': [
      'Medical appointments at Soroka',
      'University campus transportation',
      'Desert tours and attractions',
      'Transportation to the northern Negev'
    ],
    'Netanya': [
      'Beach access transportation',
      'Medical visits to Laniado Hospital',
      'Shopping trips to local malls',
      'Day trips along the coastal region'
    ],
    'Eilat': [
      'Airport transfers',
      'Hotel and resort transportation',
      'Beach and water attraction visits',
      'Day trips to Timna Park'
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