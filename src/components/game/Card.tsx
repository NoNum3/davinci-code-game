import React from 'react';
import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';

interface CardProps {
  color: 'black' | 'white';
  value: number;
  hidden?: boolean;
  revealed?: boolean;
  onClick?: () => void;
  className?: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Card: React.FC<CardProps> = ({ color, value, hidden = false, revealed = false, onClick, className }) => {
  const cardColorClass = color === 'black' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border border-gray-300';

  // A card is truly hidden if hidden prop is true AND it's not revealed by a correct guess
  const isTrulyHidden = hidden && !revealed;

  return (
    <div
      className={cn(
        'relative w-16 h-24 rounded-lg flex items-center justify-center text-xl font-bold shadow-md',
        cardColorClass, // Always apply the base color class (black or white background with appropriate text color)
        onClick ? 'cursor-pointer' : '',
        className // Apply the className prop (for selection highlight)
      )}
      onClick={onClick}
    >
      {isTrulyHidden ? (
        <span>?</span> // Display '?' directly, inheriting text color from cardColorClass
      ) : (
        <span>{value}</span> // Display value directly, inheriting text color from cardColorClass
      )}
    </div>
  );
};

export default Card; 