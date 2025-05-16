import React from 'react';
import { Star } from 'lucide-react';

type RatingProps = {
  value: number;
  max?: number;
  color?: string;
  size?: number;
  className?: string;
};

const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  color = 'text-yellow-400',
  size = 16,
  className = '',
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={`${i < value ? color : 'text-gray-300'} ${i < value ? 'fill-current' : ''}`}
        />
      ))}
    </div>
  );
};

export default Rating;