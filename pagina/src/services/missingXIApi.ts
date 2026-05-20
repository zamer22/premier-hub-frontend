import type { AttemptRow, MissingXIMatch, MissingXIPlayer } from "../types/missingXI";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  detail?: string;
};

type ApiTeam = {
  id: number;
  name: string;
  logo: string | null;
};

type ApiPlayer = {
  id: string;
  apiPlayerId: number;
  apiTeamId: number;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  answer: string;
  number: number | null;
  position: string;
  line: MissingXIPlayer["line"];
  xPercent: number;
  yPercent: number;
  photoUrl: string | null;
  guessed: boolean;
  failed: boolean;
  usedHint: boolean;
  attempts: AttemptRow[];
};

type ApiAttempt = {
  score: number;
  dinero_ganado: number;
  submitted_players: Partial<MissingXIPlayer>[];
  created_at: string;
};

type ApiChallenge = {
  id: string;
  challengeDate: string;
  league: {
    id: number;
    name: string;
    season: number;
    seasonLabel: string;
  };
  fixture: {
    date: string;
    homeTeam: ApiTeam;
    awayTeam: ApiTeam;
    homeGoals: number;
    awayGoals: number;
    winner: {
      id: number;
      name: string;
      side: "home" | "away";
    };
    formation: string;
  };
  players: ApiPlayer[];
  played?: boolean;
  attempt?: ApiAttempt | null;
};

type SubmitMissingXIResponse = {
  score: number;
  dinero_ganado: number;
  nuevo_saldo?: number;
  submitted_players: Partial<MissingXIPlayer>[];
};

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "Jugador",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : displayName,
  };
}

function formatFixtureDate(value: string) {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoDate) return value;

  return `${isoDate[3]}-${isoDate[2]}-${isoDate[1]}`;
}

function mapPlayer(player: ApiPlayer): MissingXIPlayer {
  const fallbackName = splitDisplayName(player.displayName);

  return {
    id: player.id,
    apiPlayerId: player.apiPlayerId,
    apiTeamId: player.apiTeamId,
    firstName: player.firstName || fallbackName.firstName,
    lastName: player.lastName || fallbackName.lastName,
    displayName: player.displayName,
    answer: player.answer.toUpperCase(),
    number: player.number,
    position: player.position,
    line: player.line,
    xPercent: player.xPercent,
    yPercent: player.yPercent,
    photoUrl: player.photoUrl,
    guessed: player.guessed === true,
    failed: player.failed === true,
    usedHint: player.usedHint === true,
    attempts: Array.isArray(player.attempts) ? player.attempts : [],
  };
}

function mapChallenge(challenge: ApiChallenge): MissingXIMatch {
  return {
    id: challenge.id,
    league: challenge.league.name,
    season: challenge.league.seasonLabel || String(challenge.league.season),
    date: formatFixtureDate(challenge.fixture.date),
    homeTeam: challenge.fixture.homeTeam.name,
    awayTeam: challenge.fixture.awayTeam.name,
    homeScore: challenge.fixture.homeGoals,
    awayScore: challenge.fixture.awayGoals,
    winner: challenge.fixture.winner.name,
    formation: challenge.fixture.formation,
    players: challenge.players.map(mapPlayer),
    played: challenge.played === true,
    attempt: challenge.attempt || null,
  };
}

export function resetMissingXIProgress(match: MissingXIMatch): MissingXIMatch {
  return {
    ...match,
    players: match.players.map((player) => ({
      ...player,
      guessed: false,
      failed: false,
      usedHint: false,
      attempts: [],
    })),
  };
}

export async function fetchDailyMissingXI(signal?: AbortSignal): Promise<MissingXIMatch> {
  const response = await fetch(`${API_URL}/api/missing-xi/daily`, {
    credentials: "include",
    signal,
  });
  const json = (await response.json()) as ApiResponse<ApiChallenge>;

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.detail || json.error || "No se pudo cargar el reto diario");
  }

  return mapChallenge(json.data);
}

export async function submitMissingXI(
  challengeId: string,
  players: MissingXIPlayer[]
): Promise<SubmitMissingXIResponse> {
  const response = await fetch(`${API_URL}/api/missing-xi/submit`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      challenge_id: challengeId,
      players: players.map((player) => ({
        id: player.id,
        guessed: player.guessed,
        failed: player.failed,
        usedHint: player.usedHint,
        attempts: player.attempts,
      })),
    }),
  });
  const json = (await response.json()) as ApiResponse<SubmitMissingXIResponse>;

  if (!response.ok || !json.success || !json.data) {
    const error = new Error(json.detail || json.error || "No se pudo guardar el intento");
    (error as Error & { status?: number; data?: SubmitMissingXIResponse }).status = response.status;
    (error as Error & { status?: number; data?: SubmitMissingXIResponse }).data = json.data;
    throw error;
  }

  return json.data;
}
