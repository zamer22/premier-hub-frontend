import { useEffect, useState } from "react";
import "./PartidoPasado.css";

const API_URL = import.meta.env.VITE_API_URL;

export interface PastMatch {
  id: number;
  date: string;
  league: string;
  stadium: string;
  round: string;
  homeTeam: { name: string; logo: string; score: number };
  awayTeam: { name: string; logo: string; score: number };
}

interface MatchEvent {
  minute: number;
  extra: number | null;
  team: { id: number; name: string; logo: string };
  player: string;
  assist: string | null;
  type: string;
  detail: string;
  comments: string | null;
}

interface MatchStat {
  label: string;
  home_value: string;
  away_value: string;
}

interface LineupPlayer {
  player_number: number | null;
  player_name: string;
  is_sub: boolean;
  team: "home" | "away";
}

interface Props {
  match: PastMatch;
  onBack: () => void;
}

const TABS = ["Jugadas", "Estadísticas", "Alineaciones"];

type EventFilter = "todos" | "goles" | "amarillas" | "rojas" | "sustituciones";

const FILTERS: { key: EventFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "goles", label: "Goles" },
  { key: "amarillas", label: "Amarillas" },
  { key: "rojas", label: "Rojas" },
  { key: "sustituciones", label: "Sustituciones" },
];

const STATS_ES: Record<string, string> = {
  "Shots on Goal": "Tiros a puerta",
  "Shots off Goal": "Tiros fuera",
  "Total Shots": "Tiros totales",
  "Blocked Shots": "Tiros bloqueados",
  "Shots insidebox": "Tiros dentro del área",
  "Shots outsidebox": "Tiros fuera del área",
  Fouls: "Faltas",
  "Corner Kicks": "Tiros de esquina",
  Offsides: "Fueras de juego",
  "Ball Possession": "Posesión del balón",
  "Yellow Cards": "Tarjetas amarillas",
  "Red Cards": "Tarjetas rojas",
  "Goalkeeper Saves": "Atajadas",
  "Total passes": "Pases totales",
  "Passes accurate": "Pases precisos",
  "Passes %": "Precisión de pases",
  expected_goals: "Goles esperados (xG)",
  goals_prevented: "Goles evitados",
};

const EVENT_ICONS: Record<string, string> = {
  goal: "https://images.vexels.com/media/users/3/158409/isolated/preview/b0af06a4c1a8e7a31ce379250130d26c-pelota-de-futbol-pentagono-silueta.png",
  yellow: "https://stylfoot.fr/3641-thickbox_01icon/referee-yellow-card.jpg",
  red: "https://stylfoot.fr/3640/referee-red-card.jpg",
  subst: "https://images.vexels.com/media/users/3/146860/isolated/lists/bbe607c0831621bfe4606d241ef04f8a-icono-de-sustituto-de-futbol.png",
};

function eventIconUrl(type: string, detail: string): string | null {
  if (type === "Goal") return EVENT_ICONS.goal;
  if (type === "Card") return detail.includes("Red") ? EVENT_ICONS.red : EVENT_ICONS.yellow;
  if (type === "subst") return EVENT_ICONS.subst;
  return null;
}

function eventLabel(type: string, detail: string): string {
  if (type === "Goal") {
    if (detail === "Own Goal") return "Gol en propia";
    if (detail === "Penalty") return "Penal";
    if (detail === "Missed Penalty") return "Penal fallado";
    return "Gol";
  }

  if (type === "Card") {
    if (detail === "Yellow Card") return "Amarilla";
    if (detail === "Red Card") return "Roja";
    if (detail === "Yellow Red Card") return "Segunda amarilla";
    return detail;
  }

  if (type === "subst") return "Sustitución";
  if (type === "Var") return "VAR";
  return detail;
}

function matchesFilter(event: MatchEvent, filter: EventFilter): boolean {
  if (filter === "todos") return true;
  if (filter === "goles") return event.type === "Goal";
  if (filter === "amarillas") return event.type === "Card" && !event.detail.includes("Red");
  if (filter === "rojas") return event.type === "Card" && (event.detail === "Red Card" || event.detail === "Yellow Red Card");
  if (filter === "sustituciones") return event.type === "subst";
  return true;
}

function eventTone(type: string) {
  if (type === "Goal") return "goal";
  if (type === "Card") return "card";
  if (type === "subst") return "subst";
  return "default";
}

