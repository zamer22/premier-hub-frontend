export type OffseasonTab = "transfer" | "simulator" | "rewind";

// ── Transfer Predictor ────────────────────────────────────────────────────────

export interface PLPlayer {
  id: number;
  name: string;
  age: number;
  position: string;
  current_club_id: number;
  current_club_name: string;
  goals_per90: number;
  assists_per90: number;
  minutes_played: number;
}

export interface PLClub {
  id: number;
  name: string;
}

export interface TransferResult {
  probability: number;
  fit_score: "Low" | "Medium" | "High";
  reasons: string[];
}

export interface TransferHistoryEntry {
  player: PLPlayer;
  target_club: PLClub;
  result: TransferResult;
}

// ── Season Simulator ──────────────────────────────────────────────────────────

export interface HypotheticalTransfer {
  player: PLPlayer;
  from_club: PLClub;
  to_club: PLClub;
}

export interface SimulatedClubRow {
  position: number;
  club: string;
  club_id: number;
  title_odds_delta: number;
}

export interface SimulationResult {
  table: SimulatedClubRow[];
}

// ── Classic Match Rewind ──────────────────────────────────────────────────────

export interface HistoricMatch {
  id: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  date: string;
  season: string;
}

export interface LineupPlayer {
  id: number;
  name: string;
  pos: string;
  number?: number;
}

export interface RewindModification {
  type: "remove_player" | "change_substitution";
  player_id: number;
  player_name: string;
  team: "home" | "away";
  minute?: number;
}

export interface KeyChange {
  description: string;
  xg_delta: number;
}

export interface RewindResult {
  original_score: { home: number; away: number };
  predicted_score: { home: number; away: number };
  key_changes: KeyChange[];
  no_change: boolean;
}

// ── Iconic-match preview shapes (lo que devuelve /api/ml/match/:id) ───────────

export type EventKind =
  | "goal" | "penalty" | "own_goal" | "red_card"
  | "missed_penalty" | "yellow_card" | "substitution" | "var";

export interface MatchEvent {
  id: string;
  minute: number;
  team: "home" | "away";
  team_name: string;
  player_name: string;
  kind: EventKind;
  removable: boolean;
  label: string;
  detail: string;
}

export interface TeamInfo {
  id: number;
  name: string;
}

export interface MatchPreview {
  fixture_id: number;
  home_team: TeamInfo;
  away_team: TeamInfo;
  score: { home: number; away: number };
  match_minutes: number;
  events: MatchEvent[];
}

export interface IconicMatch {
  fixture_id: number;
  label: string;
}
