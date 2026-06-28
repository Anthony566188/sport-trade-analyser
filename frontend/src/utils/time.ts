import { MatchPeriod, MATCH_PERIOD_LABELS } from '../types';

export interface MatchTimeInput {
  period: MatchPeriod;
  minute_second: number;
  additional_minute_second?: number | null;
}

/**
 * Converte a Trinca Temporal para exibição visual completa.
 * Ex: "1º Tempo - 12:35'" ou "2º Tempo - 45+02:05'"
 */
export function matchTimeToDisplay({ period, minute_second, additional_minute_second }: MatchTimeInput): string {
  const periodLabel = MATCH_PERIOD_LABELS[period] || period;

  const formatPart = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (additional_minute_second != null && additional_minute_second > 0) {
    const baseMinutes = Math.floor(minute_second / 60);
    const addTime = formatPart(additional_minute_second);
    return `${periodLabel} - ${baseMinutes}+${addTime}'`;
  }

  return `${periodLabel} - ${formatPart(minute_second)}'`;
}

/**
 * Helper temporário para suportar componentes que ainda dependem do tempo linear
 * (Ex: hook useChronometer atual).
 */
export function inferMatchTimeFromSeconds(s: number): MatchTimeInput {
  let period = MatchPeriod.FIRST_HALF;
  let minute_second = s;
  let additional_minute_second = 0;

  // Inferência para manter o relógio linear compatível com o domínio provisoriamente
  if (s > 2700 && s <= 5400) {
    period = MatchPeriod.SECOND_HALF;
  } else if (s > 5400) {
    period = MatchPeriod.SECOND_HALF;
    minute_second = 5400;
    additional_minute_second = s - 5400;
  }

  return { period, minute_second, additional_minute_second };
}

/**
 * Formata apenas os minutos e segundos simples para edição manual (MM:SS).
 */
export function formatMinutesSeconds(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

/**
 * Converte segundos totais para exibição de fallback.
 */
export function secondsToDisplay(s: number): string {
  const trinca = inferMatchTimeFromSeconds(s);
  return matchTimeToDisplay(trinca);
}


export function displayToSeconds(value: string): number | null {
  const trimmed = value.trim()

  // Aceita formatos: "90", "7:30", "07:30", "45:00"
  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, parseInt(trimmed, 10))
  }

  const parts = trimmed.split(':')
  if (parts.length !== 2) return null

  const minutes = parseInt(parts[0], 10)
  const seconds = parseInt(parts[1], 10)

  if (isNaN(minutes) || isNaN(seconds)) return null
  if (seconds < 0 || seconds > 59)      return null
  if (minutes < 0)                       return null

  return minutes * 60 + seconds
}

/**
 * Converte segundos para objeto {minutes, seconds} para uso em inputs separados.
 */
export function secondsToMinSec(totalSeconds: number): { minutes: number; seconds: number } {
  // Limita ao máximo de 2700s (45min) para o campo base
  const clamped = Math.min(totalSeconds, 2700)
  return {
    minutes: Math.floor(clamped / 60),
    seconds: clamped % 60,
  }
}

/**
 * Converte minutos e segundos para total em segundos.
 */
export function minSecToSeconds(minutes: number, seconds: number): number {
  return Math.max(0, minutes * 60 + seconds)
}
