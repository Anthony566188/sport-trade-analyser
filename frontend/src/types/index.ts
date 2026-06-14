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

/** Timeline Event entity */
export type EventType =
  | 'GOAL'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'CORNER'
  | 'SUBSTITUTION'
  | 'PENALTY'
  | 'OFFSIDE'
  | 'FOUL'
  | 'VAR';

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

/** Bet entity */
export type BetType = 'BACK' | 'LAY';

export interface Bet {
  id: number;
  id_method: number;
  stake: number;
  entry_odd: number;
  exit_odd: number | null;
  type: BetType;
  profit_in_money: number | null;
}

// ─── API / UI Helpers ────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}

/** Shape returned by the team search endpoint */
export type TeamSearchResult = Team[];

/** Theme mode */
export type ThemeMode = 'light' | 'dark';
