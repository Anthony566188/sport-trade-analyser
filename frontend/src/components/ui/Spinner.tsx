import React from 'react';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
  <div
    role="status"
    aria-label="Carregando..."
    className={cn(
      'animate-spin rounded-full border-2 border-turf-200 border-t-pitch-500',
      size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
      className,
    )}
  />
);
