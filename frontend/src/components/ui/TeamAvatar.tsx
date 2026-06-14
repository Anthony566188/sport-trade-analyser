import React from 'react';
import { cn } from '../../utils/cn';

interface TeamAvatarProps {
  name: string;
  logo?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

/**
 * Exibe o logo do time ou, se ausente, as iniciais sobre
 * um fundo degradê gerado a partir do nome.
 */
export const TeamAvatar: React.FC<TeamAvatarProps> = ({
  name,
  logo,
  size = 'md',
  className,
}) => {
  // Gera uma cor determinística baseada no nome
  const hue = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizeMap[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-white select-none',
        sizeMap[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue},55%,42%), hsl(${(hue + 40) % 360},65%,30%))`,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
};
