import React, { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import ServiceAreas from './components/ServiceAreas';
import Testimonials from './components/Testimonials';
import BookingForm from './components/BookingForm';
import EmergencyCallout from './components/EmergencyCallout';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './index.css';

function App() {
  // Scroll to anchor links smoothly
  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href') as string);
        target?.scrollIntoView({ behavior: 'smooth' });
      });
    });
    
    // Add animation classes for elements
    document.documentElement.style.setProperty('--animate-duration', '.5s');
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <ServiceAreas />
        <EmergencyCallout />
        <Testimonials />
        <BookingForm />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;