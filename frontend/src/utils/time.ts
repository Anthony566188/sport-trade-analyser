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

/**
 * Formata o tempo completo considerando o estado explícito do Período
 * (Resolve falhas onde segundos de acréscimo "avançavam" a fase visualmente)
 */
export function formatChronometerTime(elapsed: number, period: MatchPeriod): string {
  let calcMinSec = 0
  let calcAdd = 0

  switch (period) {
    case MatchPeriod.FIRST_HALF:
      calcMinSec = Math.min(elapsed, 2700)
      calcAdd = Math.max(0, elapsed - 2700)
      break
    case MatchPeriod.HALF_TIME:
      calcMinSec = 2700
      calcAdd = 0
      break
    case MatchPeriod.SECOND_HALF:
      calcMinSec = Math.min(elapsed, 5400)
      calcAdd = Math.max(0, elapsed - 5400)
      break
    case MatchPeriod.EXTRA_FIRST:
      calcMinSec = Math.min(elapsed, 6300)
      calcAdd = Math.max(0, elapsed - 6300)
      break
    case MatchPeriod.EXTRA_SECOND:
      calcMinSec = Math.min(elapsed, 7200)
      calcAdd = Math.max(0, elapsed - 7200)
      break
    default:
      calcMinSec = elapsed
      calcAdd = 0
  }

  return matchTimeToDisplay({ period, minute_second: calcMinSec, additional_minute_second: calcAdd })
}

/**
 * Formata o tempo para o input de edição manual, preservando a notação de acréscimo se houver (ex: 45:00+02:30).
 */
export function formatEditTime(elapsed: number, period: MatchPeriod): string {
  let calcMinSec = 0
  let calcAdd = 0

  switch (period) {
    case MatchPeriod.FIRST_HALF:
      calcMinSec = Math.min(elapsed, 2700)
      calcAdd = Math.max(0, elapsed - 2700)
      break
    case MatchPeriod.HALF_TIME:
      calcMinSec = 2700
      calcAdd = 0
      break
    case MatchPeriod.SECOND_HALF:
      calcMinSec = Math.min(elapsed, 5400)
      calcAdd = Math.max(0, elapsed - 5400)
      break
    case MatchPeriod.EXTRA_FIRST:
      calcMinSec = Math.min(elapsed, 6300)
      calcAdd = Math.max(0, elapsed - 6300)
      break
    case MatchPeriod.EXTRA_SECOND:
      calcMinSec = Math.min(elapsed, 7200)
      calcAdd = Math.max(0, elapsed - 7200)
      break
    default:
      calcMinSec = elapsed
      calcAdd = 0
  }

  const formatPart = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  if (calcAdd > 0) {
    return `${formatPart(calcMinSec)}+${formatPart(calcAdd)}`
  }
  return formatPart(calcMinSec)
}

/**
 * Converte a string inserida pelo usuário em segundos e também infere o Período da Partida.
 * Aceita MM:SS, MM:SS+MM:SS, MM:SS+SS (ou com ' no lugar do +)
 */
export function displayToSeconds(value: string): { seconds: number; period: MatchPeriod } | null {
  const trimmed = value.trim()

  if (/^\d+$/.test(trimmed)) {
    const sec = Math.max(0, parseInt(trimmed, 10))
    return { seconds: sec, period: inferMatchTimeFromSeconds(sec).period }
  }

  // Captura os grupos da string considerando o sinal de '+' ou "'"
  const match = trimmed.match(/^(\d+):(\d+)(?:[+'](\d+):(\d+)|[+'](\d+))?$/)
  if (!match) return null

  const baseMin = parseInt(match[1], 10)
  const baseSec = parseInt(match[2], 10)
  if (baseSec > 59) return null

  const baseSeconds = baseMin * 60 + baseSec
  let addSeconds = 0

  if (match[3] !== undefined && match[4] !== undefined) {
    const addMin = parseInt(match[3], 10)
    const addS = parseInt(match[4], 10)
    if (addS > 59) return null
    addSeconds = addMin * 60 + addS
  } else if (match[5] !== undefined) {
    addSeconds = parseInt(match[5], 10)
  }

  const totalSeconds = baseSeconds + addSeconds
  let period = MatchPeriod.FIRST_HALF

  // Inferência automática de Período baseada no input
  if (addSeconds > 0) {
    if (baseSeconds === 2700) period = MatchPeriod.FIRST_HALF
    else if (baseSeconds === 5400) period = MatchPeriod.SECOND_HALF
    else if (baseSeconds === 6300) period = MatchPeriod.EXTRA_FIRST
    else if (baseSeconds === 7200) period = MatchPeriod.EXTRA_SECOND
    else return null // Acréscimos só são permitidos nos limites exatos dos períodos
  } else {
    if (baseSeconds <= 2700) period = MatchPeriod.FIRST_HALF
    else if (baseSeconds > 2700 && baseSeconds <= 5400) period = MatchPeriod.SECOND_HALF
    else if (baseSeconds > 5400 && baseSeconds <= 6300) period = MatchPeriod.EXTRA_FIRST
    else if (baseSeconds > 6300) period = MatchPeriod.EXTRA_SECOND
  }

  return { seconds: totalSeconds, period }
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
