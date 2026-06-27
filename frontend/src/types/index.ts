// ─── Domain Types ────────────────────────────────────────────────────────────

/** Team returned by GET /championships/{id}/teams/search */
export interface Team {
  id: string | number;
  name: string;
  /** Optional logo or country flag URL */
  logo?: string;
}

/** Championship option returned by GET /championships (assumed structure) */
export interface Championship {
  id: number;
  name: string;
}

/** Match entity */
export interface Match {
  id: number;
  team_home: string;
  team_away: string;
  home_goals: number;
  away_goals: number;
  championship: string | null;
  date: string; // YYYY-MM-DD
  is_neutral_field: boolean;
  is_friendly: boolean;
}

/** Timeline entity */
export interface Timeline {
  id: number;
  id_match: number;
  match_period_started: MatchPeriod;
  minute_second_started: number;
  additional_minute_second_started: number | null;
  match_period_finished: MatchPeriod | null;
  minute_second_finished: number | null;
  additional_minute_second_finished: number | null;
}

// Enum estrito refletindo o backend
export enum EventType {
  YELLOW_CARD = 'YELLOW_CARD',
  RED_CARD = 'RED_CARD',
  GOAL = 'GOAL',
  CORNER = 'CORNER',
  FOUL_DEFENSIVE_HALF = 'FOUL_DEFENSIVE_HALF',
  FOUL_ATTACKING_HALF = 'FOUL_ATTACKING_HALF',
  ANNULLED_GOAL = 'ANNULLED_GOAL',
  HIT_WOODWORK = 'HIT_WOODWORK',
  GOALKEEPER_SAVE = 'GOALKEEPER_SAVE',
  PENALTY = 'PENALTY',
}

// Record de mapeamento para a UI
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.YELLOW_CARD]:        'Cartão Amarelo',
  [EventType.RED_CARD]:           'Cartão Vermelho',
  [EventType.GOAL]:               'Gol',
  [EventType.CORNER]:             'Escanteio',
  [EventType.FOUL_DEFENSIVE_HALF]: 'Falta (Campo de Defesa)',
  [EventType.FOUL_ATTACKING_HALF]: 'Falta (Campo de Ataque)',
  [EventType.ANNULLED_GOAL]:      'Gol Anulado',
  [EventType.HIT_WOODWORK]:       'Bola na Trave',
  [EventType.GOALKEEPER_SAVE]:    'Defesa do Goleiro',
  [EventType.PENALTY]:            'Pênalti',
};

// Enum estrito refletindo o backend (MatchPeriod)
export enum MatchPeriod {
  FIRST_HALF = '1H',
  HALF_TIME = 'HT',
  SECOND_HALF = '2H',
  EXTRA_FIRST = 'E1',
  EXTRA_SECOND = 'E2',
}

// Record de mapeamento para a UI (Tradução amigável)
export const MATCH_PERIOD_LABELS: Record<MatchPeriod, string> = {
  [MatchPeriod.FIRST_HALF]: '1º Tempo',
  [MatchPeriod.HALF_TIME]: 'Intervalo',
  [MatchPeriod.SECOND_HALF]: '2º Tempo',
  [MatchPeriod.EXTRA_FIRST]: '1º Tempo Prorrogação',
  [MatchPeriod.EXTRA_SECOND]: '2º Tempo Prorrogação',
};

// ─── Request DTOs (Payloads de Escrita Consolidados) ───────────────────────

export interface TimelineRequestPayload {
  id_match: number;
  match_period_started: MatchPeriod;
  minute_second_started: number;
  additional_minute_second_started?: number;
}

export interface TimelineEventRequestPayload {
  id_criterion?: number | null;
  id_timeline: number;
  event?: EventType | null;
  match_period: MatchPeriod;
  minute_second: number;
  additional_minute_second?: number;
  team: string;
}

export interface UpdateTimelineEventRequestPayload {
  id_criterion?: number | null;
  event?: EventType | null;
  match_period: MatchPeriod;
  minute_second: number;
  additional_minute_second?: number;
  team: string;
}

export interface BetRequestPayload {
  id_method: number;
  id_match: number;
  stake: number;
  entry_odd: number;
  type: BetType;
  entry_period: MatchPeriod;
  entry_minute_second: number;
  entry_additional_minute_second?: number;
}

export interface UpdateBetRequestPayload {
  id_method: number;
  id_match: number;
  stake: number;
  entry_odd: number;
  type: BetType;
  exit_odd?: number | null;
  entry_period: MatchPeriod;
  entry_minute_second: number;
  entry_additional_minute_second?: number;
  exit_period?: MatchPeriod | null;
  exit_minute_second?: number | null;
  exit_additional_minute_second?: number;
}

export interface BetExitRequestPayload {
  exit_odd: number;
  exit_period: MatchPeriod;
  exit_minute_second: number;
  exit_additional_minute_second?: number;
}

// ─── Entities ───────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: number;
  id_timeline: number;
  id_criterion: number | null;
  event: EventType | null;
  match_period: MatchPeriod;
  minute_second: number;
  additional_minute_second: number | null;
  team: string;
}

export interface Criterion {
  id: number;
  title: string;
  description?: string;
}

export interface Method {
  id: number;
  name: string;
}

export type BetType = 'BACK' | 'LAY';

export interface Bet {
  id: number;
  id_method: number;
  id_match: number;
  stake: number;
  entry_odd: number;
  exit_odd: number | null;
  type: BetType;
  date: string; 
  
  // Trinca de Entrada
  entry_period: MatchPeriod;
  entry_minute_second: number;
  entry_additional_minute_second: number | null; 
  
  // Trinca de Saída
  exit_period: MatchPeriod | null;
  exit_minute_second: number | null;
  exit_additional_minute_second: number | null;
}

// ─── API / UI Helpers ────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}

export type TeamSearchResult = Team[];
export type ThemeMode = 'light' | 'dark';