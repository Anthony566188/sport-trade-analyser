import { useMemo } from 'react';
import { MatchPeriod } from '../types';
import type { TimelineEvent, Bet } from '../types';

export const PERIOD_WEIGHTS: Record<MatchPeriod, number> = {
  [MatchPeriod.FIRST_HALF]: 1,
  [MatchPeriod.HALF_TIME]: 2,
  [MatchPeriod.SECOND_HALF]: 3,
  [MatchPeriod.EXTRA_FIRST]: 4,
  [MatchPeriod.EXTRA_SECOND]: 5,
};

export type UnifiedTimelineItem =
  | { type: 'EVENT'; sortId: string; period: MatchPeriod; minute: number; additional: number; payload: TimelineEvent }
  | { type: 'BET'; sortId: string; period: MatchPeriod; minute: number; additional: number; payload: Bet };

/**
 * Hook responsável por unificar e ordenar cronologicamente eventos e apostas da timeline,
 * respeitando estritamente a nova Trinca Temporal do domínio (Período -> Minuto -> Acréscimo).
 */
export function useTimelineSort(events: TimelineEvent[], bets: Bet[], direction: 'asc' | 'desc' = 'desc') {
  return useMemo(() => {
    // 1. Unifica as coleções transformando-as no contrato padronizado de item da timeline
    const unified: UnifiedTimelineItem[] = [
      ...events.map(e => ({
        type: 'EVENT' as const,
        sortId: `evt-${e.id}`,
        period: e.match_period,
        minute: e.minute_second,
        additional: e.additional_minute_second ?? 0,
        payload: e,
      })),
      ...bets.map(b => ({
        type: 'BET' as const,
        sortId: `bet-${b.id}`,
        period: b.entry_period,
        minute: b.entry_minute_second,
        additional: b.entry_additional_minute_second ?? 0,
        payload: b,
      }))
    ];

    // 2. Ordena baseado nas regras de invariante de tempo do backend
    return unified.sort((a, b) => {
      const weightA = PERIOD_WEIGHTS[a.period] ?? 0;
      const weightB = PERIOD_WEIGHTS[b.period] ?? 0;

      // Critério Primário: Peso do Período (MatchPeriod)
      if (weightA !== weightB) {
        return direction === 'asc' ? weightA - weightB : weightB - weightA;
      }

      // Critério Secundário: Minutos (Tempo regulamentar da fase)
      if (a.minute !== b.minute) {
        return direction === 'asc' ? a.minute - b.minute : b.minute - a.minute;
      }

      // Critério Terciário: Acréscimos
      if (a.additional !== b.additional) {
        return direction === 'asc' ? a.additional - b.additional : b.additional - a.additional;
      }

      return 0;
    });
  }, [events, bets, direction]);
}