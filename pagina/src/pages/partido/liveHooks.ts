import { useCallback, useEffect, useMemo, useState } from "react";
import { liveApi } from "./liveApi";
import type {
  H2HRow,
  LineupRow,
  LiveActivation,
  LiveChatMessage,
  LiveConfig,
  LiveEvent,
  LiveMatch,
  StatRow,
  StatSnapshotRow,
} from "./liveTypes";

type ResourceState<T> = {
  data: T[];
  loading: boolean;
  error: string;
};

const emptyResource = <T,>(): ResourceState<T> => ({ data: [], loading: true, error: "" });

function getNumberSetting(settings: Record<string, unknown>, key: string, fallback: number) {
  const value = settings[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object" && value !== null && "ms" in value) {
    const ms = Number((value as { ms?: unknown }).ms);
    if (Number.isFinite(ms)) return ms;
  }
  return fallback;
}

export function useLiveConfig() {
  const [config, setConfig] = useState<LiveConfig>({
    statLabels: [],
    chatEmotes: [],
    settings: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    liveApi.getConfig()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "No se pudo cargar la configuración live.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const statLabels = useMemo(
    () => new Map(config.statLabels.map((item) => [item.api_label, item.display_label])),
    [config.statLabels],
  );

  return {
    config,
    statLabels,
    loading,
    error,
    demoSpeedMs: getNumberSetting(config.settings, "demo_speed_ms", 2000),
    detailsRefreshMs: getNumberSetting(config.settings, "details_refresh_ms", 60000),
    eventsRefreshMs: getNumberSetting(config.settings, "events_refresh_ms", 15000),
    lineupsRefreshMs: getNumberSetting(config.settings, "lineups_refresh_ms", 180000),
    chatRefreshMs: getNumberSetting(config.settings, "chat_refresh_ms", 5000),
    liveSummaryRefreshMs: getNumberSetting(config.settings, "live_summary_refresh_ms", 15000),
  };
}

export function useDemoClock(isDemo: boolean, speedMs: number) {
  const [demoMinute, setDemoMinute] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);

  useEffect(() => {
    if (!isDemo || !demoRunning) return;

    const interval = window.setInterval(() => {
      setDemoMinute((current) => {
        if (current >= 90) {
          setDemoRunning(false);
          return 90;
        }
        return current + 1;
      });
    }, speedMs);

    return () => window.clearInterval(interval);
  }, [demoRunning, isDemo, speedMs]);

  const resetDemo = useCallback(() => {
    setDemoRunning(false);
    setDemoMinute(0);
  }, []);

  return {
    demoMinute,
    demoRunning,
    setDemoRunning,
    resetDemo,
  };
}

export function useLiveDetails(matchId: number, isDemo: boolean, refresh: {
  detailsRefreshMs: number;
  eventsRefreshMs: number;
  lineupsRefreshMs: number;
}) {
  const [lineups, setLineups] = useState<ResourceState<LineupRow>>(emptyResource);
  const [stats, setStats] = useState<ResourceState<StatRow>>(emptyResource);
  const [h2h, setH2H] = useState<ResourceState<H2HRow>>(emptyResource);
  const [events, setEvents] = useState<ResourceState<LiveEvent>>(emptyResource);
  const [statSnapshots, setStatSnapshots] = useState<ResourceState<StatSnapshotRow>>(emptyResource);

  const loadLineups = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLineups((current) => ({ ...current, loading: true }));
      const data = await liveApi.getLineups(matchId);
      setLineups({ data, loading: false, error: "" });
    } catch (err: any) {
      setLineups({ data: [], loading: false, error: err?.message || "No se pudieron cargar las alineaciones." });
    }
  }, [matchId]);

  const loadStats = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setStats((current) => ({ ...current, loading: true }));
      const data = await liveApi.getStats(matchId);
      setStats({ data, loading: false, error: "" });
    } catch (err: any) {
      setStats({ data: [], loading: false, error: err?.message || "No se pudieron cargar las estadísticas." });
    }
  }, [matchId]);

  const loadEvents = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setEvents((current) => ({ ...current, loading: true }));
      const data = await liveApi.getEvents(matchId);
      setEvents({ data, loading: false, error: "" });
    } catch (err: any) {
      setEvents({ data: [], loading: false, error: err?.message || "No se pudieron cargar los eventos." });
    }
  }, [matchId]);

  const loadH2H = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setH2H((current) => ({ ...current, loading: true }));
      const data = await liveApi.getH2H(matchId);
      setH2H({ data, loading: false, error: "" });
    } catch (err: any) {
      setH2H({ data: [], loading: false, error: err?.message || "No se pudo cargar el H2H." });
    }
  }, [matchId]);

  const loadStatSnapshots = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setStatSnapshots((current) => ({ ...current, loading: true }));
      const data = await liveApi.getStatSnapshots(matchId);
      setStatSnapshots({ data, loading: false, error: "" });
    } catch (err: any) {
      setStatSnapshots({ data: [], loading: false, error: err?.message || "No se pudieron cargar los snapshots." });
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    loadLineups(true);
    loadStats(true);
    loadEvents(true);
    loadH2H(true);
    loadStatSnapshots(true);
  }, [loadEvents, loadH2H, loadLineups, loadStatSnapshots, loadStats, matchId]);

  useEffect(() => {
    if (!matchId || isDemo) return;

    const statsInterval = window.setInterval(() => loadStats(false), refresh.detailsRefreshMs);
    const lineupsInterval = window.setInterval(() => loadLineups(false), refresh.lineupsRefreshMs);
    const eventsInterval = window.setInterval(() => loadEvents(false), refresh.eventsRefreshMs);

    return () => {
      window.clearInterval(statsInterval);
      window.clearInterval(lineupsInterval);
      window.clearInterval(eventsInterval);
    };
  }, [isDemo, loadEvents, loadLineups, loadStats, matchId, refresh.detailsRefreshMs, refresh.eventsRefreshMs, refresh.lineupsRefreshMs]);

  return {
    lineups,
    stats,
    h2h,
    events,
    statSnapshots,
  };
}

