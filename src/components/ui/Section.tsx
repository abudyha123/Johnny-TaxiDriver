import React from 'react';

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: 'white' | 'light' | 'dark';
};

const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  id,
  background = 'white',
}) => {
  const bgClasses = {
    white: 'bg-white',
    light: 'bg-gray-50',
    dark: 'bg-gray-900 text-white'
  };

  return (
    <section 
      id={id}
      className={`py-16 md:py-24 ${bgClasses[background]} ${className}`}
    >
      <div className="container mx-auto px-4 md:px-6">
        {children}
      </div>
    </section>
  );
};

export default Section;