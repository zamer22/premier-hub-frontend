import { useEffect, useMemo, useState } from "react";
import "../estilos/PartidosVivo.css";

export interface LiveMatch {
  id: number;
  league: string;
  minute: string;
  stadium: string;
  status: string;
  homeTeam: { name: string; logo: string; score: number };
  awayTeam: { name: string; logo: string; score: number };
}

interface PartidosVivoProps {
  match: LiveMatch;
  onBack: () => void;
}

interface LineupRow {
  fixture_id: number;
  team: "home" | "away";
  player_number: number | null;
  player_name: string;
  is_sub: boolean;
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

const API_URL = import.meta.env.VITE_API_URL;
const TABS = ["Alineaciones", "Estadísticas", "H2H"];

const STATS_ES: Record<string, string> = {
  "Shots on Goal":      "Tiros a puerta",
  "Shots off Goal":     "Tiros fuera",
  "Total Shots":        "Tiros totales",
  "Blocked Shots":      "Tiros bloqueados",
  "Shots insidebox":    "Tiros dentro del área",
  "Shots outsidebox":   "Tiros fuera del área",
  "Fouls":              "Faltas",
  "Corner Kicks":       "Tiros de esquina",
  "Offsides":           "Fueras de juego",
  "Ball Possession":    "Posesión del balón",
  "Yellow Cards":       "Tarjetas amarillas",
  "Red Cards":          "Tarjetas rojas",
  "Goalkeeper Saves":   "Atajadas",
  "Total passes":       "Pases totales",
  "Passes accurate":    "Pases precisos",
  "Passes %":           "Precisión de pases",
  "expected_goals":     "Goles esperados (xG)",
  "goals_prevented":    "Goles evitados",
};

const Shirt = ({ className }: { className: string }) => (
  <div className={`pv-shirt ${className}`}>
    <svg viewBox="0 0 24 24" className="pv-shirt__icon" aria-hidden="true">
      <path d="M16 2H8L6 5 2 7l2 4 2-1v13h16V10l2 1 2-4-4-2-2-3z" />
    </svg>
  </div>
);

export default function PartidosVivo({ match, onBack }: PartidosVivoProps) {
  const [tab, setTab] = useState("Alineaciones");
  const [equipoSust, setEquipoSust] = useState<"home" | "away">("home");

  const [lineups, setLineups] = useState<LineupRow[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [h2h, setH2H] = useState<H2HRow[]>([]);

  const [loadingLineups, setLoadingLineups] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingH2H, setLoadingH2H] = useState(true);

  const [lineupsError, setLineupsError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [h2hError, setH2HError] = useState("");

  useEffect(() => {
    const loadLineups = async () => {
      try {
        setLoadingLineups(true);
        setLineupsError("");

        const res = await fetch(`${API_URL}/api/partidos/live/${match.id}/lineups`);
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status} al cargar alineaciones`);
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLineups(json.data);
        } else {
          setLineups([]);
          setLineupsError("La respuesta de alineaciones no vino en el formato esperado.");
        }
      } catch (error: any) {
        setLineups([]);
        setLineupsError(error?.message || "No se pudieron cargar las alineaciones.");
      } finally {
        setLoadingLineups(false);
      }
    };

    const loadStats = async () => {
      try {
        setLoadingStats(true);
        setStatsError("");

        const res = await fetch(`${API_URL}/api/partidos/live/${match.id}/stats`);
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status} al cargar estadísticas`);
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setStats(json.data);
        } else {
          setStats([]);
          setStatsError("La respuesta de estadísticas no vino en el formato esperado.");
        }
      } catch (error: any) {
        setStats([]);
        setStatsError(error?.message || "No se pudieron cargar las estadísticas.");
      } finally {
        setLoadingStats(false);
      }
    };

    const loadH2H = async () => {
      try {
        setLoadingH2H(true);
        setH2HError("");

        const res = await fetch(`${API_URL}/api/partidos/live/${match.id}/h2h`);
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status} al cargar H2H`);
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setH2H(json.data);
        } else {
          setH2H([]);
          setH2HError("La respuesta de H2H no vino en el formato esperado.");
        }
      } catch (error: any) {
        setH2H([]);
        setH2HError(error?.message || "No se pudo cargar el H2H.");
      } finally {
        setLoadingH2H(false);
      }
    };

    if (match?.id) {
      loadLineups();
      loadStats();
      loadH2H();
    } else {
      setLineups([]);
      setStats([]);
      setH2H([]);
      setLineupsError("No llegó el id del partido.");
      setStatsError("No llegó el id del partido.");
      setH2HError("No llegó el id del partido.");
      setLoadingLineups(false);
      setLoadingStats(false);
      setLoadingH2H(false);
    }
  }, [match]);

  const homeStarters = useMemo(
    () => lineups.filter((p) => p.team === "home" && !p.is_sub),
    [lineups]
  );

  const awayStarters = useMemo(
    () => lineups.filter((p) => p.team === "away" && !p.is_sub),
    [lineups]
  );

  const homeSubs = useMemo(
    () => lineups.filter((p) => p.team === "home" && p.is_sub),
    [lineups]
  );

  const awaySubs = useMemo(
    () => lineups.filter((p) => p.team === "away" && p.is_sub),
    [lineups]
  );

  const sustituciones = equipoSust === "home" ? homeSubs : awaySubs;

  return (
    <div className="pv-root">
      {/* HEADER — sin minuto */}
      <div className="pv-header">
        <button type="button" onClick={onBack} className="pv-back">
          ← Volver
        </button>

        <div className="pv-live-chip">
          <div className="pv-live-dot" />
          <span className="pv-live-badge">EN VIVO</span>
        </div>
      </div>

      {/* SCOREBOARD — orden: score → minuto → estadio */}
      <div className="pv-scoreboard">
        <div className="pv-team">
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="pv-team-logo" />
          <span className="pv-team-name">{match.homeTeam.name}</span>
        </div>

        <div className="pv-score-center">
          <div className="pv-score-box">
            {match.homeTeam.score} - {match.awayTeam.score}
          </div>
          <span className="pv-score-minute">{match.minute}</span>
          <div className="pv-stadium">{match.stadium}</div>
        </div>

        <div className="pv-team">
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="pv-team-logo" />
          <span className="pv-team-name">{match.awayTeam.name}</span>
        </div>
      </div>

      <div className="pv-main-grid">
        <div className="pv-panel">
          <div className="pv-tabs">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`pv-tab ${tab === t ? "is-active" : ""}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "Alineaciones" && (
            <div>
              <div className="pv-pitch">
                <div className="pv-pitch__mid" />
                <div className="pv-pitch__circle" />
                <div className="pv-pitch__center-dot" />
                <div className="pv-pitch__area pv-pitch__area--left" />
                <div className="pv-pitch__area pv-pitch__area--left-small" />
                <div className="pv-pitch__area pv-pitch__area--right" />
                <div className="pv-pitch__area pv-pitch__area--right-small" />

                <Shirt className="pv-shirt--home pv-shirt--h1" />
                <Shirt className="pv-shirt--home pv-shirt--h2" />
                <Shirt className="pv-shirt--home pv-shirt--h3" />
                <Shirt className="pv-shirt--home pv-shirt--h4" />
                <Shirt className="pv-shirt--home pv-shirt--h5" />
                <Shirt className="pv-shirt--home pv-shirt--h6" />
                <Shirt className="pv-shirt--home pv-shirt--h7" />
                <Shirt className="pv-shirt--home pv-shirt--h8" />
                <Shirt className="pv-shirt--home pv-shirt--h9" />
                <Shirt className="pv-shirt--home pv-shirt--h10" />
                <Shirt className="pv-shirt--home pv-shirt--h11" />

                <Shirt className="pv-shirt--away pv-shirt--a1" />
                <Shirt className="pv-shirt--away pv-shirt--a2" />
                <Shirt className="pv-shirt--away pv-shirt--a3" />
                <Shirt className="pv-shirt--away pv-shirt--a4" />
                <Shirt className="pv-shirt--away pv-shirt--a5" />
                <Shirt className="pv-shirt--away pv-shirt--a6" />
                <Shirt className="pv-shirt--away pv-shirt--a7" />
                <Shirt className="pv-shirt--away pv-shirt--a8" />
                <Shirt className="pv-shirt--away pv-shirt--a9" />
                <Shirt className="pv-shirt--away pv-shirt--a10" />
              </div>

              {loadingLineups ? (
                <p className="pv-empty">Cargando alineaciones...</p>
              ) : lineupsError ? (
                <p className="pv-error">{lineupsError}</p>
              ) : lineups.length === 0 ? (
                <p className="pv-empty">No hay alineaciones disponibles para este partido.</p>
              ) : (
                <div className="pv-lineup-grid">
                  <div className="pv-lineup-col pv-lineup-col--left">
                    <p className="pv-lineup-title pv-lineup-title--home">{match.homeTeam.name}</p>
                    {homeStarters.map((j, idx) => (
                      <div key={`home-${idx}`} className="pv-lineup-row">
                        <span className="pv-lineup-num">{j.player_number ?? "-"}</span>
                        <span>{j.player_name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pv-lineup-col">
                    <p className="pv-lineup-title pv-lineup-title--away">{match.awayTeam.name}</p>
                    {awayStarters.map((j, idx) => (
                      <div key={`away-${idx}`} className="pv-lineup-row">
                        <span className="pv-lineup-num">{j.player_number ?? "-"}</span>
                        <span>{j.player_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "Estadísticas" && (
            <div>
              {loadingStats ? (
                <p className="pv-empty">Cargando estadísticas...</p>
              ) : statsError ? (
                <p className="pv-error">{statsError}</p>
              ) : stats.length === 0 ? (
                <p className="pv-empty">No hay estadísticas disponibles para este partido.</p>
              ) : (
                <>
                  <p className="pv-stats-label">Estadísticas del partido</p>
                  {stats.map((s, idx) => (
                    <div key={`${s.label}-${idx}`} className="pv-stat-row">
                      <span className="pv-stat-home">{s.home_value}</span>
                      <span className="pv-stat-label">
                        {STATS_ES[s.label] ?? s.label}
                      </span>
                      <span className="pv-stat-away">{s.away_value}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "H2H" && (
            <div>
              {loadingH2H ? (
                <p className="pv-empty">Cargando historial...</p>
              ) : h2hError ? (
                <p className="pv-error">{h2hError}</p>
              ) : h2h.length === 0 ? (
                <p className="pv-empty">No hay historial disponible para estos equipos.</p>
              ) : (
                <>
                  <p className="pv-stats-label">Últimos enfrentamientos</p>

                  {h2h.map((item, idx) => (
                    <div
                      key={`${item.fixture_id}-${idx}`}
                      className="pv-h2h-row"
                    >
                      <span className="pv-h2h-date">
                        {new Date(item.date).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {item.league}
                      </span>

                      <div className="pv-h2h-match">
                        <div className="pv-h2h-team">
                          <img
                            src={item.home.logo}
                            alt={item.home.name}
                            className="pv-h2h-logo"
                          />
                          <span>{item.home.name}</span>
                        </div>

                        <strong className="pv-h2h-score">
                          {item.home.goals} - {item.away.goals}
                        </strong>

                        <div className="pv-h2h-team pv-h2h-team--away">
                          <span>{item.away.name}</span>
                          <img
                            src={item.away.logo}
                            alt={item.away.name}
                            className="pv-h2h-logo"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="pv-subs">
          <div className="pv-subs__header">
            <span className="pv-subs__title">Sustituciones</span>
          </div>

          <div className="pv-subs__selector">
            <button
              onClick={() => setEquipoSust("home")}
              className={`pv-subs__btn ${equipoSust === "home" ? "is-active" : ""}`}
            >
              <img src={match.homeTeam.logo} alt="" className="pv-subs__logo" />
            </button>
            <button
              onClick={() => setEquipoSust("away")}
              className={`pv-subs__btn ${equipoSust === "away" ? "is-active" : ""}`}
            >
              <img src={match.awayTeam.logo} alt="" className="pv-subs__logo" />
            </button>
          </div>

          {loadingLineups ? (
            <p className="pv-empty">Cargando banca...</p>
          ) : lineupsError ? (
            <p className="pv-error">{lineupsError}</p>
          ) : sustituciones.length === 0 ? (
            <p className="pv-empty">No hay suplentes disponibles.</p>
          ) : (
            sustituciones.map((s, i) => (
              <div key={i} className="pv-subs__row">
                <div className="pv-subs__num">{s.player_number ?? "-"}</div>
                <span>{s.player_name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}