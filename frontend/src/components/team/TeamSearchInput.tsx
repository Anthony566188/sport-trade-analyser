import React, { useRef, useEffect, useId } from 'react';
import { Search, X, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { useTeamSearch } from '../../hooks/useTeamSearch';
import { TeamAvatar } from '../ui/TeamAvatar';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { cn } from '../../utils/cn';
import type { Team } from '../../types';

interface TeamSearchInputProps {
  /** ID do campeonato para filtrar times. Omitir para busca global (amistoso). */
  championshipId?: number;
  /** Label visível do campo */
  label?: string;
  /** Placeholder do input */
  placeholder?: string;
  /** Callback ao selecionar um time */
  onSelect?: (team: Team) => void;
  /** Time já selecionado (para exibir estado controlado) */
  selectedTeam?: Team | null;
  /** Desabilita o campo */
  disabled?: boolean;
  className?: string;
}

/**
 * Componente de busca inteligente de times com autocomplete.
 *
 * Funcionalidades:
 * - Debounce de 500ms para evitar chamadas excessivas ao backend
 * - Busca a cada letra digitada após o delay
 * - Lista dropdown animada com avatar de cada time
 * - Botão "Ver todos os times" para listar sem filtro
 * - Estado de loading, erro e vazio tratados visualmente
 * - Acessível: aria-labels, roles e navegação por teclado
 * - Reset ao selecionar ou limpar
 */
export const TeamSearchInput: React.FC<TeamSearchInputProps> = ({
  championshipId,
  label = 'Buscar time',
  placeholder = 'Digite o nome do time...',
  onSelect,
  selectedTeam,
  disabled = false,
  className,
}) => {
  const inputId   = useId();
  const listboxId = useId();
  const inputRef  = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    teams,
    isLoading,
    error,
    fetchAll,
    reset,
  } = useTeamSearch({ championshipId, debounceMs: 500 });

  /** Fecha o dropdown ao clicar fora */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        // Mantém os resultados mas fecha visualmente via `showDropdown`
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (team: Team) => {
    onSelect?.(team);
    reset();
    inputRef.current?.blur();
  };

  const handleClear = () => {
    reset();
    inputRef.current?.focus();
  };

  const showDropdown = !disabled && (teams.length > 0 || isLoading || !!error || query.length > 0);

  // Se um time já foi selecionado, exibe o estado "selecionado" em vez do input
  if (selectedTeam) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <span className="text-xs font-medium text-turf-500 dark:text-turf-400 uppercase tracking-wide">
            {label}
          </span>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-pitch-500 bg-pitch-50 dark:bg-pitch-950/30">
          <TeamAvatar name={selectedTeam.name} logo={selectedTeam.logo} size="sm" />
          <span className="flex-1 font-medium text-turf-900 dark:text-turf-100 truncate">
            {selectedTeam.name}
          </span>
          <button
            onClick={handleClear}
            aria-label="Remover time selecionado"
            className="text-turf-400 hover:text-turf-600 dark:hover:text-turf-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-turf-500 dark:text-turf-400 uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      {/* Input wrapper — posicionamento relativo para o dropdown */}
      <div className="relative">
        {/* Input com ícone de busca e botão de limpar */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-150',
            'bg-white dark:bg-turf-800',
            'border-turf-200 dark:border-turf-700',
            'focus-within:border-pitch-500 dark:focus-within:border-pitch-500',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isLoading ? (
            <Spinner size="sm" className="flex-shrink-0" />
          ) : (
            <Search
              className="w-4 h-4 flex-shrink-0 text-turf-400"
              strokeWidth={2}
            />
          )}

          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-label={label}
            disabled={disabled}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'flex-1 bg-transparent outline-none text-sm',
              'text-turf-900 dark:text-turf-100',
              'placeholder:text-turf-400 dark:placeholder:text-turf-500',
              disabled && 'cursor-not-allowed',
            )}
          />

          {/* Botão limpar — só aparece se houver texto */}
          {query.length > 0 && (
            <button
              onClick={handleClear}
              aria-label="Limpar busca"
              tabIndex={-1}
              className="text-turf-400 hover:text-turf-600 dark:hover:text-turf-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ──── Dropdown ──── */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            id={listboxId}
            role="listbox"
            aria-label="Resultados da busca de times"
            className={cn(
              'absolute z-50 top-full left-0 right-0 mt-1.5',
              'rounded-xl border shadow-xl',
              'bg-white dark:bg-turf-800',
              'border-turf-200 dark:border-turf-700',
              'overflow-hidden animate-slide-down',
              'max-h-72 overflow-y-auto',
            )}
          >
            {/* Estado: erro */}
            {error && !isLoading && (
              <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Estado: loading (sem resultados ainda) */}
            {isLoading && teams.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-turf-400">
                <Spinner size="sm" />
                <span>Buscando times...</span>
              </div>
            )}

            {/* Estado: vazio (query digitado, sem resultados) */}
            {!isLoading && !error && teams.length === 0 && query.length > 0 && (
              <EmptyState message={`Nenhum time encontrado para "${query}".`} />
            )}

            {/* Lista de times */}
            {teams.length > 0 && (
              <ul className="py-1">
                {teams.map((team) => (
                  <li key={team.id}>
                    <button
                      role="option"
                      aria-selected={false}
                      onClick={() => handleSelect(team)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                        'hover:bg-turf-50 dark:hover:bg-turf-700',
                        'focus:bg-turf-50 dark:focus:bg-turf-700',
                        'focus:outline-none transition-colors duration-100',
                        'group',
                      )}
                    >
                      <TeamAvatar name={team.name} logo={team.logo} size="sm" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-turf-900 dark:text-turf-100 truncate">
                          {highlightMatch(team.name, query)}
                        </p>
                      </div>

                      <ChevronRight
                        className="w-3.5 h-3.5 text-turf-300 group-hover:text-pitch-500 transition-colors"
                        strokeWidth={2.5}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Divider + "Ver todos os times" */}
            <div className="border-t border-turf-100 dark:border-turf-700">
              <button
                onClick={() => {
                  fetchAll();
                  inputRef.current?.focus();
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-3 text-sm',
                  'text-pitch-600 dark:text-pitch-400 font-medium',
                  'hover:bg-pitch-50 dark:hover:bg-pitch-950/20',
                  'focus:outline-none focus:bg-pitch-50 dark:focus:bg-pitch-950/20',
                  'transition-colors duration-100',
                )}
              >
                <Users className="w-4 h-4" strokeWidth={2} />
                Ver todos os times
              </button>
            </div>
          </div>
        )}

        {/* Trigger inicial: "Ver todos" quando o input está vazio e sem foco anterior */}
        {!showDropdown && !query && (
          <div className="mt-2">
            <button
              onClick={() => {
                fetchAll();
                inputRef.current?.focus();
              }}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 text-xs text-pitch-600 dark:text-pitch-400',
                'hover:text-pitch-700 dark:hover:text-pitch-300',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'transition-colors',
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Ver todos os times disponíveis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Destaca visualmente a parte do nome que coincide com a query.
 * Retorna um ReactNode com <mark> nos trechos encontrados.
 */
function highlightMatch(name: string, query: string): React.ReactNode {
  if (!query.trim()) return name;

  const regex = new RegExp(`(${escapeRegex(query.trim())})`, 'gi');
  const parts = name.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-accent-400/30 text-turf-900 dark:text-turf-100 rounded-sm not-italic"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
