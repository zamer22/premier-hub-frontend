import { useEffect, useMemo, useState } from "react";

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

const API_URL = import.meta.env.DEV ? "" : "https://api.zamer-o.com";
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

const Shirt = ({ color, x, y }: { color: string; x: string; y: string }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translate(-50%, -50%)",
      width: 18,
      height: 18,
    }}
  >
    <svg
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        height: "100%",
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
      }}
    >
      <path d="M16 2H8L6 5 2 7l2 4 2-1v13h16V10l2 1 2-4-4-2-2-3z" />
    </svg>
  </div>
);

const S = {
  root: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: "#f4f6f9",
    minHeight: "100%",
    padding: "1.25rem",
    boxSizing: "border-box" as const,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  backBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#263a55",
    fontWeight: 700,
    fontSize: "0.95rem",
    padding: 0,
  },
  liveChip: { display: "flex", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: "#e90052" },
  liveBadge: {
    background: "#e90052",
    color: "#fff",
    fontSize: "0.72rem",
    fontWeight: 800,
    padding: "0.28rem 0.6rem",
    borderRadius: 999,
  },

  scoreboard: {
    background: "#fff",
    borderRadius: 14,
    padding: "1.5rem 2rem",
    marginBottom: "1rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "1rem",
  },
  teamBlock: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
  },
  teamLogo: { width: 64, height: 64, objectFit: "contain" as const },
  teamName: {
    fontWeight: 700,
    fontSize: "0.95rem",
    textAlign: "center" as const,
    color: "#111827",
  },
  scoreCenter: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
  },
  stadiumTag: {
    background: "#263a55",
    color: "#fff",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.35rem 0.9rem",
    borderRadius: 8,
  },
  scoreBox: {
    background: "#1a2d42",
    borderRadius: 12,
    padding: "0.8rem 2.5rem",
    color: "#fff",
    fontSize: "2.8rem",
    fontWeight: 800,
  },
  scoreMinute: { color: "#e90052", fontWeight: 700, fontSize: "0.9rem" },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    gap: "1rem",
    alignItems: "start",
  },
  panel: {
    background: "#fff",
    borderRadius: 14,
    padding: "1.25rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  },
  tabsWrapper: {
    display: "flex",
    marginBottom: "1.25rem",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  tab: (active: boolean) => ({
    flex: 1,
    padding: "0.6rem 0",
    border: "none",
    borderRight: "1px solid #e5e7eb",
    cursor: "pointer",
    background: active ? "#e90052" : "#fff",
    color: active ? "#fff" : "#84878f",
    fontWeight: active ? 700 : 500,
    fontSize: "0.85rem",
    transition: "all 0.2s",
  }),

  pitch: {
    borderRadius: 10,
    height: 180,
    marginBottom: "1.25rem",
    position: "relative" as const,
    overflow: "hidden",
    background:
      "repeating-linear-gradient(90deg, #2d7a4f 0px, #2d7a4f 36px, #317f53 36px, #317f53 72px)",
  },
  pitchMid: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    left: "50%",
    width: 2,
    background: "rgba(255,255,255,0.25)",
  },
  pitchCircle: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width: 56,
    height: 56,
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "50%",
  },
  pitchCenterDot: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width: 5,
    height: 5,
    background: "rgba(255,255,255,0.5)",
    borderRadius: "50%",
  },
  pitchAreaLeft: {
    position: "absolute" as const,
    top: "18%",
    left: 0,
    width: "14%",
    height: "64%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderLeft: "none",
  },
  pitchAreaLeftSmall: {
    position: "absolute" as const,
    top: "33%",
    left: 0,
    width: "6%",
    height: "34%",
    border: "2px solid rgba(255,255,255,0.25)",
    borderLeft: "none",
  },
  pitchAreaRight: {
    position: "absolute" as const,
    top: "18%",
    right: 0,
    width: "14%",
    height: "64%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRight: "none",
  },
  pitchAreaRightSmall: {
    position: "absolute" as const,
    top: "33%",
    right: 0,
    width: "6%",
    height: "34%",
    border: "2px solid rgba(255,255,255,0.25)",
    borderRight: "none",
  },

  lineupGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" },
  lineupTitle: (color: string) => ({
    fontWeight: 600,
    fontSize: "0.7rem",
    color,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 6,
    padding: "0 0.75rem",
  }),
  playerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0.5rem 0.75rem",
    borderBottom: "1px solid #f7f7f7",
    fontSize: "0.82rem",
    color: "#1f2937",
  },
  playerNum: {
    color: "#9ca3af",
    fontSize: "0.7rem",
    fontWeight: 600,
    minWidth: 18,
    textAlign: "right" as const,
    flexShrink: 0,
  },

  statsLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    marginBottom: 6,
    letterSpacing: "0.05em",
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 8,
    alignItems: "center",
    padding: "0.45rem 0",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "0.85rem",
  },

  subsPanel: {
    background: "#fff",
    borderRadius: 14,
    padding: "1.25rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  },
  subsPanelHeader: {
    background: "#e90052",
    borderRadius: 9,
    padding: "0.6rem 1rem",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  subsPanelTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    margin: 0,
  },
  subsSelector: {
    display: "flex",
    gap: 4,
    marginBottom: "1rem",
    background: "#f0f2f5",
    borderRadius: 9,
    padding: 4,
  },
  subsBtn: (active: boolean) => ({
    flex: 1,
    padding: "0.4rem",
    border: "none",
    borderRadius: 7,
    background: active ? "#263a55" : "transparent",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "background 0.2s",
  }),
  subsLogoSmall: { width: 26, height: 26, objectFit: "contain" as const },
  subsRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0.45rem 0",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "0.82rem",
  },
  subsNum: {
    background: "#f0f2f5",
    borderRadius: "50%",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.72rem",
    flexShrink: 0,
    color: "#263a55",
  },

  empty: {
    color: "#84878f",
    fontSize: "0.9rem",
    padding: "0.75rem 0",
  },
  error: {
    color: "#b91c1c",
    fontSize: "0.9rem",
    padding: "0.75rem 0",
    fontWeight: 600,
  },
};

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
    <div style={S.root}>
      {/* HEADER — sin minuto */}
      <div style={S.header}>
        <button type="button" onClick={onBack} style={S.backBtn}>
          ← Volver
        </button>

        <div style={S.liveChip}>
          <div style={S.liveDot} />
          <span style={S.liveBadge}>EN VIVO</span>
        </div>
      </div>

      {/* SCOREBOARD — orden: score → minuto → estadio */}
      <div style={S.scoreboard}>
        <div style={S.teamBlock}>
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} style={S.teamLogo} />
          <span style={S.teamName}>{match.homeTeam.name}</span>
        </div>

        <div style={S.scoreCenter}>
          <div style={S.scoreBox}>
            {match.homeTeam.score} - {match.awayTeam.score}
          </div>
          <span style={S.scoreMinute}>{match.minute}</span>
          <div style={S.stadiumTag}>📍 {match.stadium}</div>
        </div>

        <div style={S.teamBlock}>
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} style={S.teamLogo} />
          <span style={S.teamName}>{match.awayTeam.name}</span>
        </div>
      </div>

      <div style={S.mainGrid}>
        <div style={S.panel}>
          <div style={S.tabsWrapper}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={S.tab(tab === t)}>
                {t}
              </button>
            ))}
          </div>

          {tab === "Alineaciones" && (
            <div>
              <div style={S.pitch}>
                <div style={S.pitchMid} />
                <div style={S.pitchCircle} />
                <div style={S.pitchCenterDot} />
                <div style={S.pitchAreaLeft} />
                <div style={S.pitchAreaLeftSmall} />
                <div style={S.pitchAreaRight} />
                <div style={S.pitchAreaRightSmall} />

                <Shirt color="#fff" x="5%" y="50%" />
                <Shirt color="#fff" x="20%" y="15%" />
                <Shirt color="#fff" x="20%" y="38%" />
                <Shirt color="#fff" x="20%" y="62%" />
                <Shirt color="#fff" x="20%" y="85%" />
                <Shirt color="#fff" x="36%" y="25%" />
                <Shirt color="#fff" x="36%" y="50%" />
                <Shirt color="#fff" x="36%" y="75%" />
                <Shirt color="#fff" x="50%" y="18%" />
                <Shirt color="#fff" x="50%" y="50%" />
                <Shirt color="#fff" x="50%" y="82%" />

                <Shirt color="#e90052" x="95%" y="50%" />
                <Shirt color="#e90052" x="80%" y="15%" />
                <Shirt color="#e90052" x="80%" y="38%" />
                <Shirt color="#e90052" x="80%" y="62%" />
                <Shirt color="#e90052" x="80%" y="85%" />
                <Shirt color="#e90052" x="64%" y="25%" />
                <Shirt color="#e90052" x="64%" y="50%" />
                <Shirt color="#e90052" x="64%" y="75%" />
                <Shirt color="#e90052" x="50%" y="32%" />
                <Shirt color="#e90052" x="50%" y="65%" />
              </div>

              {loadingLineups ? (
                <p style={S.empty}>Cargando alineaciones...</p>
              ) : lineupsError ? (
                <p style={S.error}>{lineupsError}</p>
              ) : lineups.length === 0 ? (
                <p style={S.empty}>No hay alineaciones disponibles para este partido.</p>
              ) : (
                <div style={S.lineupGrid}>
                  <div style={{ borderRight: "1px solid #f0f0f0" }}>
                    <p style={S.lineupTitle("#263a55")}>{match.homeTeam.name}</p>
                    {homeStarters.map((j, idx) => (
                      <div key={`home-${idx}`} style={S.playerRow}>
                        <span style={S.playerNum}>{j.player_number ?? "-"}</span>
                        <span>{j.player_name}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p style={S.lineupTitle("#e90052")}>{match.awayTeam.name}</p>
                    {awayStarters.map((j, idx) => (
                      <div key={`away-${idx}`} style={S.playerRow}>
                        <span style={S.playerNum}>{j.player_number ?? "-"}</span>
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
                <p style={S.empty}>Cargando estadísticas...</p>
              ) : statsError ? (
                <p style={S.error}>{statsError}</p>
              ) : stats.length === 0 ? (
                <p style={S.empty}>No hay estadísticas disponibles para este partido.</p>
              ) : (
                <>
                  <p style={S.statsLabel}>Estadísticas del partido</p>
                  {stats.map((s, idx) => (
                    <div key={`${s.label}-${idx}`} style={S.statRow}>
                      <span style={{ fontWeight: 700, color: "#263a55" }}>
                        {s.home_value}
                      </span>
                      <span
                        style={{
                          color: "#9ca3af",
                          fontSize: "0.78rem",
                          textAlign: "center",
                          minWidth: 120,
                        }}
                      >
                        {STATS_ES[s.label] ?? s.label}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#e90052",
                          textAlign: "right",
                        }}
                      >
                        {s.away_value}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "H2H" && (
            <div>
              {loadingH2H ? (
                <p style={S.empty}>Cargando historial...</p>
              ) : h2hError ? (
                <p style={S.error}>{h2hError}</p>
              ) : h2h.length === 0 ? (
                <p style={S.empty}>No hay historial disponible para estos equipos.</p>
              ) : (
                <>
                  <p style={S.statsLabel}>Últimos enfrentamientos</p>

                  {h2h.map((item, idx) => (
                    <div
                      key={`${item.fixture_id}-${idx}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        padding: "0.75rem 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <span style={{ color: "#9ca3af", fontSize: "0.78rem" }}>
                        {new Date(item.date).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {item.league}
                      </span>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto 1fr",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <img
                            src={item.home.logo}
                            alt={item.home.name}
                            style={{ width: 22, height: 22, objectFit: "contain" }}
                          />
                          <span>{item.home.name}</span>
                        </div>

                        <strong style={{ color: "#263a55" }}>
                          {item.home.goals} - {item.away.goals}
                        </strong>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            justifyContent: "flex-end",
                          }}
                        >
                          <span>{item.away.name}</span>
                          <img
                            src={item.away.logo}
                            alt={item.away.name}
                            style={{ width: 22, height: 22, objectFit: "contain" }}
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

        <div style={S.subsPanel}>
          <div style={S.subsPanelHeader}>
            <span style={S.subsPanelTitle}>Sustituciones</span>
          </div>

          <div style={S.subsSelector}>
            <button
              onClick={() => setEquipoSust("home")}
              style={S.subsBtn(equipoSust === "home")}
            >
              <img src={match.homeTeam.logo} alt="" style={S.subsLogoSmall} />
            </button>
            <button
              onClick={() => setEquipoSust("away")}
              style={S.subsBtn(equipoSust === "away")}
            >
              <img src={match.awayTeam.logo} alt="" style={S.subsLogoSmall} />
            </button>
          </div>

          {loadingLineups ? (
            <p style={S.empty}>Cargando banca...</p>
          ) : lineupsError ? (
            <p style={S.error}>{lineupsError}</p>
          ) : sustituciones.length === 0 ? (
            <p style={S.empty}>No hay suplentes disponibles.</p>
          ) : (
            sustituciones.map((s, i) => (
              <div key={i} style={S.subsRow}>
                <div style={S.subsNum}>{s.player_number ?? "-"}</div>
                <span>{s.player_name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}