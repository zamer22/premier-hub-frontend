export interface LiveMatch {
  id: number;
  league: string;
  minute: string;
  stadium: string;
  status: string;
  isDemo?: boolean;
  homeTeam: { name: string; logo: string; score: number };
  awayTeam: { name: string; logo: string; score: number };
}

export interface LiveMatchApi {
  id: number;
  league: string;
  minute: string;
  stadium: string;
  status: string;
  is_demo?: boolean;
  home_name: string;
  home_logo: string;
  home_score: number;
  away_name: string;
  away_logo: string;
  away_score: number;
}

export interface LineupRow {
  fixture_id: number;
  team: "home" | "away";
  player_number: number | null;
  player_name: string;
  player_grid: string | null;
  player_position?: string | null;
  is_sub: boolean;
  substitution_status?: "in" | "out";
  substitution_minute?: number;
}

export interface StatRow {
  fixture_id: number;
  label: string;
  home_value: string;
  away_value: string;
}

export interface StatSnapshotRow extends StatRow {
  minute: number;
}

export interface H2HRow {
  fixture_id: number;
  date: string;
  league: string;
  status: string;
  home: {
    id: number;
    name: string;
    logo: string;
    goals: number;
  };
  away: {
    id: number;
    name: string;
    logo: string;
    goals: number;
  };
}

export interface LiveChatMessage {
  id: number;
  fixture_id: number;
  id_usuario: number;
  username: string;
  message: string;
  created_at: string;
}

export interface LiveEvent {
  id?: number;
  fixture_id: number;
  minute: number | null;
  extra?: number | null;
  display_minute?: string;
  team?: "home" | "away" | null;
  team_name?: string;
  player?: string | null;
  assist?: string | null;
  type: string;
  detail: string;
  comments?: string | null;
}

export interface SubstitutionItem {
  team: "home" | "away";
  minute: number | null;
  displayMinute: string;
  playerIn: string;
  playerOut: string;
  numberIn: number | null;
  numberOut: number | null;
}

export interface ActivationOption {
  id: string;
  label: string;
}

export interface LiveActivation {
  id: number;
  fixture_id: number;
  type: "poll" | "drop";
  title: string;
  description: string | null;
  payload: {
    options?: ActivationOption[];
    correct_option?: string;
    event_minute?: number;
    event_type?: string;
  };
  reward_points: number;
  starts_at_minute: number;
  expires_at_minute: number;
  status: string;
  claimed?: boolean;
  claim?: {
    selected_option: string | null;
    is_correct: boolean;
    reward_points: number;
    claimed_at: string;
  } | null;
}

export interface ChatEmoteConfig {
  token: string;
  label: string;
  src: string;
  kind: "emote" | "sticker";
  sort_order: number;
}

export interface LiveConfig {
  statLabels: Array<{
    api_label: string;
    display_label: string;
    sort_order: number;
  }>;
  chatEmotes: ChatEmoteConfig[];
  settings: Record<string, unknown>;
}

export function mapLiveMatch(item: LiveMatchApi): LiveMatch {
  return {
    id: item.id,
    league: item.league,
    minute: item.minute,
    stadium: item.stadium,
    status: item.status,
    isDemo: Boolean(item.is_demo),
    homeTeam: { name: item.home_name, logo: item.home_logo, score: item.home_score ?? 0 },
    awayTeam: { name: item.away_name, logo: item.away_logo, score: item.away_score ?? 0 },
  };
}
