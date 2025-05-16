import React, { useState } from 'react';
import Section from './ui/Section';
import Input from './ui/Input';
import Button from './ui/Button';
import { CalendarClock, Clock, MapPin, MessageSquare, User, Phone, Mail } from 'lucide-react';
import { BookingFormData } from '../types';

const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    phone: '',
    email: '',
    pickupAddress: '',
    destination: '',
    date: '',
    time: '',
    passengers: 1,
    wheelchairCount: 1,
    notes: ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof BookingFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required';
    }
    
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate API call with setTimeout
      setTimeout(() => {
        // Handle form submission here - would connect to backend API in production
        console.log('Form submitted:', formData);
        setIsSubmitting(false);
        setSubmitSuccess(true);
        
        // Reset form after success
        setTimeout(() => {
          setFormData({
            name: '',
            phone: '',
            email: '',
            pickupAddress: '',
            destination: '',
            date: '',
            time: '',
            passengers: 1,
            wheelchairCount: 1,
            notes: ''
          });
          setSubmitSuccess(false);
        }, 5000);
      }, 1500);
    }
  };
  
  return (
    <Section id="booking" background="light">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Book Your Accessible Ride</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete the form below to schedule your accessible taxi service. We'll confirm your booking promptly.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-2 bg-blue-600 text-white p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-6">Booking Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Clock className="mr-3 flex-shrink-0 text-yellow-400" size={20} />
                    <div>
                      <h4 className="font-medium text-white">Available 24/7</h4>
                      <p className="text-blue-100 text-sm">Service available at all hours for your convenience</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CalendarClock className="mr-3 flex-shrink-0 text-yellow-400" size={20} />
                    <div>
                      <h4 className="font-medium text-white">Advance Booking</h4>
                      <p className="text-blue-100 text-sm">Reserve up to 30 days in advance for planned trips</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="mr-3 flex-shrink-0 text-yellow-400" size={20} />
                    <div>
                      <h4 className="font-medium text-white">Emergency Service</h4>
                      <p className="text-blue-100 text-sm">Urgent transport for medical or emergency situations</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-700 rounded-lg">
                <p className="text-sm text-blue-100 mb-2">For immediate assistance:</p>
                <a 
                  href="tel:+9721234567" 
                  className="text-xl font-bold text-white hover:text-yellow-400 transition-colors flex items-center"
                >
                  <Phone className="mr-2" size={18} />
                  +972-123-4567
                </a>
              </div>
            </div>
            
            <div className="lg:col-span-3 p-8">
              {submitSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Received!</h3>
                  <p className="text-gray-600 mb-6">
                    We've received your booking request and will confirm shortly.
                    Our team will contact you at the provided phone number.
                  </p>
                  <Button 
                    variant="primary"
                    onClick={() => setSubmitSuccess(false)}
                  >
                    Book Another Ride
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                      error={errors.name}
                      className="mb-4"
                    />
                    
                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+972 XX XXX XXXX"
                      required
                      error={errors.phone}
                      className="mb-4"
                    />
                    
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      error={errors.email}
                      className="mb-4"
                    />
                    
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                      <Input
                        label="Date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        error={errors.date}
                        className="mb-4"
                      />
                      
                      <Input
                        label="Time"
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                        error={errors.time}
                        className="mb-4"
                      />
                    </div>
                    
                    <Input
                      label="Pickup Address"
                      name="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={handleChange}
                      placeholder="Enter your pickup location"
                      required
                      error={errors.pickupAddress}
                      className="mb-4 md:col-span-2"
                    />
                    
                    <Input
                      label="Destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      placeholder="Enter your destination"
                      required
                      error={errors.destination}
                      className="mb-4 md:col-span-2"
                    />
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Passengers
                      </label>
                      <select
                        name="passengers"
                        value={formData.passengers}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wheelchairs
                      </label>
                      <select
                        name="wheelchairCount"
                        value={formData.wheelchairCount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[0, 1, 2, 3].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2 mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any special requirements or information"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Book Your Ride'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default BookingForm;