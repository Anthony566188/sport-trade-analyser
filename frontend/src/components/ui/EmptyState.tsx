import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'Nenhum time encontrado.',
}) => (
  <div className="flex flex-col items-center gap-2 py-8 text-turf-400 dark:text-turf-500 select-none">
    <SearchX className="w-8 h-8" strokeWidth={1.5} />
    <p className="text-sm">{message}</p>
  </div>
);
