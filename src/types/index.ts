// Common type definitions

export type Testimonial = {
  id: number;
  name: string;
  content: string;
  location: string;
  rating: number;
};

export type ServiceArea = {
  id: number;
  name: string;
  description: string;
};

export type Feature = {
  id: number;
  title: string;
  description: string;
  icon: string;
};

export type Language = 'en' | 'he' | 'ar';

export type BookingFormData = {
  name: string;
  phone: string;
  email: string;
  pickupAddress: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  wheelchairCount: number;
  notes: string;
};