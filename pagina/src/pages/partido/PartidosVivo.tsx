import { type CSSProperties, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./PartidosVivo.css";

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

interface PartidosVivoProps {
  match: LiveMatch;
  onBack: () => void;
  user: any;
}

interface LineupRow {
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

interface StatRow {
  fixture_id: number;
  label: string;
  home_value: string;
  away_value: string;
}

interface H2HRow {
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

interface LiveChatMessage {
  id: number;
  fixture_id: number;
  id_usuario: number;
  username: string;
  message: string;
  created_at: string;
}

interface LiveMatchApi {
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

interface LiveEvent {
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

interface SubstitutionItem {
  team: "home" | "away";
  minute: number | null;
  displayMinute: string;
  playerIn: string;
  playerOut: string;
  numberIn: number | null;
  numberOut: number | null;
}

interface ActivationOption {
  id: string;
  label: string;
}

interface LiveActivation {
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

const API_URL = import.meta.env.VITE_API_URL;
const TABS = ["Alineaciones", "Estadisticas", "H2H"];
const DEMO_SPEED_MS = 2000;

const STATS_ES: Record<string, string> = {
  "Shots on Goal": "Tiros a puerta",
  "Shots off Goal": "Tiros fuera",
  "Total Shots": "Tiros totales",
  "Blocked Shots": "Tiros bloqueados",
  "Shots insidebox": "Tiros dentro del area",
  "Shots outsidebox": "Tiros fuera del area",
  Fouls: "Faltas",
  "Corner Kicks": "Tiros de esquina",
  Offsides: "Fueras de juego",
  "Ball Possession": "Posesion del balon",
  "Yellow Cards": "Tarjetas amarillas",
  "Red Cards": "Tarjetas rojas",
  "Goalkeeper Saves": "Atajadas",
  "Total passes": "Pases totales",
  "Passes accurate": "Pases precisos",
  "Passes %": "Precision de pases",
  expected_goals: "Goles esperados (xG)",
  goals_prevented: "Goles evitados",
};

const CHAT_EMOTES = [
  { token: ":pog:", label: "KomodoHype", src: "https://static-cdn.jtvnw.net/emoticons/v2/81274/default/dark/2.0", kind: "sticker" },
  { token: ":kappa:", label: "Kappa", src: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0", kind: "emote" },
  { token: ":lul:", label: "LUL", src: "https://static-cdn.jtvnw.net/emoticons/v2/425618/default/dark/2.0", kind: "emote" },
  { token: ":hey:", label: "HeyGuys", src: "https://static-cdn.jtvnw.net/emoticons/v2/30259/default/dark/2.0", kind: "emote" },
  { token: ":good:", label: "SeemsGood", src: "https://static-cdn.jtvnw.net/emoticons/v2/64138/default/dark/2.0", kind: "emote" },
  { token: ":sleep:", label: "ResidentSleeper", src: "https://static-cdn.jtvnw.net/emoticons/v2/245/default/dark/2.0", kind: "emote" },
  { token: ":cry:", label: "BibleThump", src: "https://static-cdn.jtvnw.net/emoticons/v2/86/default/dark/2.0", kind: "emote" },
  { token: ":rage:", label: "SwiftRage", src: "https://static-cdn.jtvnw.net/emoticons/v2/34/default/dark/2.0", kind: "sticker" },
  { token: ":cat:", label: "CoolCat", src: "https://static-cdn.jtvnw.net/emoticons/v2/58127/default/dark/2.0", kind: "emote" },
] as const;

const CHAT_EMOTE_MAP: Map<string, (typeof CHAT_EMOTES)[number]> = new Map(CHAT_EMOTES.map((emote) => [emote.token, emote]));
const CHAT_EMOTE_PATTERN = /(:pog:|:kappa:|:lul:|:hey:|:good:|:sleep:|:cry:|:rage:|:cat:)/g;

const DEMO_EVENTS: LiveEvent[] = [
  { id: 1, fixture_id: 990000001, minute: 8, team: "home", type: "Chance", detail: "Tiro a puerta", player: "Bukayo Saka", assist: "Martin Odegaard" },
  { id: 2, fixture_id: 990000001, minute: 17, team: "away", type: "Goal", detail: "Gol", player: "Mohamed Salah", assist: "Darwin Nunez" },
  { id: 3, fixture_id: 990000001, minute: 28, team: "home", type: "Card", detail: "Amarilla", player: "Declan Rice" },
  { id: 4, fixture_id: 990000001, minute: 41, team: "home", type: "Goal", detail: "Gol", player: "Gabriel Jesus", assist: "Bukayo Saka" },
  { id: 5, fixture_id: 990000001, minute: 45, team: null, type: "Half", detail: "Medio tiempo", player: null },
  { id: 6, fixture_id: 990000001, minute: 58, team: "home", type: "subst", detail: "Cambio", player: "Leandro Trossard", assist: "Gabriel Martinelli" },
  { id: 7, fixture_id: 990000001, minute: 63, team: "away", type: "Card", detail: "Amarilla", player: "Ibrahima Konate" },
  { id: 8, fixture_id: 990000001, minute: 67, team: "home", type: "Goal", detail: "Gol", player: "Bukayo Saka", assist: "Leandro Trossard" },
  { id: 9, fixture_id: 990000001, minute: 74, team: "away", type: "subst", detail: "Cambio", player: "Diogo Jota", assist: "Darwin Nunez" },
  { id: 10, fixture_id: 990000001, minute: 83, team: "away", type: "Goal", detail: "Gol", player: "Diogo Jota", assist: "Trent Alexander-Arnold" },
];

const DEMO_STAT_CHECKPOINTS: Array<{ minute: number; stats: StatRow[] }> = [
  {
    minute: 0,
    stats: [
      { fixture_id: 990000001, label: "Shots on Goal", home_value: "0", away_value: "0" },
      { fixture_id: 990000001, label: "Total Shots", home_value: "0", away_value: "0" },
      { fixture_id: 990000001, label: "Ball Possession", home_value: "50%", away_value: "50%" },
      { fixture_id: 990000001, label: "Corner Kicks", home_value: "0", away_value: "0" },
      { fixture_id: 990000001, label: "Fouls", home_value: "0", away_value: "0" },
      { fixture_id: 990000001, label: "Yellow Cards", home_value: "0", away_value: "0" },
      { fixture_id: 990000001, label: "Total passes", home_value: "0", away_value: "0" },
      { fixture_id: 990000001, label: "Passes accurate", home_value: "0", away_value: "0" },
    ],
  },
  {
    minute: 17,
    stats: [
      { fixture_id: 990000001, label: "Shots on Goal", home_value: "1", away_value: "2" },
      { fixture_id: 990000001, label: "Total Shots", home_value: "3", away_value: "4" },
      { fixture_id: 990000001, label: "Ball Possession", home_value: "48%", away_value: "52%" },
      { fixture_id: 990000001, label: "Corner Kicks", home_value: "1", away_value: "1" },
      { fixture_id: 990000001, label: "Fouls", home_value: "2", away_value: "1" },
      { fixture_id: 990000001, label: "Yellow Cards", home_value: "0", away_value: "0" },
      { fixture_id: 990000001, label: "Total passes", home_value: "92", away_value: "101" },
      { fixture_id: 990000001, label: "Passes accurate", home_value: "78", away_value: "88" },
    ],
  },
  {
    minute: 41,
    stats: [
      { fixture_id: 990000001, label: "Shots on Goal", home_value: "4", away_value: "3" },
      { fixture_id: 990000001, label: "Total Shots", home_value: "8", away_value: "7" },
      { fixture_id: 990000001, label: "Ball Possession", home_value: "52%", away_value: "48%" },
      { fixture_id: 990000001, label: "Corner Kicks", home_value: "3", away_value: "2" },
      { fixture_id: 990000001, label: "Fouls", home_value: "5", away_value: "4" },
      { fixture_id: 990000001, label: "Yellow Cards", home_value: "1", away_value: "0" },
      { fixture_id: 990000001, label: "Total passes", home_value: "234", away_value: "218" },
      { fixture_id: 990000001, label: "Passes accurate", home_value: "203", away_value: "188" },
    ],
  },
  {
    minute: 67,
    stats: [
      { fixture_id: 990000001, label: "Shots on Goal", home_value: "6", away_value: "4" },
      { fixture_id: 990000001, label: "Total Shots", home_value: "14", away_value: "10" },
      { fixture_id: 990000001, label: "Ball Possession", home_value: "54%", away_value: "46%" },
      { fixture_id: 990000001, label: "Corner Kicks", home_value: "5", away_value: "3" },
      { fixture_id: 990000001, label: "Fouls", home_value: "8", away_value: "11" },
      { fixture_id: 990000001, label: "Yellow Cards", home_value: "1", away_value: "2" },
      { fixture_id: 990000001, label: "Total passes", home_value: "412", away_value: "351" },
      { fixture_id: 990000001, label: "Passes accurate", home_value: "359", away_value: "298" },
    ],
  },
  {
    minute: 90,
    stats: [
      { fixture_id: 990000001, label: "Shots on Goal", home_value: "7", away_value: "6" },
      { fixture_id: 990000001, label: "Total Shots", home_value: "16", away_value: "14" },
      { fixture_id: 990000001, label: "Ball Possession", home_value: "51%", away_value: "49%" },
      { fixture_id: 990000001, label: "Corner Kicks", home_value: "6", away_value: "5" },
      { fixture_id: 990000001, label: "Fouls", home_value: "10", away_value: "13" },
      { fixture_id: 990000001, label: "Yellow Cards", home_value: "1", away_value: "2" },
      { fixture_id: 990000001, label: "Total passes", home_value: "563", away_value: "529" },
      { fixture_id: 990000001, label: "Passes accurate", home_value: "489", away_value: "454" },
    ],
  },
];

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

function getDemoScores(minute: number) {
  return DEMO_EVENTS.reduce(
    (score, event) => {
      if ((event.minute ?? 0) > minute || event.type !== "Goal") return score;
      if (event.team === "home") score.home += 1;
      if (event.team === "away") score.away += 1;
      return score;
    },
    { home: 0, away: 0 },
  );
}

function getDemoStats(minute: number) {
  const checkpoint = [...DEMO_STAT_CHECKPOINTS]
    .reverse()
    .find((item) => minute >= item.minute) ?? DEMO_STAT_CHECKPOINTS[0];
  return checkpoint.stats;
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

function ChatEmote({ token, compact = false }: { token: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const emote = CHAT_EMOTE_MAP.get(token);
  if (!emote) return <>{token}</>;
  const className = `pv-emote ${emote.kind === "sticker" && !compact ? "pv-emote--sticker" : ""}${failed ? " pv-emote--failed" : ""}`;

  return (
    <span className={className} title={emote.label}>
      {failed ? (
        <span className="pv-emote__fallback">{token}</span>
      ) : (
        <img src={emote.src} alt={emote.label} loading="lazy" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

function ChatMessageText({ message }: { message: string }) {
  const trimmed = message.trim();
  const singleEmote = CHAT_EMOTE_MAP.get(trimmed);

  if (singleEmote?.kind === "sticker") {
    return <ChatEmote token={trimmed} />;
  }

  return (
    <>
      {message.split(CHAT_EMOTE_PATTERN).map((part, index) => (
        CHAT_EMOTE_MAP.has(part)
          ? <ChatEmote key={`${part}-${index}`} token={part} compact />
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
  const [liveSnapshot, setLiveSnapshot] = useState<LiveMatch | null>(null);
  const [demoMinute, setDemoMinute] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const scoreboardRef = useRef<HTMLDivElement | null>(null);

  const [lineups, setLineups] = useState<LineupRow[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [h2h, setH2H] = useState<H2HRow[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [activeActivation, setActiveActivation] = useState<LiveActivation | null>(null);
  const [activationHistory, setActivationHistory] = useState<LiveActivation[]>([]);
  const [selectedActivationOption, setSelectedActivationOption] = useState<string | null>(null);
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationClaiming, setActivationClaiming] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [activationToast, setActivationToast] = useState("");

  const [loadingLineups, setLoadingLineups] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingH2H, setLoadingH2H] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [lineupsError, setLineupsError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [h2hError, setH2HError] = useState("");
  const [eventsError, setEventsError] = useState("");
  const [chatError, setChatError] = useState("");

  const demoScore = useMemo(() => getDemoScores(demoMinute), [demoMinute]);
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
    const source = isDemo ? DEMO_EVENTS : events;
    return source
      .filter((event) => !isDemo || (event.minute ?? 0) <= demoMinute)
      .sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0));
  }, [demoMinute, events, isDemo]);

  const effectiveStats = useMemo(
    () => applyEventStats(isDemo ? getDemoStats(demoMinute) : stats, effectiveEvents, currentMatch),
    [currentMatch, demoMinute, effectiveEvents, isDemo, stats],
  );

  const lineupRuntime = useMemo(
    () => applyEventLineupChanges(lineups, effectiveEvents, currentMatch),
    [currentMatch, effectiveEvents, lineups],
  );

  const effectiveLineups = lineupRuntime.lineups;
  const matchSubstitutions = lineupRuntime.substitutions;

  const loadResource = useCallback(async <T,>(
    path: string,
    setData: (data: T[]) => void,
    setLoading: (loading: boolean) => void,
    setError: (error: string) => void,
    fallbackError: string,
    showLoading = true,
  ) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setData(json.data);
      } else {
        setData([]);
        setError("La respuesta no vino en el formato esperado.");
      }
    } catch (error: any) {
      setData([]);
      setError(error?.message || fallbackError);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLiveDetails = useCallback((showLoading = false) => {
    if (!match?.id) return;

    loadResource<LineupRow>(
      `/api/partidos/live/${match.id}/lineups`,
      setLineups,
      setLoadingLineups,
      setLineupsError,
      "No se pudieron cargar las alineaciones.",
      showLoading,
    );
    loadResource<StatRow>(
      `/api/partidos/live/${match.id}/stats`,
      setStats,
      setLoadingStats,
      setStatsError,
      "No se pudieron cargar las estadisticas.",
      showLoading,
    );
    loadResource<LiveEvent>(
      `/api/partidos/live/${match.id}/events`,
      setEvents,
      setLoadingEvents,
      setEventsError,
      "No se pudieron cargar los eventos.",
      showLoading,
    );
  }, [loadResource, match.id]);

  const loadH2H = useCallback((showLoading = false) => {
    if (!match?.id) return;

    loadResource<H2HRow>(
      `/api/partidos/live/${match.id}/h2h`,
      setH2H,
      setLoadingH2H,
      setH2HError,
      "No se pudo cargar el H2H.",
      showLoading,
    );
  }, [loadResource, match.id]);

  const activationMinute = isDemo ? demoMinute : extractMinute(currentMatch.minute);

  const loadActivations = useCallback(async (showLoading = false) => {
    if (!match?.id) return;

    try {
      if (showLoading) setActivationLoading(true);
      setActivationError("");
      const minuteQuery = activationMinute !== null ? `?minute=${activationMinute}` : "";

      const [activeRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/api/partidos/live/${match.id}/activations${minuteQuery}`, { credentials: "include" }),
        fetch(`${API_URL}/api/partidos/live/${match.id}/activations/history${minuteQuery}`, { credentials: "include" }),
      ]);

      const activeJson = await activeRes.json();
      const historyJson = await historyRes.json();

      if (!activeRes.ok || !activeJson.success) {
        throw new Error(activeJson.error || `Error HTTP ${activeRes.status}`);
      }

      if (!historyRes.ok || !historyJson.success) {
        throw new Error(historyJson.error || `Error HTTP ${historyRes.status}`);
      }

      const nextActive = Array.isArray(activeJson.data) ? activeJson.data[0] ?? null : null;
      setActiveActivation(nextActive);
      setActivationHistory(Array.isArray(historyJson.data) ? historyJson.data : []);
      setSelectedActivationOption(null);
    } catch (error: any) {
      setActivationError(error?.message || "No se pudieron cargar las activaciones.");
    } finally {
      setActivationLoading(false);
    }
  }, [activationMinute, match.id]);

  useEffect(() => {
    if (!match?.id) {
      setLineups([]);
      setStats([]);
      setH2H([]);
      setEvents([]);
      setLineupsError("No llego el id del partido.");
      setStatsError("No llego el id del partido.");
      setH2HError("No llego el id del partido.");
      setEventsError("No llego el id del partido.");
      setLoadingLineups(false);
      setLoadingStats(false);
      setLoadingH2H(false);
      setLoadingEvents(false);
      return;
    }

    refreshLiveDetails(true);
    loadH2H(true);
  }, [loadH2H, match.id, refreshLiveDetails]);

  useEffect(() => {
    if (isDemo) return;

    const statsInterval = window.setInterval(() => {
      loadResource<StatRow>(
        `/api/partidos/live/${match.id}/stats`,
        setStats,
        setLoadingStats,
        setStatsError,
        "No se pudieron cargar las estadisticas.",
        false,
      );
    }, 60000);

    const lineupsInterval = window.setInterval(() => {
      loadResource<LineupRow>(
        `/api/partidos/live/${match.id}/lineups`,
        setLineups,
        setLoadingLineups,
        setLineupsError,
        "No se pudieron cargar las alineaciones.",
        false,
      );
    }, 180000);

    const eventsInterval = window.setInterval(() => {
      loadResource<LiveEvent>(
        `/api/partidos/live/${match.id}/events`,
        setEvents,
        setLoadingEvents,
        setEventsError,
        "No se pudieron cargar los eventos.",
        false,
      );
    }, 15000);

    return () => {
      window.clearInterval(statsInterval);
      window.clearInterval(lineupsInterval);
      window.clearInterval(eventsInterval);
    };
  }, [isDemo, loadResource, match.id]);

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
    }, DEMO_SPEED_MS);

    return () => window.clearInterval(interval);
  }, [demoRunning, isDemo]);

  useEffect(() => {
    loadActivations(false);
  }, [loadActivations]);

  useEffect(() => {
    let cancelled = false;

    const loadChat = async (showLoading = false) => {
      try {
        if (showLoading) setChatLoading(true);
        setChatError("");

        const res = await fetch(`${API_URL}/api/partidos/live/${match.id}/chat`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          setChatMessages(json.data);
        }
      } catch (error: any) {
        if (!cancelled) {
          setChatError(error?.message || "No se pudo cargar el chat.");
        }
      } finally {
        if (!cancelled) setChatLoading(false);
      }
    };

    loadChat(true);
    const interval = window.setInterval(() => loadChat(false), 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [match.id]);

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

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;

    const refreshLiveSummary = async () => {
      try {
        const res = await fetch(`${API_URL}/api/partidos/live`);
        if (!res.ok) return;

        const json = await res.json();
        if (!json.success || !Array.isArray(json.data)) return;

        const found = json.data.find((item: LiveMatchApi) => Number(item.id) === Number(match.id));
        if (!found || cancelled) return;

        setLiveSnapshot({
          id: found.id,
          league: found.league,
          minute: found.minute,
          stadium: found.stadium,
          status: found.status,
          isDemo: Boolean(found.is_demo),
          homeTeam: {
            name: found.home_name,
            logo: found.home_logo,
            score: found.home_score ?? 0,
          },
          awayTeam: {
            name: found.away_name,
            logo: found.away_logo,
            score: found.away_score ?? 0,
          },
        });
      } catch {
        // Keep the last known score if the live refresh fails.
      }
    };

    refreshLiveSummary();
    const interval = window.setInterval(refreshLiveSummary, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isDemo, match.id]);

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

    try {
      setChatSending(true);
      setChatError("");

      const res = await fetch(`${API_URL}/api/partidos/live/${match.id}/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Error HTTP ${res.status}`);
      }

      setChatMessages((current) => [...current, json.data]);
      setChatDraft("");
      setShowEmotePicker(false);
    } catch (error: any) {
      setChatError(error?.message || "No se pudo enviar el mensaje.");
    } finally {
      setChatSending(false);
    }
  };

  const insertChatEmote = (token: string) => {
    setChatDraft((current) => {
      const spacer = current && !current.endsWith(" ") ? " " : "";
      return `${current}${spacer}${token} `.slice(0, 280);
    });
  };

  const claimActivation = async (selectedOption?: string | null) => {
    if (!activeActivation || activationClaiming) return;

    try {
      setActivationClaiming(true);
      setActivationError("");
      setActivationToast("");

      const option = selectedOption ?? selectedActivationOption;
      const res = await fetch(`${API_URL}/api/partidos/live/${match.id}/activations/${activeActivation.id}/claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_option: option }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Error HTTP ${res.status}`);
      }

      setActivationToast(
        Number(json.reward_points) > 0
          ? `Ganaste ${json.reward_points} puntos`
          : "Participacion registrada",
      );
      setActiveActivation(null);
      await loadActivations(false);
    } catch (error: any) {
      setActivationError(error?.message || "No se pudo reclamar la activacion.");
    } finally {
      setActivationClaiming(false);
    }
  };

  const resetDemo = () => {
    setDemoRunning(false);
    setDemoMinute(0);
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
                          <span className="pv-stat-label">{STATS_ES[stat.label] ?? stat.label}</span>
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
                    <p><ChatMessageText message={item.message} /></p>
                  </div>
                );
              })}
            </div>

            {chatError ? <p className="pv-chat__error">{chatError}</p> : null}

            <form className="pv-chat__form" onSubmit={sendChatMessage}>
              <div className="pv-chat__composer">
                {showEmotePicker ? (
                  <div className="pv-emote-picker" role="menu" aria-label="Emotes del chat">
                    {CHAT_EMOTES.map((emote) => (
                      <button
                        key={emote.token}
                        type="button"
                        className="pv-emote-picker__item"
                        onClick={() => insertChatEmote(emote.token)}
                      >
                        <ChatEmote token={emote.token} compact />
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
