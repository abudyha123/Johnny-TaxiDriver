import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Section from './ui/Section';
import Input from './ui/Input';
import Button from './ui/Button';
import { CalendarClock, Clock, MessageCircle, Phone } from 'lucide-react';
import { BookingFormData } from '../types';

const WHATSAPP_NUMBER = '972545928999';

const BookingForm: React.FC = () => {
  const { t } = useTranslation();
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
      newErrors.name = t('booking.errors.name');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('booking.errors.phone');
    } else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(formData.phone)) {
      newErrors.phone = t('booking.errors.phoneInvalid');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('booking.errors.emailInvalid');
    }

    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = t('booking.errors.pickup');
    }

    if (!formData.destination.trim()) {
      newErrors.destination = t('booking.errors.destination');
    }

    if (!formData.date) {
      newErrors.date = t('booking.errors.date');
    }

    if (!formData.time) {
      newErrors.time = t('booking.errors.time');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildWhatsAppMessage = (): string => {
    const lines = [
      t('booking.whatsappTitle'),
      '',
      `${t('booking.whatsappLabels.name')}: ${formData.name}`,
      `${t('booking.whatsappLabels.phone')}: ${formData.phone}`
    ];

    if (formData.email.trim()) {
      lines.push(`${t('booking.whatsappLabels.email')}: ${formData.email}`);
    }

    lines.push(`${t('booking.whatsappLabels.pickup')}: ${formData.pickupAddress}`);
    lines.push(`${t('booking.whatsappLabels.destination')}: ${formData.destination}`);
    lines.push(`${t('booking.whatsappLabels.date')}: ${formData.date}`);
    lines.push(`${t('booking.whatsappLabels.time')}: ${formData.time}`);
    lines.push(`${t('booking.whatsappLabels.passengers')}: ${formData.passengers}`);
    lines.push(`${t('booking.whatsappLabels.wheelchairs')}: ${formData.wheelchairCount}`);

    if (formData.notes.trim()) {
      lines.push(`${t('booking.whatsappLabels.notes')}: ${formData.notes}`);
    }

    return lines.join('\n');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      const message = buildWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(true);

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
        }, 6000);
      }, 600);
    }
  };

  return (
    <Section id="booking" background="light">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('booking.sectionTitle')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('booking.sectionSubtitle')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-10 -end-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6">{t('booking.infoTitle')}</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center me-3 flex-shrink-0">
                      <Clock className="text-yellow-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{t('booking.available247')}</h4>
                      <p className="text-blue-100 text-sm">{t('booking.available247Desc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center me-3 flex-shrink-0">
                      <CalendarClock className="text-yellow-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{t('booking.advanceBooking')}</h4>
                      <p className="text-blue-100 text-sm">{t('booking.advanceBookingDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center me-3 flex-shrink-0">
                      <Phone className="text-yellow-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{t('booking.emergencyService')}</h4>
                      <p className="text-blue-100 text-sm">{t('booking.emergencyServiceDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 relative z-10">
                <p className="text-sm text-blue-100 mb-3">{t('booking.immediateAssistance')}</p>
                <a
                  href="tel:+972545928999"
                  className="text-xl font-bold text-white hover:text-yellow-400 transition-colors flex items-center mb-3"
                >
                  <Phone className="me-2" size={18} />
                  054-592-8999
                </a>
                <a
                  href="https://wa.me/972545928999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <MessageCircle className="me-2" size={18} />
                  {t('booking.whatsappButton')}
                </a>
              </div>
            </div>

            <div className="lg:col-span-3 p-8">
              {submitSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('booking.successTitle')}</h3>
                  <p className="text-gray-600 mb-6">
                    {t('booking.successDesc')}
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setSubmitSuccess(false)}
                  >
                    {t('booking.bookAnother')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('booking.fields.name')}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('booking.fields.namePlaceholder')}
                      required
                      error={errors.name}
                      className="mb-4"
                    />

                    <Input
                      label={t('booking.fields.phone')}
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t('booking.fields.phonePlaceholder')}
                      required
                      error={errors.phone}
                      className="mb-4"
                    />

                    <Input
                      label={t('booking.fields.email')}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('booking.fields.emailPlaceholder')}
                      error={errors.email}
                      className="mb-4"
                    />

                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                      <Input
                        label={t('booking.fields.date')}
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        error={errors.date}
                        className="mb-4"
                      />

                      <Input
                        label={t('booking.fields.time')}
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
                      label={t('booking.fields.pickup')}
                      name="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={handleChange}
                      placeholder={t('booking.fields.pickupPlaceholder')}
                      required
                      error={errors.pickupAddress}
                      className="mb-4 md:col-span-2"
                    />

                    <Input
                      label={t('booking.fields.destination')}
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      placeholder={t('booking.fields.destinationPlaceholder')}
                      required
                      error={errors.destination}
                      className="mb-4 md:col-span-2"
                    />

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('booking.fields.passengers')}
                      </label>
                      <select
                        name="passengers"
                        value={formData.passengers}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('booking.fields.wheelchairs')}
                      </label>
                      <select
                        name="wheelchairCount"
                        value={formData.wheelchairCount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      >
                        {[0, 1, 2, 3].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('booking.fields.notes')}
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder={t('booking.fields.notesPlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      ></textarea>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    {isSubmitting ? t('booking.submitting') : t('booking.submit')}
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
