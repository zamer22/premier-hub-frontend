import type {
  H2HRow,
  LineupRow,
  LiveActivation,
  LiveChatMessage,
  LiveConfig,
  LiveEvent,
  LiveMatch,
  LiveMatchApi,
  StatRow,
  StatSnapshotRow,
} from "./liveTypes";
import { mapLiveMatch } from "./liveTypes";

const API_URL = import.meta.env.VITE_API_URL;

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
  reward_points?: number;
  is_correct?: boolean;
  saldo?: number | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const json = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Error HTTP ${res.status}`);
  }

  return json.data;
}

export async function getLiveMatches(): Promise<LiveMatch[]> {
  const data = await request<LiveMatchApi[]>("/api/partidos/live");
  return data.map(mapLiveMatch);
}

export const liveApi = {
  getConfig: () => request<LiveConfig>("/api/partidos/live/config"),
  getLiveMatches,
  getLineups: (fixtureId: number) => request<LineupRow[]>(`/api/partidos/live/${fixtureId}/lineups`),
  getStats: (fixtureId: number) => request<StatRow[]>(`/api/partidos/live/${fixtureId}/stats`),
  getStatSnapshots: (fixtureId: number) =>
    request<StatSnapshotRow[]>(`/api/partidos/live/${fixtureId}/stat-snapshots`),
  getEvents: (fixtureId: number) => request<LiveEvent[]>(`/api/partidos/live/${fixtureId}/events`),
  getH2H: (fixtureId: number) => request<H2HRow[]>(`/api/partidos/live/${fixtureId}/h2h`),
  getActivations: (fixtureId: number, minute: number | null) =>
    request<LiveActivation[]>(`/api/partidos/live/${fixtureId}/activations${minute !== null ? `?minute=${minute}` : ""}`),
  getActivationHistory: (fixtureId: number, minute: number | null) =>
    request<LiveActivation[]>(`/api/partidos/live/${fixtureId}/activations/history${minute !== null ? `?minute=${minute}` : ""}`),
  claimActivation: async (fixtureId: number, activationId: number, selectedOption?: string | null) => {
    const res = await fetch(`${API_URL}/api/partidos/live/${fixtureId}/activations/${activationId}/claim`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_option: selectedOption ?? null }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.error || `Error HTTP ${res.status}`);
    }

    return json as {
      success: true;
      data: unknown;
      reward_points: number;
      is_correct: boolean;
      saldo: number | null;
    };
  },
  getChat: (fixtureId: number) => request<LiveChatMessage[]>(`/api/partidos/live/${fixtureId}/chat`),
  sendChat: (fixtureId: number, message: string) =>
    request<LiveChatMessage>(`/api/partidos/live/${fixtureId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};
