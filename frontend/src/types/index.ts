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
  minute_second_started: number;
  minute_second_finished: number | null;
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

// Reflete a classe TimelineEventRequest do Python
export interface TimelineEventRequestPayload {
  id_criterion?: number | null;
  id_timeline: number;
  id_bet?: number | null;
  event?: EventType | null;
  minute_second: number;
  additional_minute_second?: number | null;
  description?: string | null;
  team: string;
}

export interface TimelineEvent {
  id: number;
  id_timeline: number;
  id_criterion: number | null;
  id_bet: number | null;
  event: EventType | null;
  minute_second: number;
  additional_minute_second: number | null;
  team: string;
}

/** Criterion entity */
export interface Criterion {
  id: number;
  title: string;
  description?: string;
}

/** Method entity */
export interface Method {
  id: number;
  name: string;
}

/** Bet entity — espelha o retorno do backend */
export type BetType = 'BACK' | 'LAY';

// Reflete a classe BetRequest do Python
export interface BetRequestPayload {
  id_method: number;
  stake: number;
  entry_odd: number;
  type: BetType;
}

export interface Bet {
  id: number;
  id_method: number;
  stake: number;
  entry_odd: number;
  exit_odd: number | null;
  type: BetType;
  date: string;
  profit_in_money: number | null;
  exit_minute_second?: number | null;           
  exit_additional_minute_second?: number | null;
}

// Reflete a classe UpdateBetRequest do Python
export interface UpdateBetRequestPayload {
  id_method: number;
  stake: number;
  entry_odd: number;
  type: BetType;
  exit_odd?: number | null;
  exit_minute_second?: number | null;          
  exit_additional_minute_second?: number | null;
}

// ─── API / UI Helpers ────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}

/** Shape returned by the team search endpoint */
export type TeamSearchResult = Team[];

/** Theme mode */
export type ThemeMode = 'light' | 'dark';