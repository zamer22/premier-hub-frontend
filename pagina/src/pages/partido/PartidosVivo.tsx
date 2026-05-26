import { type CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./PartidosVivo.css";
import {
  useDemoClock,
  useLiveActivations,
  useLiveChat,
  useLiveConfig,
  useLiveDetails,
  useLiveSummary,
} from "./liveHooks";
import type {
  ChatEmoteConfig,
  H2HRow,
  LineupRow,
  LiveEvent,
  LiveMatch,
  StatRow,
  StatSnapshotRow,
  SubstitutionItem,
} from "./liveTypes";

interface PartidosVivoProps {
  match: LiveMatch;
  onBack: () => void;
  user: any;
}
const TABS = ["Alineaciones", "Estadisticas", "H2H"];

function parseGrid(value: string | null): { row: number; col: number } | null {
  if (!value) return null;

  const [row, col] = value.split(":").map(Number);
  if (!row || !col || Number.isNaN(row) || Number.isNaN(col)) return null;

  return { row, col };
}

function extractMinute(value: string): number | null {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function getDemoStatus(minute: number) {
  if (minute <= 0) return "Not Started";
  if (minute < 45) return "First Half";
  if (minute === 45) return "Half Time";
  if (minute < 90) return "Second Half";
  return "Full Time";
}

function getDemoMinuteLabel(minute: number) {
  if (minute <= 0) return "0'";
  if (minute === 45) return "HT";
  if (minute >= 90) return "FT";
  return `${minute}'`;
}

function getDemoScores(events: LiveEvent[], minute: number) {
  return events.reduce(
    (score, event) => {
      if ((event.minute ?? 0) > minute || event.type !== "Goal") return score;
      if (event.team === "home") score.home += 1;
      if (event.team === "away") score.away += 1;
      return score;
    },
    { home: 0, away: 0 },
  );
}

function getDemoStats(snapshots: StatSnapshotRow[], minute: number) {
  const snapshotMinutes = Array.from(new Set(snapshots.map((item) => item.minute)));
  const checkpointMinute = [...snapshotMinutes]
    .reverse()
    .find((currentMinute) => minute >= currentMinute);

  if (checkpointMinute === undefined) return [];
  return snapshots.filter((item) => item.minute === checkpointMinute);
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getEventSide(event: LiveEvent, match: LiveMatch): "home" | "away" | null {
  if (event.team === "home" || event.team === "away") return event.team;

  const eventTeam = normalizeText(event.team_name);
  if (!eventTeam) return null;

  if (eventTeam === normalizeText(match.homeTeam.name)) return "home";
  if (eventTeam === normalizeText(match.awayTeam.name)) return "away";
  return null;
}

function isSubstitutionEvent(event: LiveEvent) {
  return event.type.toLowerCase() === "subst";
}

function isCardEvent(event: LiveEvent, color: "yellow" | "red") {
  if (event.type !== "Card") return false;

  const detail = normalizeText(event.detail);
  if (color === "yellow") return detail.includes("yellow") || detail.includes("amarilla");
  return detail.includes("red") || detail.includes("roja");
}

function formatEventMinuteValue(event: LiveEvent) {
  if (event.display_minute) return event.display_minute;
  if (!event.minute) return "";
  return `${event.minute}${event.extra ? `+${event.extra}` : ""}'`;
}

function findPlayerIndex(lineups: LineupRow[], team: "home" | "away", name: string | null | undefined) {
  const target = normalizeText(name);
  if (!target) return -1;
  return lineups.findIndex((player) => player.team === team && normalizeText(player.player_name) === target);
}

function resolveSubstitution(
  lineups: LineupRow[],
  event: LiveEvent,
  team: "home" | "away",
) {
  const firstName = event.player ?? "";
  const secondName = event.assist ?? "";
  const firstIndex = findPlayerIndex(lineups, team, firstName);
  const secondIndex = findPlayerIndex(lineups, team, secondName);
  const first = firstIndex >= 0 ? lineups[firstIndex] : null;
  const second = secondIndex >= 0 ? lineups[secondIndex] : null;

  if (first && second && first.is_sub !== second.is_sub) {
    return first.is_sub
      ? { inName: firstName, outName: secondName, inIndex: firstIndex, outIndex: secondIndex }
      : { inName: secondName, outName: firstName, inIndex: secondIndex, outIndex: firstIndex };
  }

  if (first && !second) {
    return first.is_sub
      ? { inName: firstName, outName: secondName, inIndex: firstIndex, outIndex: -1 }
      : { inName: secondName, outName: firstName, inIndex: -1, outIndex: firstIndex };
  }

  if (!first && second) {
    return second.is_sub
      ? { inName: secondName, outName: firstName, inIndex: secondIndex, outIndex: -1 }
      : { inName: firstName, outName: secondName, inIndex: -1, outIndex: secondIndex };
  }

  return { inName: firstName, outName: secondName, inIndex: firstIndex, outIndex: secondIndex };
}

function applyEventLineupChanges(lineups: LineupRow[], events: LiveEvent[], match: LiveMatch) {
  const nextLineups = lineups.map((player) => ({ ...player }));
  const substitutions: SubstitutionItem[] = [];

  const orderedSubstitutions = [...events]
    .filter(isSubstitutionEvent)
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  for (const event of orderedSubstitutions) {
    const team = getEventSide(event, match);
    if (!team) continue;

    const resolved = resolveSubstitution(nextLineups, event, team);
    if (!resolved.inName && !resolved.outName) continue;

    const outPlayer = resolved.outIndex >= 0 ? nextLineups[resolved.outIndex] : null;
    const inPlayer = resolved.inIndex >= 0 ? nextLineups[resolved.inIndex] : null;
    const inheritedGrid = outPlayer?.player_grid ?? inPlayer?.player_grid ?? null;

    if (outPlayer) {
      nextLineups[resolved.outIndex] = {
        ...outPlayer,
        is_sub: true,
        player_grid: null,
        substitution_status: "out",
        substitution_minute: event.minute ?? undefined,
      };
    }

    if (inPlayer) {
      nextLineups[resolved.inIndex] = {
        ...inPlayer,
        is_sub: false,
        player_grid: inheritedGrid,
        substitution_status: "in",
        substitution_minute: event.minute ?? undefined,
      };
    }

    substitutions.push({
      team,
      minute: event.minute,
      displayMinute: formatEventMinuteValue(event),
      playerIn: resolved.inName || "Jugador",
      playerOut: resolved.outName || "Jugador",
      numberIn: inPlayer?.player_number ?? null,
      numberOut: outPlayer?.player_number ?? null,
    });
  }

  return { lineups: nextLineups, substitutions };
}

function applyEventStats(baseStats: StatRow[], events: LiveEvent[], match: LiveMatch): StatRow[] {
  const rows = baseStats.map((stat) => ({ ...stat }));
  const cardCounts = {
    yellow: { home: 0, away: 0 },
    red: { home: 0, away: 0 },
  };

  for (const event of events) {
    const side = getEventSide(event, match);
    if (!side) continue;

    if (isCardEvent(event, "yellow")) cardCounts.yellow[side] += 1;
    if (isCardEvent(event, "red")) cardCounts.red[side] += 1;
  }

  const setStat = (label: string, home: number, away: number) => {
    const index = rows.findIndex((stat) => stat.label === label);
    if (index >= 0) {
      rows[index] = { ...rows[index], home_value: String(home), away_value: String(away) };
      return;
    }

    if (home > 0 || away > 0) {
      rows.push({ fixture_id: match.id, label, home_value: String(home), away_value: String(away) });
    }
  };

  setStat("Yellow Cards", cardCounts.yellow.home, cardCounts.yellow.away);
  setStat("Red Cards", cardCounts.red.home, cardCounts.red.away);

  return rows;
}

function getPitchStyle(player: LineupRow, starters: LineupRow[]): CSSProperties | undefined {
  const grid = parseGrid(player.player_grid);
  if (!grid) return undefined;

  const columnsInRow = starters.reduce<Record<number, number>>((acc, current) => {
    const currentGrid = parseGrid(current.player_grid);
    if (!currentGrid) return acc;
    acc[currentGrid.row] = Math.max(acc[currentGrid.row] ?? 0, currentGrid.col);
    return acc;
  }, {});

  const rowSpacing = 11;
  const left = player.team === "home"
    ? 7 + (grid.row - 1) * rowSpacing
    : 93 - (grid.row - 1) * rowSpacing;
  const top = (grid.col / ((columnsInRow[grid.row] ?? grid.col) + 1)) * 100;

  return {
    left: `${Math.max(5, Math.min(95, left))}%`,
    top: `${Math.max(10, Math.min(90, top))}%`,
  };
}

function PitchMarker({
  player,
  starters,
  teamName,
}: {
  player: LineupRow;
  starters: LineupRow[];
  teamName: string;
}) {
  const style = getPitchStyle(player, starters);
  if (!style) return null;

  return (
    <button
      type="button"
      className={`pv-pitch-player pv-pitch-player--${player.team} ${player.substitution_status === "in" ? "is-fresh" : ""}`}
      style={style}
      aria-label={`${player.player_number ?? "-"} ${player.player_name}`}
    >
      <span>{player.player_number ?? "-"}</span>
      <span className="pv-pitch-tooltip">
        <strong>{player.player_name}</strong>
        <small>{teamName}</small>
        <small>
          #{player.player_number ?? "-"} {player.player_position || "Jugador"}
        </small>
      </span>
    </button>
  );
}

function StateMessage({
  error,
  loading,
  loadingText,
  emptyText,
}: {
  error: string;
  loading: boolean;
  loadingText: string;
  emptyText: string;
}) {
  if (loading) {
    return <p className="pv-empty">{loadingText}</p>;
  }

  if (error) {
    return <p className="pv-error">{error}</p>;
  }

  return <p className="pv-empty">{emptyText}</p>;
}

function ChatEmote({
  token,
  emoteMap,
  compact = false,
}: {
  token: string;
  emoteMap: Map<string, ChatEmoteConfig>;
  compact?: boolean;
}) {
  const emote = emoteMap.get(token);
  if (!emote) return <>{token}</>;

  return (
    <span
      className={`pv-emote ${emote.kind === "sticker" && !compact ? "pv-emote--sticker" : ""}`}
      title={emote.label}
    >
      <img src={emote.src} alt={emote.label} loading="lazy" />
    </span>
  );
}

function ChatMessageText({
  message,
  emoteMap,
  emotePattern,
}: {
  message: string;
  emoteMap: Map<string, ChatEmoteConfig>;
  emotePattern: RegExp | null;
}) {
  const trimmed = message.trim();
  const singleEmote = emoteMap.get(trimmed);

  if (singleEmote?.kind === "sticker") {
    return <ChatEmote token={trimmed} emoteMap={emoteMap} />;
  }

  if (!emotePattern) {
    return <>{message}</>;
  }

  return (
    <>
      {message.split(emotePattern).map((part, index) => (
        emoteMap.has(part)
          ? <ChatEmote key={`${part}-${index}`} token={part} emoteMap={emoteMap} compact />
          : <span key={`text-${index}`}>{part}</span>
      ))}
    </>
  );
}

export default function PartidosVivo({ match, onBack, user }: PartidosVivoProps) {
  const isDemo = Boolean(match.isDemo);
  const [tab, setTab] = useState("Alineaciones");
  const [equipoSust, setEquipoSust] = useState<"home" | "away">("home");
  const [showScorePill, setShowScorePill] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const scoreboardRef = useRef<HTMLDivElement | null>(null);

  const [chatDraft, setChatDraft] = useState("");
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [selectedActivationOption, setSelectedActivationOption] = useState<string | null>(null);

  const liveConfig = useLiveConfig();
  const { demoMinute, demoRunning, setDemoRunning, resetDemo: resetDemoClock } = useDemoClock(
    isDemo,
    liveConfig.demoSpeedMs,
  );
  const liveSnapshot = useLiveSummary(match, isDemo, liveConfig.liveSummaryRefreshMs);
  const details = useLiveDetails(match.id, isDemo, {
    detailsRefreshMs: liveConfig.detailsRefreshMs,
    eventsRefreshMs: liveConfig.eventsRefreshMs,
    lineupsRefreshMs: liveConfig.lineupsRefreshMs,
  });
  const lineups = details.lineups.data;
  const stats = details.stats.data;
  const h2h = details.h2h.data;
  const events = details.events.data;
  const statSnapshots = details.statSnapshots.data;
  const loadingLineups = details.lineups.loading;
  const loadingStats = details.stats.loading;
  const loadingH2H = details.h2h.loading;
  const loadingEvents = details.events.loading;
  const lineupsError = details.lineups.error;
  const statsError = details.stats.error;
  const h2hError = details.h2h.error;
  const eventsError = details.events.error;

  const demoScore = useMemo(() => getDemoScores(events, demoMinute), [demoMinute, events]);
  const currentMatch = useMemo<LiveMatch>(() => {
    if (!isDemo) return liveSnapshot ?? match;

    return {
      ...match,
      minute: getDemoMinuteLabel(demoMinute),
      status: getDemoStatus(demoMinute),
      homeTeam: { ...match.homeTeam, score: demoScore.home },
      awayTeam: { ...match.awayTeam, score: demoScore.away },
    };
  }, [demoMinute, demoScore.away, demoScore.home, isDemo, liveSnapshot, match]);

  const effectiveEvents = useMemo(() => {
    const source = events;
    return source
      .filter((event) => !isDemo || (event.minute ?? 0) <= demoMinute)
      .sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0));
  }, [demoMinute, events, isDemo]);

  const effectiveStats = useMemo(
    () => applyEventStats(isDemo ? getDemoStats(statSnapshots, demoMinute) : stats, effectiveEvents, currentMatch),
    [currentMatch, demoMinute, effectiveEvents, isDemo, statSnapshots, stats],
  );

  const activationMinute = isDemo ? demoMinute : extractMinute(currentMatch.minute);
  const {
    activeActivation,
    activationHistory,
    activationLoading,
    activationClaiming,
    activationError,
    activationToast,
    setActivationToast,
    claimActivation: submitActivationClaim,
  } = useLiveActivations(match.id, activationMinute);
  const {
    chatMessages,
    chatLoading,
    chatSending,
    chatError,
    sendMessage,
  } = useLiveChat(match.id, liveConfig.chatRefreshMs);
  const chatEmoteMap = useMemo(
    () => new Map(liveConfig.config.chatEmotes.map((emote) => [emote.token, emote])),
    [liveConfig.config.chatEmotes],
  );
  const chatEmotePattern = useMemo(() => {
    const tokens = liveConfig.config.chatEmotes.map((emote) => emote.token);
    if (tokens.length === 0) return null;
    const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return new RegExp(`(${escaped.join("|")})`, "g");
  }, [liveConfig.config.chatEmotes]);

  const lineupRuntime = useMemo(
    () => applyEventLineupChanges(lineups, effectiveEvents, currentMatch),
    [currentMatch, effectiveEvents, lineups],
  );

  const effectiveLineups = lineupRuntime.lineups;
  const matchSubstitutions = lineupRuntime.substitutions;

  useEffect(() => {
    chatListRef.current?.scrollTo({
      top: chatListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages]);

  useEffect(() => {
    const scoreboard = scoreboardRef.current;
    const root = rootRef.current;
    if (!scoreboard) return;

    let frame = 0;

    const updateScorePill = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const navBottom =
          document.querySelector(".app-nav, .ph-nav")?.getBoundingClientRect().bottom ?? 72;
        const scoreboardRect = scoreboard.getBoundingClientRect();
        const rootRect = root?.getBoundingClientRect();
        const rootIsActive =
          !rootRect || (rootRect.top < navBottom + 24 && rootRect.bottom > navBottom + 96);

        setShowScorePill(rootIsActive && scoreboardRect.bottom <= navBottom + 8);
      });
    };

    updateScorePill();
    window.addEventListener("scroll", updateScorePill, { passive: true });
    document.addEventListener("scroll", updateScorePill, true);
    window.addEventListener("resize", updateScorePill);
    window.visualViewport?.addEventListener("resize", updateScorePill);
    const interval = window.setInterval(updateScorePill, 150);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScorePill);
      document.removeEventListener("scroll", updateScorePill, true);
      window.removeEventListener("resize", updateScorePill);
      window.visualViewport?.removeEventListener("resize", updateScorePill);
      window.clearInterval(interval);
    };
  }, []);

  const homeStarters = useMemo(
    () => effectiveLineups.filter((player) => player.team === "home" && !player.is_sub),
    [effectiveLineups],
  );

  const awayStarters = useMemo(
    () => effectiveLineups.filter((player) => player.team === "away" && !player.is_sub),
    [effectiveLineups],
  );

  const sustituciones = useMemo(
    () => matchSubstitutions.filter((substitution) => substitution.team === equipoSust),
    [equipoSust, matchSubstitutions],
  );
  const pitchPlayers = [...homeStarters, ...awayStarters].filter((player) => parseGrid(player.player_grid));
  const timelineEvents = effectiveEvents;

  const parseStatValue = (value: string) => {
    const parsed = Number(String(value).replace("%", "").replace(",", "."));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getStatWinner = (stat: StatRow): "home" | "away" | null => {
    const home = parseStatValue(stat.home_value);
    const away = parseStatValue(stat.away_value);

    if (home === null || away === null || home === away) return null;
    return home > away ? "home" : "away";
  };

  const getH2HWinner = (item: H2HRow): "home" | "away" | "draw" => {
    if (item.home.goals === item.away.goals) return "draw";
    return item.home.goals > item.away.goals ? "home" : "away";
  };

  const setCurrentTab = (nextTab: string) => {
    setTab(nextTab);
  };

  const formatChatTime = (value: string) =>
    new Date(value).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatEventMinute = (event: LiveEvent) => {
    return formatEventMinuteValue(event);
  };

  const getEventLabel = (event: LiveEvent) => {
    if (event.type === "Goal") return "Gol";
    if (event.type === "subst") return "Cambio";
    if (event.type === "Card") return event.detail || "Tarjeta";
    if (event.type === "Half") return "Medio tiempo";
    return event.detail || event.type;
  };

  const sendChatMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = chatDraft.trim();
    if (!message || chatSending) return;

    await sendMessage(message);
    setChatDraft("");
    setShowEmotePicker(false);
  };

  const insertChatEmote = (token: string) => {
    setChatDraft((current) => {
      const spacer = current && !current.endsWith(" ") ? " " : "";
      return `${current}${spacer}${token} `.slice(0, 280);
    });
  };

  const claimActivation = async (selectedOption?: string | null) => {
    if (!activeActivation || activationClaiming) return;
    setActivationToast("");
    await submitActivationClaim(selectedOption ?? selectedActivationOption);
  };

  const resetDemo = () => {
    resetDemoClock();
    setActivationToast("");
    setSelectedActivationOption(null);
  };

  const floatingScore = showScorePill ? (
    <div className="pv-floating-score-wrap" aria-label="Marcador compacto">
      <div className="pv-floating-score">
        <img src={currentMatch.homeTeam.logo} alt="" />
        <strong>
          {currentMatch.homeTeam.score} - {currentMatch.awayTeam.score}
        </strong>
        <span>{currentMatch.minute}</span>
        <img src={currentMatch.awayTeam.logo} alt="" />
      </div>
    </div>
  ) : null;

  return (
    <div className="pv-root" ref={rootRef}>
      {floatingScore && typeof document !== "undefined"
        ? createPortal(floatingScore, document.body)
        : floatingScore}

      <div className="pv-header">
        <button type="button" onClick={onBack} className="pv-back">
          Volver
        </button>

        <div className="pv-live-chip">
          <div className="pv-live-dot" />
          <span className="pv-live-badge">{currentMatch.status === "Full Time" ? "FINAL" : "EN VIVO"}</span>
        </div>
      </div>

      <div className="pv-scoreboard" ref={scoreboardRef}>
        <div className="pv-team">
          <img src={currentMatch.homeTeam.logo} alt={currentMatch.homeTeam.name} className="pv-team-logo" />
          <span className="pv-team-name">{currentMatch.homeTeam.name}</span>
        </div>

        <div className="pv-score-center">
          <div className="pv-score-box">
            {currentMatch.homeTeam.score} - {currentMatch.awayTeam.score}
          </div>
          <span className="pv-score-minute">{currentMatch.minute}</span>
          <div className="pv-stadium">{currentMatch.stadium}</div>
          {isDemo ? (
            <div className="pv-demo-controls" aria-label="Controles de simulacion">
              <button type="button" onClick={() => setDemoRunning(true)} disabled={demoRunning || demoMinute >= 90}>
                Start
              </button>
              <button type="button" onClick={() => setDemoRunning(false)} disabled={!demoRunning}>
                Pausa
              </button>
              <button type="button" onClick={resetDemo}>
                Reiniciar
              </button>
            </div>
          ) : null}
        </div>

        <div className="pv-team">
          <img src={currentMatch.awayTeam.logo} alt={currentMatch.awayTeam.name} className="pv-team-logo" />
          <span className="pv-team-name">{currentMatch.awayTeam.name}</span>
        </div>
      </div>

      {(loadingEvents && !isDemo) || (!loadingEvents && eventsError && !isDemo) || timelineEvents.length > 0 ? (
        <div className="pv-event-strip" aria-label="Eventos del partido">
          {loadingEvents && !isDemo ? <span className="pv-event-empty">Cargando eventos...</span> : null}
          {!loadingEvents && eventsError && !isDemo ? <span className="pv-event-empty">{eventsError}</span> : null}
          {timelineEvents.map((event, index) => (
            <div key={`${event.type}-${event.minute}-${event.player}-${index}`} className={`pv-event-chip pv-event-chip--${event.type.toLowerCase()}`}>
              <strong>{formatEventMinute(event)}</strong>
              <span>{getEventLabel(event)}</span>
              {event.player ? <em>{event.player}</em> : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="pv-live-grid">
        <div className="pv-panel">
          <div className="pv-tabs">
            {TABS.map((currentTab) => (
              <button
                key={currentTab}
                type="button"
                onClick={() => setCurrentTab(currentTab)}
                className={`pv-tab ${tab === currentTab ? "is-active" : ""}`}
              >
                {currentTab}
              </button>
            ))}
          </div>

          <div className="pv-detail-body">
            {tab === "Alineaciones" && (
              <div>
                <div className="pv-pitch-legend">
                  <span><i className="pv-dot-home" />{currentMatch.homeTeam.name}</span>
                  <strong>4-3-3</strong>
                  <span><i className="pv-dot-away" />{currentMatch.awayTeam.name}</span>
                </div>

                <div className="pv-pitch">
                  <div className="pv-pitch__mid" />
                  <div className="pv-pitch__circle" />
                  <div className="pv-pitch__center-dot" />
                  <div className="pv-pitch__area pv-pitch__area--left" />
                  <div className="pv-pitch__area pv-pitch__area--left-small" />
                  <div className="pv-pitch__area pv-pitch__area--right" />
                  <div className="pv-pitch__area pv-pitch__area--right-small" />
                  {pitchPlayers.length > 0 ? (
                    <>
                      {homeStarters.map((player) => (
                        <PitchMarker
                          key={`pitch-home-${player.player_number}-${player.player_name}`}
                          player={player}
                          starters={homeStarters}
                          teamName={currentMatch.homeTeam.name}
                        />
                      ))}
                      {awayStarters.map((player) => (
                        <PitchMarker
                          key={`pitch-away-${player.player_number}-${player.player_name}`}
                          player={player}
                          starters={awayStarters}
                          teamName={currentMatch.awayTeam.name}
                        />
                      ))}
                    </>
                  ) : (
                    <span className="pv-pitch__empty">Sin mapa de alineacion desde el API</span>
                  )}
                </div>

                {loadingLineups || lineupsError || effectiveLineups.length === 0 ? (
                  <StateMessage
                    loading={loadingLineups}
                    error={lineupsError}
                    loadingText="Cargando alineaciones..."
                    emptyText="No hay alineaciones disponibles para este partido."
                  />
                ) : null}
              </div>
            )}

            {tab === "Estadisticas" && (
              <div>
                {loadingStats || statsError || effectiveStats.length === 0 ? (
                  <StateMessage
                    loading={loadingStats}
                    error={statsError}
                    loadingText="Cargando estadisticas..."
                    emptyText="No hay estadisticas disponibles para este partido."
                  />
                ) : (
                  <>
                    <p className="pv-stats-label">Estadisticas del partido</p>
                    <div className="pv-stat-teams">
                      <span>{currentMatch.homeTeam.name}</span>
                      <span />
                      <span>{currentMatch.awayTeam.name}</span>
                    </div>
                    {effectiveStats.map((stat, index) => {
                      const winner = getStatWinner(stat);
                      return (
                        <div key={`${stat.label}-${index}`} className="pv-stat-row">
                          <span className={`pv-stat-home ${winner === "home" ? "pv-stat-value--winner" : ""}`}>
                            {stat.home_value}
                          </span>
                          <span className="pv-stat-label">{liveConfig.statLabels.get(stat.label) ?? stat.label}</span>
                          <span className={`pv-stat-away ${winner === "away" ? "pv-stat-value--winner" : ""}`}>
                            {stat.away_value}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {tab === "H2H" && (
              <div>
                {loadingH2H || h2hError || h2h.length === 0 ? (
                  <StateMessage
                    loading={loadingH2H}
                    error={h2hError}
                    loadingText="Cargando historial..."
                    emptyText="No hay historial disponible para estos equipos."
                  />
                ) : (
                  <>
                    <p className="pv-stats-label">Ultimos enfrentamientos</p>
                    {h2h.map((item, index) => {
                      const winner = getH2HWinner(item);
                      return (
                        <div key={`${item.fixture_id}-${index}`} className="pv-h2h-row">
                          <span className="pv-h2h-date">
                            {new Date(item.date).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            - {item.league}
                          </span>

                          <div className="pv-h2h-match">
                            <div className={`pv-h2h-team ${winner === "home" ? "is-winner" : ""}`}>
                              <img src={item.home.logo} alt={item.home.name} className="pv-h2h-logo" />
                              <span>{item.home.name}</span>
                              <small>Local</small>
                              {winner === "home" ? <em>Ganador</em> : null}
                            </div>

                            <strong className="pv-h2h-score">
                              {item.home.goals} - {item.away.goals}
                              {winner === "draw" ? <span>Empate</span> : null}
                            </strong>

                            <div className={`pv-h2h-team pv-h2h-team--away ${winner === "away" ? "is-winner" : ""}`}>
                              {winner === "away" ? <em>Ganador</em> : null}
                              <small>Visitante</small>
                              <span>{item.away.name}</span>
                              <img src={item.away.logo} alt={item.away.name} className="pv-h2h-logo" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pv-subs">
          <div className="pv-subs__header">
            <span className="pv-subs__title">Sustituciones</span>
          </div>

          <div className="pv-subs__selector">
            <button
              type="button"
              onClick={() => setEquipoSust("home")}
              className={`pv-subs__btn ${equipoSust === "home" ? "is-active" : ""}`}
            >
              <img src={currentMatch.homeTeam.logo} alt="" className="pv-subs__logo" />
              <span>{currentMatch.homeTeam.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setEquipoSust("away")}
              className={`pv-subs__btn ${equipoSust === "away" ? "is-active" : ""}`}
            >
              <img src={currentMatch.awayTeam.logo} alt="" className="pv-subs__logo" />
              <span>{currentMatch.awayTeam.name}</span>
            </button>
          </div>

          {loadingEvents || eventsError || sustituciones.length === 0 ? (
            <StateMessage
              loading={loadingEvents}
              error={eventsError}
              loadingText="Cargando cambios..."
              emptyText="Sin cambios registrados."
            />
          ) : (
            <div className="pv-subs__list">
              {sustituciones.map((substitution, index) => (
                <div key={`${substitution.team}-${substitution.minute}-${substitution.playerIn}-${index}`} className="pv-subs__row">
                  <div className="pv-subs__minute">{substitution.displayMinute || "-"}</div>
                  <div className="pv-subs__players">
                    <span className="pv-subs__player pv-subs__player--in">
                      <small>{substitution.numberIn ?? "-"}</small>
                      Entra {substitution.playerIn}
                    </span>
                    <span className="pv-subs__player pv-subs__player--out">
                      <small>{substitution.numberOut ?? "-"}</small>
                      Sale {substitution.playerOut}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="pv-chat-room" aria-label="Chat y activaciones en vivo">
        <div className="pv-chat-room__header">
          <span className="pv-chat__title">Chat en vivo</span>
        </div>

        <div className="pv-chat-room__body">
          <div className="pv-activation">
            {activationLoading ? <p className="pv-empty">Buscando activaciones...</p> : null}
            {activationError ? <p className="pv-chat__error">{activationError}</p> : null}
            {activationToast ? <p className="pv-activation__toast">{activationToast}</p> : null}

            {activeActivation ? (
              <div className={`pv-activation-card pv-activation-card--${activeActivation.type}`}>
                <span className="pv-activation__minute">
                  {activeActivation.starts_at_minute}'-{activeActivation.expires_at_minute}'
                </span>
                <h3 className="pv-activation__title">{activeActivation.title}</h3>
                {activeActivation.description ? (
                  <p className="pv-activation__stat">{activeActivation.description}</p>
                ) : null}
                <strong className="pv-activation__reward">+{activeActivation.reward_points} pts</strong>

                {activeActivation.type === "drop" ? (
                  <button
                    type="button"
                    className="pv-activation__claim"
                    disabled={activationClaiming}
                    onClick={() => claimActivation(null)}
                  >
                    {activationClaiming ? "..." : "Claim"}
                  </button>
                ) : (
                  <div className="pv-poll-options">
                    {(activeActivation.payload.options || []).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedActivationOption(option.id);
                          claimActivation(option.id);
                        }}
                        className={`pv-poll-option ${selectedActivationOption === option.id ? "is-selected" : ""}`}
                        disabled={activationClaiming}
                      >
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="pv-activation-history">
              <p className="pv-activation__eyebrow">Historial</p>
              {activationHistory.length === 0 ? <span>Sin recompensas reclamadas aun.</span> : null}
              {activationHistory.slice(-4).reverse().map((activation) => (
                <div key={activation.id} className="pv-activation-history__item">
                  <strong>{activation.title}</strong>
                  <span>
                    {activation.status === "correct"
                      ? "Correcto"
                      : activation.status === "expired"
                        ? "Expirado"
                        : activation.status === "participated"
                          ? "Participaste"
                          : "Reclamado"}
                  </span>
                  {activation.claim ? <em>+{activation.claim.reward_points}</em> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="pv-chat">
            <div className="pv-chat__messages" ref={chatListRef}>
              {chatLoading ? <p className="pv-empty">Cargando chat...</p> : null}
              {!chatLoading && chatMessages.length === 0 ? (
                <p className="pv-empty">Se el primero en comentar este partido.</p>
              ) : null}
              {chatMessages.map((item) => {
                const isMine = Number(item.id_usuario) === Number(user?.id_usuario);
                return (
                  <div
                    key={item.id}
                    className={`pv-chat__message ${isMine ? "pv-chat__message--mine" : ""}`}
                  >
                    <div className="pv-chat__meta">
                      <strong>{item.username}</strong>
                      <span>{formatChatTime(item.created_at)}</span>
                    </div>
                    <p>
                      <ChatMessageText
                        message={item.message}
                        emoteMap={chatEmoteMap}
                        emotePattern={chatEmotePattern}
                      />
                    </p>
                  </div>
                );
              })}
            </div>

            {chatError ? <p className="pv-chat__error">{chatError}</p> : null}

            <form className="pv-chat__form" onSubmit={sendChatMessage}>
              <div className="pv-chat__composer">
                {showEmotePicker ? (
                  <div className="pv-emote-picker" role="menu" aria-label="Emotes del chat">
                    {liveConfig.config.chatEmotes.map((emote) => (
                      <button
                        key={emote.token}
                        type="button"
                        className="pv-emote-picker__item"
                        onClick={() => insertChatEmote(emote.token)}
                      >
                        <ChatEmote token={emote.token} emoteMap={chatEmoteMap} compact />
                        <span>{emote.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="pv-chat__emote-btn"
                  aria-label="Abrir emotes"
                  onClick={() => setShowEmotePicker((open) => !open)}
                >
                  EM
                </button>
              <input
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value.slice(0, 280))}
                maxLength={280}
                placeholder={`Comentar como ${user?.nickname || user?.nombre_usuario || "Usuario"}`}
                className="pv-chat__input"
              />
              </div>
              <button type="submit" disabled={!chatDraft.trim() || chatSending} className="pv-chat__send">
                {chatSending ? "..." : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
