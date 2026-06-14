import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { searchTeamsByChampionship, searchAllTeams } from '../services/teamService';
import type { Team } from '../types';

interface UseTeamSearchOptions {
  /** Se fornecido, busca apenas times deste campeonato. */
  championshipId?: number;
  /** Delay do debounce em ms (padrão: 500). */
  debounceMs?: number;
}

interface UseTeamSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  /** Força busca com query vazia (modo "Ver todos"). */
  fetchAll: () => void;
  /** Reseta o estado completo. */
  reset: () => void;
}

/**
 * Hook inteligente de busca de times.
 *
 * - Aplica debounce de 500ms antes de disparar a requisição.
 * - Suporta dois modos: campeonato específico ou todos os times (amistoso).
 * - Expõe `fetchAll` para renderizar a lista completa sem digitação.
 */
export function useTeamSearch({
  championshipId,
  debounceMs = 500,
}: UseTeamSearchOptions = {}): UseTeamSearchReturn {
  const [query, setQuery]         = useState('');
  const [teams, setTeams]         = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [forceAll, setForceAll]   = useState(false);

  const debouncedQuery = useDebounce(query, debounceMs);

  const doSearch = useCallback(
    async (searchQuery: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = championshipId
          ? await searchTeamsByChampionship(championshipId, searchQuery)
          : await searchAllTeams(searchQuery);
        setTeams(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar times.';
        setError(message);
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    },
    [championshipId],
  );

  // Dispara quando o valor debounced muda
  useEffect(() => {
    // Só executa se o usuário digitou algo OU se "Ver todos" foi acionado
    if (debouncedQuery.length > 0 || forceAll) {
      doSearch(debouncedQuery);
      if (forceAll) setForceAll(false);
    }
  }, [debouncedQuery, forceAll, doSearch]);

  const fetchAll = useCallback(() => {
    setQuery('');
    setForceAll(true);
  }, []);

  const reset = useCallback(() => {
    setQuery('');
    setTeams([]);
    setError(null);
    setIsLoading(false);
    setForceAll(false);
  }, []);

  return { query, setQuery, teams, isLoading, error, fetchAll, reset };
}