export function useLiveActivations(matchId: number, minute: number | null) {
  const [activeActivation, setActiveActivation] = useState<LiveActivation | null>(null);
  const [activationHistory, setActivationHistory] = useState<LiveActivation[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadActivations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      const [active, history] = await Promise.all([
        liveApi.getActivations(matchId, minute),
        liveApi.getActivationHistory(matchId, minute),
      ]);
      setActiveActivation(active[0] ?? null);
      setActivationHistory(history);
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar las activaciones.");
    } finally {
      setLoading(false);
    }
  }, [matchId, minute]);

  useEffect(() => {
    if (!matchId) return;
    loadActivations(false);
  }, [loadActivations, matchId]);

  const claim = useCallback(async (selectedOption?: string | null) => {
    if (!activeActivation || claiming) return;

    try {
      setClaiming(true);
      setError("");
      setToast("");
      const result = await liveApi.claimActivation(matchId, activeActivation.id, selectedOption);
      setToast(Number(result.reward_points) > 0 ? `Ganaste ${result.reward_points} puntos` : "Participación registrada");
      setActiveActivation(null);
      await loadActivations(false);
    } catch (err: any) {
      setError(err?.message || "No se pudo reclamar la activación.");
    } finally {
      setClaiming(false);
    }
  }, [activeActivation, claiming, loadActivations, matchId]);

  return {
    activeActivation,
    activationHistory,
    activationLoading: loading,
    activationClaiming: claiming,
    activationError: error,
    activationToast: toast,
    setActivationToast: setToast,
    claimActivation: claim,
  };
}

export function useLiveChat(matchId: number, refreshMs: number) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    const loadChat = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        setError("");
        const data = await liveApi.getChat(matchId);
        if (!cancelled) setMessages(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "No se pudo cargar el chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadChat(true);
    const interval = window.setInterval(() => loadChat(false), refreshMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [matchId, refreshMs]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message || sending) return;

    try {
      setSending(true);
      setError("");
      const data = await liveApi.sendChat(matchId, message);
      setMessages((current) => [...current, data]);
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }, [matchId, sending]);

  return {
    chatMessages: messages,
    chatLoading: loading,
    chatSending: sending,
    chatError: error,
    setChatError: setError,
    sendMessage,
  };
}

export function useLiveSummary(match: LiveMatch, isDemo: boolean, refreshMs: number) {
  const [liveSnapshot, setLiveSnapshot] = useState<LiveMatch | null>(null);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;

    const refreshLiveSummary = async () => {
      try {
        const matches = await liveApi.getLiveMatches();
        const found = matches.find((item) => Number(item.id) === Number(match.id));
        if (!found || cancelled) return;
        setLiveSnapshot(found);
      } catch {
        // Keep the last known score if the live refresh fails.
      }
    };

    refreshLiveSummary();
    const interval = window.setInterval(refreshLiveSummary, refreshMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isDemo, match.id, refreshMs]);

  return liveSnapshot;
}
