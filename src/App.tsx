import React, { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Journey from './components/Journey';
import MobileActionBar from './components/MobileActionBar';
import Features from './components/Features';
import ServiceAreas from './components/ServiceAreas';
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
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Journey />
        <Features />
        <ServiceAreas />
        <EmergencyCallout />
        {/* Testimonials hidden until real customer reviews are available */}
        <BookingForm />
        <Contact />
      </main>
      <Footer />
      <MobileActionBar />
    </div>
  );
}

export default App;