function FilterBar({
  active,
  onChange,
}: {
  active: EventFilter;
  onChange: (f: EventFilter) => void;
}) {
  return (
    <div className="pp-filters" aria-label="Filtrar jugadas">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`pp-filter ${active === key ? "pp-filter--active" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function HalfSeparator({ label }: { label: string }) {
  return (
    <div className="pp-half-separator">
      <span>{label}</span>
    </div>
  );
}

function EventRow({ event, match }: { event: MatchEvent; match: PastMatch }) {
  const isHome = event.team.name === match.homeTeam.name;
  const iconUrl = eventIconUrl(event.type, event.detail);
  const tone = eventTone(event.type);

  const content = (
    <div className={`pp-event-content ${isHome ? "pp-event-content--home" : "pp-event-content--away"}`}>
      <span className={`pp-event-player ${tone === "goal" ? "pp-event-player--goal" : ""}`}>{event.player}</span>
      <span className={`pp-event-label pp-event-label--${tone}`}>{eventLabel(event.type, event.detail)}</span>
      {event.assist && event.type === "Goal" ? <span className="pp-event-assist">Asist. {event.assist}</span> : null}
      {event.type === "subst" && event.assist ? <span className="pp-event-sub">Entra {event.assist}</span> : null}
    </div>
  );

  return (
    <div className="pp-event-row">
      <div className="pp-event-side pp-event-side--home">{isHome ? content : null}</div>

      <div className="pp-event-center">
        <div className={`pp-event-icon pp-event-icon--${tone}`}>
          {iconUrl ? (
            <img src={iconUrl} alt={eventLabel(event.type, event.detail)} className="pp-event-icon-img" />
          ) : (
            <span className="pp-event-dot">•</span>
          )}
        </div>
        <span className="pp-event-minute">
          {event.minute}
          {event.extra ? `+${event.extra}` : ""}'
        </span>
      </div>

      <div className="pp-event-side pp-event-side--away">{!isHome ? content : null}</div>
    </div>
  );
}

function StateText({ children, tone = "muted" }: { children: string; tone?: "muted" | "error" }) {
  return <p className={`pp-state ${tone === "error" ? "pp-state--error" : ""}`}>{children}</p>;
}

function LineupColumn({
  tone,
  title,
  starters,
  subs,
}: {
  tone: "home" | "away";
  title: string;
  starters: LineupPlayer[];
  subs: LineupPlayer[];
}) {
  return (
    <div className={`pp-lineup-team pp-lineup-team--${tone}`}>
      <p className={`pp-lineup-title pp-lineup-title--${tone}`}>{title}</p>
      {starters.map((player) => (
        <div key={`starter-${tone}-${player.player_number}-${player.player_name}`} className="pp-player-row">
          <span className="pp-player-num">{player.player_number ?? "-"}</span>
          <span>{player.player_name}</span>
        </div>
      ))}
      {subs.length > 0 ? (
        <>
          <p className="pp-lineup-subtitle">Suplentes</p>
          {subs.map((player) => (
            <div key={`sub-${tone}-${player.player_number}-${player.player_name}`} className="pp-player-row pp-player-row--sub">
              <span className="pp-player-num">{player.player_number ?? "-"}</span>
              <span>{player.player_name}</span>
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}

export default function PartidoPasado({ match, onBack }: Props) {
  const [tab, setTab] = useState("Jugadas");
  const [eventFilter, setEventFilter] = useState<EventFilter>("todos");

  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [stats, setStats] = useState<MatchStat[]>([]);
  const [lineups, setLineups] = useState<LineupPlayer[]>([]);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLineups, setLoadingLineups] = useState(true);

  const [eventsError, setEventsError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [lineupsError, setLineupsError] = useState("");

  useEffect(() => {
    const detailUrl = `${API_URL}/api/partidos/api-football/historial/${match.id}`;

    setEvents([]);
    setStats([]);
    setLineups([]);

    setEventsError("");
    setStatsError("");
    setLineupsError("");

    setLoadingEvents(true);
    setLoadingStats(true);
    setLoadingLineups(true);

    fetch(`${detailUrl}/eventos`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setEvents(json.data);
        else setEventsError("No se pudieron cargar los eventos.");
      })
      .catch(() => setEventsError("Error de conexión."))
      .finally(() => setLoadingEvents(false));

    fetch(`${detailUrl}/stats`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
        else setStatsError("No se pudieron cargar las estadísticas.");
      })
      .catch(() => setStatsError("Error de conexión."))
      .finally(() => setLoadingStats(false));

    fetch(`${detailUrl}/lineups`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setLineups(json.data);
        else setLineupsError("No se pudieron cargar las alineaciones.");
      })
      .catch(() => setLineupsError("Error de conexión."))
      .finally(() => setLoadingLineups(false));
  }, [match.id]);

  const filteredEvents = events.filter((e) => matchesFilter(e, eventFilter));
  const firstHalf = filteredEvents.filter((e) => e.minute <= 45);
  const secondHalf = filteredEvents.filter((e) => e.minute > 45 && e.minute <= 90);
  const extraTime = filteredEvents.filter((e) => e.minute > 90);

  const homeStarters = lineups.filter((p) => p.team === "home" && !p.is_sub);
  const awayStarters = lineups.filter((p) => p.team === "away" && !p.is_sub);
  const homeSubs = lineups.filter((p) => p.team === "home" && p.is_sub);
  const awaySubs = lineups.filter((p) => p.team === "away" && p.is_sub);

  const formattedDate = new Date(match.date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="pp-root">
      <div className="pp-topbar">
        <button type="button" onClick={onBack} className="pp-back">
          ← Volver
        </button>
        <span className="pp-status">Partido finalizado</span>
      </div>

      <section className="pp-scoreboard" aria-label="Marcador del partido">
        <div className="pp-team">
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="pp-logo" />
          <span className="pp-team-name">{match.homeTeam.name}</span>
        </div>

        <div className="pp-score-center">
          <div className="pp-score-box">
            {match.homeTeam.score} - {match.awayTeam.score}
          </div>
          <p className="pp-date">{formattedDate}</p>
          <span className="pp-stadium">{match.stadium}</span>
          <p className="pp-league">{match.league}</p>
        </div>

        <div className="pp-team">
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="pp-logo" />
          <span className="pp-team-name">{match.awayTeam.name}</span>
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-tabs" role="tablist" aria-label="Detalle del partido">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`pp-tab ${tab === item ? "pp-tab--active" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === "Jugadas" ? (
          <>
            {loadingEvents ? (
              <StateText>Cargando eventos...</StateText>
            ) : eventsError ? (
              <StateText tone="error">{eventsError}</StateText>
            ) : events.length === 0 ? (
              <StateText>No hay eventos registrados.</StateText>
            ) : (
              <>
                <FilterBar active={eventFilter} onChange={setEventFilter} />
                {filteredEvents.length === 0 ? (
                  <StateText>No hay eventos de este tipo en el partido.</StateText>
                ) : (
                  <div className="pp-timeline">
                    <div className="pp-timeline-line" />
                    {firstHalf.length > 0 ? (
                      <>
                        <HalfSeparator label="Primer tiempo" />
                        {firstHalf.map((event, index) => <EventRow key={`1h-${index}`} event={event} match={match} />)}
                      </>
                    ) : null}
                    {secondHalf.length > 0 ? (
                      <>
                        <HalfSeparator label="Segundo tiempo" />
                        {secondHalf.map((event, index) => <EventRow key={`2h-${index}`} event={event} match={match} />)}
                      </>
                    ) : null}
                    {extraTime.length > 0 ? (
                      <>
                        <HalfSeparator label="Tiempo extra" />
                        {extraTime.map((event, index) => <EventRow key={`et-${index}`} event={event} match={match} />)}
                      </>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </>
        ) : null}

        {tab === "Estadísticas" ? (
          <>
            {loadingStats ? (
              <StateText>Cargando estadísticas...</StateText>
            ) : statsError ? (
              <StateText tone="error">{statsError}</StateText>
            ) : stats.length === 0 ? (
              <StateText>No hay estadísticas disponibles.</StateText>
            ) : (
              <>
                <p className="pp-section-label">Estadísticas del partido</p>
                <div className="pp-stats-list">
                  {stats.map((stat, index) => (
                    <div key={`${stat.label}-${index}`} className="pp-stat-row">
                      <span className="pp-stat-value pp-stat-value--home">{stat.home_value}</span>
                      <span className="pp-stat-label">{STATS_ES[stat.label] ?? stat.label}</span>
                      <span className="pp-stat-value pp-stat-value--away">{stat.away_value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}

        {tab === "Alineaciones" ? (
          <>
            {loadingLineups ? (
              <StateText>Cargando alineaciones...</StateText>
            ) : lineupsError ? (
              <StateText tone="error">{lineupsError}</StateText>
            ) : lineups.length === 0 ? (
              <StateText>No hay alineaciones disponibles.</StateText>
            ) : (
              <div className="pp-lineups-grid">
                <LineupColumn tone="home" title={match.homeTeam.name} starters={homeStarters} subs={homeSubs} />
                <LineupColumn tone="away" title={match.awayTeam.name} starters={awayStarters} subs={awaySubs} />
              </div>
            )}
          </>
        ) : null}
      </section>

      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="pp-scroll-top">
        Regresar
      </button>
    </div>
  );
}