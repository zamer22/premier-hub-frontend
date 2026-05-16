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
  player_number: number;
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
  { key: "todos",         label: "Todos"         },
  { key: "goles",         label: "Goles"         },
  { key: "amarillas",     label: "Amarillas"     },
  { key: "rojas",         label: "Rojas"         },
  { key: "sustituciones", label: "Sustituciones" },
];

const STATS_ES: Record<string, string> = {
  "Shots on Goal":    "Tiros a puerta",
  "Shots off Goal":   "Tiros fuera",
  "Total Shots":      "Tiros totales",
  "Blocked Shots":    "Tiros bloqueados",
  "Shots insidebox":  "Tiros dentro del área",
  "Shots outsidebox": "Tiros fuera del área",
  "Fouls":            "Faltas",
  "Corner Kicks":     "Tiros de esquina",
  "Offsides":         "Fueras de juego",
  "Ball Possession":  "Posesión del balón",
  "Yellow Cards":     "Tarjetas amarillas",
  "Red Cards":        "Tarjetas rojas",
  "Goalkeeper Saves": "Atajadas",
  "Total passes":     "Pases totales",
  "Passes accurate":  "Pases precisos",
  "Passes %":         "Precisión de pases",
  "expected_goals":   "Goles esperados (xG)",
  "goals_prevented":  "Goles evitados",
};

const EVENT_ICONS: Record<string, string> = {
  goal:   "https://images.vexels.com/media/users/3/158409/isolated/preview/b0af06a4c1a8e7a31ce379250130d26c-pelota-de-futbol-pentagono-silueta.png",
  yellow: "https://stylfoot.fr/3641-thickbox_01icon/referee-yellow-card.jpg",
  red:    "https://stylfoot.fr/3640/referee-red-card.jpg",
  subst:  "https://images.vexels.com/media/users/3/146860/isolated/lists/bbe607c0831621bfe4606d241ef04f8a-icono-de-sustituto-de-futbol.png",
};

