import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className={cn(
        'relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pitch-500',
        isDark ? 'bg-turf-700' : 'bg-turf-200',
        className,
      )}
    >
      {/* Track icons */}
      <Sun
        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-500"
        strokeWidth={2.5}
      />
      <Moon
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-turf-400"
        strokeWidth={2.5}
      />
      {/* Thumb */}
      <span
        className={cn(
          'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300',
          isDark ? 'translate-x-7' : 'translate-x-0.5',
        )}
      />
    </button>
  );
};
