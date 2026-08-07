import React from 'react';
import { useTranslation } from 'react-i18next';
import Section from './ui/Section';
import Rating from './ui/Rating';
import { Quote } from 'lucide-react';

type TestimonialItem = {
  name: string;
  content: string;
  location: string;
  rating: number;
};

const Testimonials: React.FC = () => {
  const { t } = useTranslation();
  const items = t('testimonialsSection.items', { returnObjects: true }) as TestimonialItem[];

  return (
    <Section id="testimonials" background="white">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('testimonialsSection.sectionTitle')}</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('testimonialsSection.sectionSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.map((testimonial, index) => (
          <div
            key={index}
            className="group bg-white rounded-xl shadow-md p-6 border-s-4 border-yellow-500 card-hover"
          >
            <div className="flex items-start mb-4">
              <Quote className="text-yellow-400 me-3 flex-shrink-0 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" size={24} />
              <p className="text-gray-700 italic">{testimonial.content}</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
              </div>
              <Rating value={testimonial.rating} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <a
          href="#booking"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          onClick={(e) => {
            e.preventDefault();
            const bookingSection = document.getElementById('booking');
            bookingSection?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>{t('testimonialsSection.cta')}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ms-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </Section>
  );
};

export default Testimonials;
