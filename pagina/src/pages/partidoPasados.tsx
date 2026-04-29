import { useEffect, useState } from "react";

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
    <div style={{
      display: "flex",
      gap: "0.5rem",
      marginBottom: "1.25rem",
      flexWrap: "wrap",
    }}>
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: 999,
              border: `1.5px solid ${isActive ? "#e90052" : "#e5e7eb"}`,
              background: isActive ? "#e90052" : "#f9fafb",
              color: isActive ? "#fff" : "#6b7280",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
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
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "1.25rem -1.5rem",
      padding: "1rem 1.5rem",
      background: "linear-gradient(135deg, #1a2d42 0%, #263a55 100%)",
      position: "relative",
      zIndex: 2,
    }}>
      <span style={{
        color: "#fff",
        fontSize: "0.95rem",
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
      }}>{label}</span>
    </div>
  );
}

// ── EventRow ──────────────────────────────────────────────────────────────────
function EventRow({ event, match }: { event: MatchEvent; match: PastMatch }) {
  const isHome = event.team.name === match.homeTeam.name;
  const iconUrl = eventIconUrl(event.type, event.detail);
  const isGoal = event.type === "Goal";

  const content = (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isHome ? "flex-end" : "flex-start",
      gap: 5,
      padding: "0 0.5rem",
    }}>
      <span style={{
        fontWeight: 800,
        fontSize: "1.1rem",
        color: isGoal ? "#1a2d42" : "#111827",
        lineHeight: 1.2,
      }}>{event.player}</span>
      <span style={{
        fontSize: "0.85rem",
        color: isGoal ? "#e90052" : "#9ca3af",
        fontWeight: 700,
      }}>{eventLabel(event.type, event.detail)}</span>
      {event.assist && event.type === "Goal" && (
        <span style={{ fontSize: "0.82rem", color: "#6b7280" as const }}>
          Asist. {event.assist}
        </span>
      )}
      {event.type === "subst" && event.assist && (
        <span style={{ fontSize: "0.82rem", color: "#22c55e", fontWeight: 600 }}>
          ↑ {event.assist}
        </span>
      )}
    </div>
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 100px 1fr",
      alignItems: "center",
      gap: "0.5rem",
      padding: "1.1rem 0",
      position: "relative",
      zIndex: 1,
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>{isHome ? content : null}</div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background:
            event.type === "Goal"  ? "#ffffff"
            : event.type === "Card"  ? "#fff7ed"
            : event.type === "subst" ? "#f0fdf4"
            : "#f8fafc",
          border: `4px solid ${
            event.type === "Goal"  ? "#e90052"
            : event.type === "Card"  ? "#f97316"
            : event.type === "subst" ? "#22c55e"
            : "#e5e7eb"
          }`,
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={eventLabel(event.type, event.detail)}
              style={{ width: 48, height: 48, objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: "1.2rem", color: "#9ca3af" }}>•</span>
          )}
        </div>
        <span style={{
          fontSize: "0.8rem",
          color: "#4b5563",
          fontWeight: 800,
          background: "#f3f4f6",
          borderRadius: 6,
          padding: "2px 8px",
        }}>
          {event.minute}{event.extra ? `+${event.extra}` : ""}′
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-start" }}>{!isHome ? content : null}</div>
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
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: "#f4f6f9",
      minHeight: "100%",
      padding: "1.25rem",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#263a55", fontWeight: 700, fontSize: "1rem", padding: 0 }}>
          ← Volver
        </button>
        <span style={{ background: "#263a55", color: "#fff", fontSize: "0.75rem", fontWeight: 700, padding: "0.3rem 0.9rem", borderRadius: 999 }}>
          Partido finalizado
        </span>
      </div>

      {/* Scoreboard */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "1.75rem 1.5rem",
        marginBottom: "1rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: "0.75rem",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} style={{ width: 72, height: 72, objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: "1rem", textAlign: "center", color: "#111827" }}>{match.homeTeam.name}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#1a2d42", borderRadius: 14, padding: "0.9rem 2rem", color: "#fff", fontSize: "3rem", fontWeight: 800, letterSpacing: "0.04em" }}>
            {match.homeTeam.score} - {match.awayTeam.score}
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.8rem", textAlign: "center", margin: 0 }}>{formattedDate}</p>
          <div style={{ background: "#263a55", color: "#fff", fontSize: "0.75rem", fontWeight: 600, padding: "0.35rem 0.9rem", borderRadius: 8 }}>{match.stadium}</div>
          <p style={{ color: "#9ca3af", fontSize: "0.78rem", textAlign: "center", margin: 0 }}>{match.league}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} style={{ width: 72, height: 72, objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: "1rem", textAlign: "center", color: "#111827" }}>{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Panel con tabs */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "1.5rem", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              padding: "0.8rem 0",
              border: "none",
              borderRight: "1px solid #e5e7eb",
              cursor: "pointer",
              background: tab === t ? "#e90052" : "#fff",
              color: tab === t ? "#fff" : "#84878f",
              fontWeight: tab === t ? 700 : 500,
              fontSize: "0.92rem",
              transition: "all 0.2s",
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab: Jugadas ── */}
        {tab === "Jugadas" && (
          <>
            {loadingEvents ? (
              <p style={{ color: "#84878f", fontSize: "1rem", padding: "1rem 0" }}>Cargando eventos...</p>
            ) : eventsError ? (
              <p style={{ color: "#b91c1c", fontSize: "1rem", padding: "1rem 0", fontWeight: 600 }}>{eventsError}</p>
            ) : events.length === 0 ? (
              <p style={{ color: "#84878f", fontSize: "1rem", padding: "1rem 0" }}>No hay eventos registrados.</p>
            ) : (
              <>
                <FilterBar active={eventFilter} onChange={setEventFilter} />

                {filteredEvents.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: "0.95rem", textAlign: "center", padding: "2rem 0" }}>
                    No hay eventos de este tipo en el partido.
                  </p>
                ) : (
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: "#e5e7eb",
                      transform: "translateX(-50%)",
                      zIndex: 0,
                    }} />

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
              <p style={{ color: "#84878f", fontSize: "1rem", padding: "1rem 0" }}>Cargando estadísticas...</p>
            ) : statsError ? (
              <p style={{ color: "#b91c1c", fontSize: "1rem", fontWeight: 600 }}>{statsError}</p>
            ) : stats.length === 0 ? (
              <p style={{ color: "#84878f", fontSize: "1rem", padding: "1rem 0" }}>No hay estadísticas disponibles.</p>
            ) : (
              <>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 10, letterSpacing: "0.06em" }}>
                  Estadísticas del partido
                </p>
                {stats.map((s, idx) => (
                  <div key={`${s.label}-${idx}`} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    gap: 10,
                    alignItems: "center",
                    padding: "0.75rem 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}>
                    <span style={{ fontWeight: 700, color: "#263a55", fontSize: "1rem" }}>{s.home_value}</span>
                    <span style={{ color: "#9ca3af", fontSize: "0.82rem", textAlign: "center", minWidth: 130 }}>
                      {STATS_ES[s.label] ?? s.label}
                    </span>
                    <span style={{ fontWeight: 700, color: "#e90052", textAlign: "right", fontSize: "1rem" }}>{s.away_value}</span>
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
              <p style={{ color: "#84878f", fontSize: "1rem", padding: "1rem 0" }}>Cargando alineaciones...</p>
            ) : lineupsError ? (
              <p style={{ color: "#b91c1c", fontSize: "1rem", fontWeight: 600 }}>{lineupsError}</p>
            ) : lineups.length === 0 ? (
              <p style={{ color: "#84878f", fontSize: "1rem", padding: "1rem 0" }}>No hay alineaciones disponibles.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {/* Local */}
                <div style={{ borderRight: "1px solid #f0f0f0" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#263a55", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, padding: "0 0.75rem" }}>
                    {match.homeTeam.name}
                  </p>
                  {homeStarters.map((p) => (
                    <div key={p.player_number} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.7rem 0.75rem", borderBottom: "1px solid #f7f7f7", fontSize: "0.92rem", color: "#1f2937" }}>
                      <span style={{ color: "#9ca3af", fontSize: "0.8rem", fontWeight: 700, minWidth: 22, textAlign: "right", flexShrink: 0 }}>{p.player_number ?? "-"}</span>
                      <span>{p.player_name}</span>
                    </div>
                  ))}
                  {homeSubs.length > 0 && (
                    <>
                      <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.08em", padding: "0.6rem 0.75rem 0.3rem" }}>SUPLENTES</p>
                      {homeSubs.map((p) => (
                        <div key={p.player_number} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.7rem 0.75rem", borderBottom: "1px solid #f7f7f7", fontSize: "0.92rem", color: "#6b7280" }}>
                          <span style={{ color: "#9ca3af", fontSize: "0.8rem", fontWeight: 700, minWidth: 22, textAlign: "right", flexShrink: 0 }}>{p.player_number ?? "-"}</span>
                          <span>{p.player_name}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Visitante */}
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#e90052", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, padding: "0 0.75rem" }}>
                    {match.awayTeam.name}
                  </p>
                  {awayStarters.map((p) => (
                    <div key={p.player_number} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.7rem 0.75rem", borderBottom: "1px solid #f7f7f7", fontSize: "0.92rem", color: "#1f2937" }}>
                      <span style={{ color: "#9ca3af", fontSize: "0.8rem", fontWeight: 700, minWidth: 22, textAlign: "right", flexShrink: 0 }}>{p.player_number ?? "-"}</span>
                      <span>{p.player_name}</span>
                    </div>
                  ))}
                  {awaySubs.length > 0 && (
                    <>
                      <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.08em", padding: "0.6rem 0.75rem 0.3rem" }}>SUPLENTES</p>
                      {awaySubs.map((p) => (
                        <div key={p.player_number} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.7rem 0.75rem", borderBottom: "1px solid #f7f7f7", fontSize: "0.92rem", color: "#6b7280" }}>
                          <span style={{ color: "#9ca3af", fontSize: "0.8rem", fontWeight: 700, minWidth: 22, textAlign: "right", flexShrink: 0 }}>{p.player_number ?? "-"}</span>
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
        style={{
          display: "block",
          margin: "1.5rem auto 0",
          padding: "0.75rem 2rem",
          borderRadius: 999,
          border: "none",
          background: "#1a2d42",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.88rem",
          cursor: "pointer",
          letterSpacing: "0.05em",
        }}
      >
        Volver arriba
      </button>

    </div>
  );
}