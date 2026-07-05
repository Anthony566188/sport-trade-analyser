import { useState, useEffect } from 'react';
import { timelineEventService } from '../services/timelineEventService';
import type { FrequentSelectionResponse } from '../types';

interface UseFrequentSelectionsResult {
  selections: FrequentSelectionResponse[];
  loading:    boolean;
  error:      string | null;
}

/**
 * Carrega os eventos/critérios mais utilizados via timelineEventService.
 * Segue o mesmo padrão de hooks assíncronos do projeto.
 */
export function useFrequentSelections(): UseFrequentSelectionsResult {
  const [selections, setSelections] = useState<FrequentSelectionResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await timelineEventService.getFrequentSelections();
        if (!cancelled) setSelections(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Erro ao carregar seleções frequentes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { selections, loading, error };
}