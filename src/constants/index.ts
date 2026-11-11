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
    description: 'Vehicle equipped with a manual wheelchair ramp and secure locking system for safe, comfortable transport.',
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
    title: 'Northern Israel Coverage',
    description: 'Serving Haifa, the entire North region, and transfers to and from Ben Gurion Airport.',
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
    description: 'Professionally licensed and fully insured for your peace of mind.',
    icon: 'Shield'
  }
];

export const SERVICE_AREAS: ServiceArea[] = [
  { id: 1, name: 'Ben Gurion Airport', description: 'Reliable accessible transfers to and from Ben Gurion Airport, any time of day or night.' },
  { id: 2, name: 'Haifa', description: 'Full accessible taxi service throughout Haifa and the surrounding metropolitan area.' },
  { id: 3, name: 'Krayot', description: 'Serving Kiryat Ata, Kiryat Bialik, Kiryat Motzkin and the rest of the Krayot area.' },
  { id: 4, name: 'Akko', description: 'Accessible transportation throughout Akko (Acre) and the western Galilee coast.' },
  { id: 5, name: 'Nahariya', description: 'Covering Nahariya and the northern coastal communities.' },
  { id: 6, name: 'Tiberias', description: 'Serving Tiberias and communities around the Sea of Galilee.' }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'David Cohen',
    content: 'The accessible taxi service has been a lifesaver for my mother. The driver is always punctual and extremely helpful with her wheelchair.',
    location: 'Haifa',
    rating: 5
  },
  {
    id: 2,
    name: 'Sarah Levy',
    content: 'I rely on this service for all my medical appointments. The vehicle is clean, comfortable, and the ramp makes boarding so much easier.',
    location: 'Krayot',
    rating: 5
  },
  {
    id: 3,
    name: 'Mohammed Amir',
    content: 'Excellent service that has made traveling much more accessible for my family. Highly recommended for anyone with mobility needs.',
    location: 'Nahariya',
    rating: 4
  },
  {
    id: 4,
    name: 'Rachel Goldstein',
    content: 'The emergency service is remarkable. When I needed urgent transport for my grandfather, they arrived within 15 minutes.',
    location: 'Tiberias',
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
