import { Feature, ServiceArea, Testimonial } from '../types';
import { 
  Accessibility, 
  Clock, 
  MapPin, 
  CreditCard, 
  Phone, 
  Shield, 
  Car, 
  CalendarClock 
} from 'lucide-react';

export const FEATURES: Feature[] = [
  {
    id: 1,
    title: 'Wheelchair Accessible',
    description: 'Specially equipped vehicles with ramps and securing systems for safe wheelchair transport.',
    icon: 'Accessibility'
  },
  {
    id: 2,
    title: '24/7 Availability',
    description: 'Our service is available around the clock for both scheduled and emergency rides.',
    icon: 'Clock'
  },
  {
    id: 3,
    title: 'Nationwide Coverage',
    description: 'Serving major cities and communities throughout Israel.',
    icon: 'MapPin'
  },
  {
    id: 4,
    title: 'Transparent Pricing',
    description: 'Clear fare structure with no hidden costs or surprises.',
    icon: 'CreditCard'
  },
  {
    id: 5,
    title: 'Emergency Service',
    description: 'Priority dispatch for urgent medical appointments or emergencies.',
    icon: 'Phone'
  },
  {
    id: 6,
    title: 'Licensed & Insured',
    description: 'All drivers are professionally licensed and fully insured for your peace of mind.',
    icon: 'Shield'
  }
];

export const SERVICE_AREAS: ServiceArea[] = [
  { id: 1, name: 'Tel Aviv', description: 'Full service throughout Tel Aviv and surrounding suburbs.' },
  { id: 2, name: 'Jerusalem', description: 'Complete coverage of Jerusalem including the Old City and all neighborhoods.' },
  { id: 3, name: 'Haifa', description: 'Serving Haifa and the northern coastal region.' },
  { id: 4, name: 'Beersheba', description: 'Available throughout Beersheba and the southern region.' },
  { id: 5, name: 'Netanya', description: 'Full service in Netanya and nearby coastal communities.' },
  { id: 6, name: 'Eilat', description: 'Serving the Eilat region and southern border communities.' }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'David Cohen',
    content: 'The accessible taxi service has been a lifesaver for my mother. The drivers are always punctual and extremely helpful with her wheelchair.',
    location: 'Jerusalem',
    rating: 5
  },
  {
    id: 2,
    name: 'Sarah Levy',
    content: 'I rely on this service for all my medical appointments. The vehicles are clean, modern, and the ramp system makes boarding so much easier.',
    location: 'Tel Aviv',
    rating: 5
  },
  {
    id: 3,
    name: 'Mohammed Amir',
    content: 'Excellent service that has made traveling much more accessible for my family. Highly recommended for anyone with mobility needs.',
    location: 'Haifa',
    rating: 4
  },
  {
    id: 4,
    name: 'Rachel Goldstein',
    content: 'The emergency service is remarkable. When I needed urgent transport for my grandfather, they arrived within 15 minutes.',
    location: 'Netanya',
    rating: 5
  }
];

export const ICON_COMPONENTS = {
  Accessibility,
  Clock,
  MapPin,
  CreditCard,
  Phone,
  Shield,
  Car,
  CalendarClock
};