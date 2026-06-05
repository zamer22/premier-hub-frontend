export type LeaderboardGame = "all" | "wordle" | "missing_xi" | "lab";
export type LeaderboardPeriod = "all" | "week" | "month";

export type LeaderboardItem = {
  rank: number;
  id_usuario: number;
  username: string;
  foto_perfil: string | null;
  total_points: number;
  games_played: number;
  total_score: number;
  max_score: number;
  accuracy: number;
  last_played_at: string | null;
  favorite_game: string | null;
};

type LeaderboardResponse = {
  success: boolean;
  data?: LeaderboardItem[];
  me?: LeaderboardItem | null;
  meta?: {
    game: LeaderboardGame;
    period: LeaderboardPeriod;
    limit: number;
    count: number;
    source: string;
  };
  error?: string;
  detail?: string;
};

type FetchLeaderboardParams = {
  game: LeaderboardGame;
  period: LeaderboardPeriod;
  limit?: number;
  signal?: AbortSignal;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function fetchArcadeLeaderboard({
  game,
  period,
  limit = 50,
  signal,
}: FetchLeaderboardParams) {
  const params = new URLSearchParams({
    game,
    period,
    limit: String(limit),
  });

  const response = await fetch(`${API_URL}/api/leaderboard/arcade?${params}`, {
    credentials: "include",
    signal,
  });
  const json = (await response.json()) as LeaderboardResponse;

  if (!response.ok || !json.success) {
    throw new Error(json.detail || json.error || "No se pudo cargar la tabla de clasificación");
  }

  return {
    data: json.data || [],
    me: json.me || null,
    meta: json.meta,
  };
}