function eventIconUrl(type: string, detail: string): string | null {
  if (type === "Goal") return EVENT_ICONS.goal;
  if (type === "Card") {
    if (detail.includes("Red")) return EVENT_ICONS.red;
    return EVENT_ICONS.yellow;
  }
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
  if (filter === "todos")         return true;
  if (filter === "goles")         return event.type === "Goal";
  if (filter === "amarillas")     return event.type === "Card" && !event.detail.includes("Red");
  if (filter === "rojas")         return event.type === "Card" && (event.detail === "Red Card" || event.detail === "Yellow Red Card");
  if (filter === "sustituciones") return event.type === "subst";
  return true;
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
function FilterBar({
  active,
  onChange,
}: {
  active: EventFilter;
  onChange: (f: EventFilter) => void;
}) {
  return (
    <div className="past-match__filters">
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`past-match__filter ${isActive ? "is-active" : ""}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── HalfSeparator ─────────────────────────────────────────────────────────────
function HalfSeparator({ label }: { label: string }) {
  return (
    <div className="past-match__half">
      <span className="past-match__half-label">{label}</span>
    </div>
  );
}

// ── EventRow ──────────────────────────────────────────────────────────────────
function EventRow({ event, match }: { event: MatchEvent; match: PastMatch }) {
  const isHome = event.team.name === match.homeTeam.name;
  const iconUrl = eventIconUrl(event.type, event.detail);
  const isGoal = event.type === "Goal";

  const content = (
    <div className={`past-match__event-content ${isHome ? "is-home" : "is-away"}`}>
      <span className={`past-match__event-player ${isGoal ? "is-goal" : ""}`}>{event.player}</span>
      <span className={`past-match__event-label ${isGoal ? "is-goal" : ""}`}>{eventLabel(event.type, event.detail)}</span>
      {event.assist && event.type === "Goal" && (
        <span className="past-match__event-assist">Asist. {event.assist}</span>
      )}
      {event.type === "subst" && event.assist && (
        <span className="past-match__event-sub">↑ {event.assist}</span>
      )}
    </div>
  );

  const typeClass = event.type === "Goal"
    ? "is-goal"
    : event.type === "Card"
    ? "is-card"
    : event.type === "subst"
    ? "is-subst"
    : "is-default";

  return (
    <div className="past-match__event-row">
      <div className="past-match__event-side past-match__event-side--left">{isHome ? content : null}</div>

      <div className="past-match__event-center">
        <div className={`past-match__event-icon ${typeClass}`}>
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={eventLabel(event.type, event.detail)}
              className="past-match__event-icon-img"
            />
          ) : (
            <span className="past-match__event-icon-dot">•</span>
          )}
        </div>
        <span className="past-match__event-minute">
          {event.minute}{event.extra ? `+${event.extra}` : ""}′
        </span>
      </div>

      <div className="past-match__event-side past-match__event-side--right">{!isHome ? content : null}</div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PartidoPasado({ match, onBack }: Props) {
  const [tab, setTab] = useState("Jugadas");
  const [eventFilter, setEventFilter] = useState<EventFilter>("todos");

  const [events, setEvents]   = useState<MatchEvent[]>([]);
  const [stats, setStats]     = useState<MatchStat[]>([]);
  const [lineups, setLineups] = useState<LineupPlayer[]>([]);

  const [loadingEvents,  setLoadingEvents]  = useState(true);
  const [loadingStats,   setLoadingStats]   = useState(true);
  const [loadingLineups, setLoadingLineups] = useState(true);

  const [eventsError,  setEventsError]  = useState("");
  const [statsError,   setStatsError]   = useState("");
  const [lineupsError, setLineupsError] = useState("");

  useEffect(() => {
    setLoadingEvents(true);
    setLoadingStats(true);
    setLoadingLineups(true);

    fetch(`${API_URL}/api/partidos/historial/${match.id}/eventos`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setEvents(json.data); else setEventsError("No se pudieron cargar los eventos."); })
      .catch(() => setEventsError("Error de conexión."))
      .finally(() => setLoadingEvents(false));

    fetch(`${API_URL}/api/partidos/historial/${match.id}/stats`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setStats(json.data); else setStatsError("No se pudieron cargar las estadísticas."); })
      .catch(() => setStatsError("Error de conexión."))
      .finally(() => setLoadingStats(false));

    fetch(`${API_URL}/api/partidos/historial/${match.id}/lineups`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setLineups(json.data); else setLineupsError("No se pudieron cargar las alineaciones."); })
      .catch(() => setLineupsError("Error de conexión."))
      .finally(() => setLoadingLineups(false));
  }, [match.id]);

  const filteredEvents = events.filter((e) => matchesFilter(e, eventFilter));

  const firstHalf  = filteredEvents.filter((e) => e.minute <= 45);
  const secondHalf = filteredEvents.filter((e) => e.minute > 45 && e.minute <= 90);
  const extraTime  = filteredEvents.filter((e) => e.minute > 90);

  const homeStarters = lineups.filter((p) => p.team === "home" && !p.is_sub);
  const awayStarters = lineups.filter((p) => p.team === "away" && !p.is_sub);
  const homeSubs     = lineups.filter((p) => p.team === "home" && p.is_sub);
  const awaySubs     = lineups.filter((p) => p.team === "away" && p.is_sub);

  const formattedDate = new Date(match.date).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="past-match">
      {/* Header */}
      <div className="past-match__header">
        <button type="button" onClick={onBack} className="past-match__back">
          ← Volver
        </button>
        <span className="past-match__status">
          Partido finalizado
        </span>
      </div>

      {/* Scoreboard */}
      <div className="past-match__scoreboard">
        <div className="past-match__team">
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="past-match__team-logo" />
          <span className="past-match__team-name">{match.homeTeam.name}</span>
        </div>
        <div className="past-match__score-center">
          <div className="past-match__score-box">
            {match.homeTeam.score} - {match.awayTeam.score}
          </div>
          <p className="past-match__meta">{formattedDate}</p>
          <div className="past-match__stadium">{match.stadium}</div>
          <p className="past-match__league">{match.league}</p>
        </div>
        <div className="past-match__team">
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="past-match__team-logo" />
          <span className="past-match__team-name">{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Panel con tabs */}
      <div className="past-match__panel">
        {/* Tabs */}
        <div className="past-match__tabs">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`past-match__tab ${tab === t ? "is-active" : ""}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab: Jugadas ── */}
        {tab === "Jugadas" && (
          <>
            {loadingEvents ? (
              <p className="past-match__message">Cargando eventos...</p>
            ) : eventsError ? (
              <p className="past-match__message past-match__message--error">{eventsError}</p>
            ) : events.length === 0 ? (
              <p className="past-match__message">No hay eventos registrados.</p>
            ) : (
              <>
                <FilterBar active={eventFilter} onChange={setEventFilter} />

                {filteredEvents.length === 0 ? (
                  <p className="past-match__empty">
                    No hay eventos de este tipo en el partido.
                  </p>
                ) : (
                  <div className="past-match__timeline">
                    <div className="past-match__timeline-line" />

                    {firstHalf.length > 0 && (
                      <>
                        <HalfSeparator label="Primer Tiempo" />
                        {firstHalf.map((e, i) => <EventRow key={`1h-${i}`} event={e} match={match} />)}
                      </>
                    )}

                    {secondHalf.length > 0 && (
                      <>
                        <HalfSeparator label="Segundo Tiempo" />
                        {secondHalf.map((e, i) => <EventRow key={`2h-${i}`} event={e} match={match} />)}
                      </>
                    )}

                    {extraTime.length > 0 && (
                      <>
                        <HalfSeparator label="Tiempo Extra" />
                        {extraTime.map((e, i) => <EventRow key={`et-${i}`} event={e} match={match} />)}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Tab: Estadísticas ── */}
        {tab === "Estadísticas" && (
          <>
            {loadingStats ? (
              <p className="past-match__message">Cargando estadísticas...</p>
            ) : statsError ? (
              <p className="past-match__message past-match__message--error">{statsError}</p>
            ) : stats.length === 0 ? (
              <p className="past-match__message">No hay estadísticas disponibles.</p>
            ) : (
              <>
                <p className="past-match__stats-title">
                  Estadísticas del partido
                </p>
                {stats.map((s, idx) => (
                  <div key={`${s.label}-${idx}`} className="past-match__stat-row">
                    <span className="past-match__stat-home">{s.home_value}</span>
                    <span className="past-match__stat-label">
                      {STATS_ES[s.label] ?? s.label}
                    </span>
                    <span className="past-match__stat-away">{s.away_value}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── Tab: Alineaciones ── */}
        {tab === "Alineaciones" && (
          <>
            {loadingLineups ? (
              <p className="past-match__message">Cargando alineaciones...</p>
            ) : lineupsError ? (
              <p className="past-match__message past-match__message--error">{lineupsError}</p>
            ) : lineups.length === 0 ? (
              <p className="past-match__message">No hay alineaciones disponibles.</p>
            ) : (
              <div className="past-match__lineups">
                {/* Local */}
                <div className="past-match__lineup-col past-match__lineup-col--left">
                  <p className="past-match__lineup-title past-match__lineup-title--home">
                    {match.homeTeam.name}
                  </p>
                  {homeStarters.map((p) => (
                    <div key={p.player_number} className="past-match__lineup-row">
                      <span className="past-match__lineup-num">{p.player_number ?? "-"}</span>
                      <span>{p.player_name}</span>
                    </div>
                  ))}
                  {homeSubs.length > 0 && (
                    <>
                      <p className="past-match__lineup-subtitle">SUPLENTES</p>
                      {homeSubs.map((p) => (
                        <div key={p.player_number} className="past-match__lineup-row past-match__lineup-row--sub">
                          <span className="past-match__lineup-num">{p.player_number ?? "-"}</span>
                          <span>{p.player_name}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Visitante */}
                <div className="past-match__lineup-col">
                  <p className="past-match__lineup-title past-match__lineup-title--away">
                    {match.awayTeam.name}
                  </p>
                  {awayStarters.map((p) => (
                    <div key={p.player_number} className="past-match__lineup-row">
                      <span className="past-match__lineup-num">{p.player_number ?? "-"}</span>
                      <span>{p.player_name}</span>
                    </div>
                  ))}
                  {awaySubs.length > 0 && (
                    <>
                      <p className="past-match__lineup-subtitle">SUPLENTES</p>
                      {awaySubs.map((p) => (
                        <div key={p.player_number} className="past-match__lineup-row past-match__lineup-row--sub">
                          <span className="past-match__lineup-num">{p.player_number ?? "-"}</span>
                          <span>{p.player_name}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Botón volver arriba */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="past-match__back-top"
      >
        Regresar
      </button>

    </div>
  );
}
