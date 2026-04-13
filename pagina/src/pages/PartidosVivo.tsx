import { useState } from "react";

/* ─── Tipos ──────────────────────────────────────────────── */
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

/* ─── Datos mock ─────────────────────────────────────────── */
const TABS = ["Alineaciones", "Estadísticas", "H2H"];

const alineacionLocal = [
  { numero: 1, nombre: "Flekken" }, { numero: 5, nombre: "Chalobah" },
  { numero: 6, nombre: "Andersen" }, { numero: 3, nombre: "Mitchell" },
  { numero: 12, nombre: "Munoz" }, { numero: 8, nombre: "Wharton" },
  { numero: 10, nombre: "Eze" }, { numero: 22, nombre: "Hughes" },
  { numero: 11, nombre: "Nketiah" }, { numero: 9, nombre: "Mateta" },
  { numero: 7, nombre: "Sarr" },
];

const alineacionVisit = [
  { numero: 1, nombre: "Raya" }, { numero: 4, nombre: "White" },
  { numero: 6, nombre: "Gabriel" }, { numero: 12, nombre: "Timber" },
  { numero: 35, nombre: "Zinchenko" }, { numero: 29, nombre: "Havertz" },
  { numero: 8, nombre: "Odegaard" }, { numero: 41, nombre: "Rice" },
  { numero: 11, nombre: "Martinelli" }, { numero: 9, nombre: "Jesus" },
  { numero: 7, nombre: "Saka" },
];

const sustitucionesHome = [
  { numero: 4, nombre: "Sepp van den Berg" },
  { numero: 18, nombre: "Yehor Yarmolyuk" },
  { numero: 16, nombre: "Ben Mee" },
  { numero: 26, nombre: "Yunus Konak" },
  { numero: 12, nombre: "Håkon Rafn Valdimarsern" },
];

const sustitucionesAway = [
  { numero: 4, nombre: "Heungmin Son" },
  { numero: 18, nombre: "Harris Kane" },
  { numero: 16, nombre: "Lucas Bergvall" },
  { numero: 26, nombre: "Archie Gray" },
  { numero: 12, nombre: "Pedro Porro" },
  { numero: 4, nombre: "Yves Bissouma" },
];

const estadisticas = [
  { label: "Posesión", local: "45%", visita: "55%" },
  { label: "Tiros", local: "8", visita: "12" },
  { label: "Tiros a puerta", local: "3", visita: "5" },
  { label: "Faltas", local: "10", visita: "7" },
  { label: "Córners", local: "4", visita: "6" },
  { label: "Fueras de juego", local: "2", visita: "1" },
  { label: "Tarjetas amarillas", local: "2", visita: "1" },
];

const h2h = [
  { fecha: "15/3/25", tipo: "Final", local: "Crystal Palace", golesL: 1, golesV: 2, visita: "Arsenal" },
  { fecha: "26/1/25", tipo: "Final", local: "Arsenal", golesL: 4, golesV: 1, visita: "Crystal Palace" },
  { fecha: "10/12/24", tipo: "Final", local: "Crystal Palace", golesL: 0, golesV: 0, visita: "Arsenal" },
];

/* ─── Sub-componentes ────────────────────────────────────── */
// Camiseta SVG posicionada en la cancha horizontal
const Shirt = ({ color, x, y }: { color: string; x: string; y: string }) => (
  <div style={{
    position: "absolute", left: x, top: y,
    transform: "translate(-50%, -50%)",
    width: 18, height: 18,
  }}>
    <svg viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>
      <path d="M16 2H8L6 5 2 7l2 4 2-1v13h16V10l2 1 2-4-4-2-2-3z" />
    </svg>
  </div>
);

/* ─── Estilos como objeto JS (self-contained) ────────────── */
const S = {
  /* root */
  root: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: "#f4f6f9",
    minHeight: "100%",
    padding: "1.25rem",
    boxSizing: "border-box" as const,
  },

  /* header row */
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  backBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#263a55", fontWeight: 700, fontSize: "0.95rem", padding: 0,
  },
  liveChip: { display: "flex", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: "#e90052" },
  liveBadge: {
    background: "#e90052", color: "#fff",
    fontSize: "0.72rem", fontWeight: 800,
    padding: "0.28rem 0.6rem", borderRadius: 999,
  },
  liveMin: { color: "#263a55", fontWeight: 700, fontSize: "0.85rem" },

  /* scoreboard card */
  scoreboard: {
    background: "#fff", borderRadius: 14,
    padding: "1.5rem 2rem", marginBottom: "1rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
    display: "grid", gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center", gap: "1rem",
  },
  teamBlock: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8 },
  teamLogo: { width: 64, height: 64, objectFit: "contain" as const },
  teamName: { fontWeight: 700, fontSize: "0.95rem", textAlign: "center" as const, color: "#111827" },
  scoreCenter: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8 },
  stadiumTag: {
    background: "#263a55", color: "#fff",
    fontSize: "0.72rem", fontWeight: 600,
    padding: "0.35rem 0.9rem", borderRadius: 8,
  },
  scoreBox: {
    background: "#1a2d42", borderRadius: 12,
    padding: "0.6rem 2rem",
    color: "#fff", fontSize: "2rem", fontWeight: 800,
  },
  scoreMinute: { color: "#e90052", fontWeight: 700, fontSize: "0.9rem" },

  /* main grid */
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 260px", gap: "1rem", alignItems: "start" },

  /* left panel */
  panel: {
    background: "#fff", borderRadius: 14,
    padding: "1.25rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  },

  /* tabs */
  tabsWrapper: {
    display: "flex", marginBottom: "1.25rem",
    borderRadius: 10, overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  tab: (active: boolean) => ({
    flex: 1, padding: "0.6rem 0",
    border: "none", borderRight: "1px solid #e5e7eb",
    cursor: "pointer",
    background: active ? "#e90052" : "#fff",
    color: active ? "#fff" : "#84878f",
    fontWeight: active ? 700 : 500,
    fontSize: "0.85rem",
    transition: "all 0.2s",
  }),

  /* pitch — horizontal, franjas de césped */
  pitch: {
    borderRadius: 10,
    height: 180,
    marginBottom: "1.25rem",
    position: "relative" as const,
    overflow: "hidden",
    background: "repeating-linear-gradient(90deg, #2d7a4f 0px, #2d7a4f 36px, #317f53 36px, #317f53 72px)",
  },
  pitchMid: {
    position: "absolute" as const,
    top: 0, bottom: 0, left: "50%",
    width: 2, background: "rgba(255,255,255,0.25)",
  },
  pitchCircle: {
    position: "absolute" as const, top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    width: 56, height: 56,
    border: "2px solid rgba(255,255,255,0.3)", borderRadius: "50%",
  },
  pitchCenterDot: {
    position: "absolute" as const, top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    width: 5, height: 5,
    background: "rgba(255,255,255,0.5)", borderRadius: "50%",
  },
  // Área izquierda (local)
  pitchAreaLeft: {
    position: "absolute" as const,
    top: "18%", left: 0,
    width: "14%", height: "64%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderLeft: "none",
  },
  pitchAreaLeftSmall: {
    position: "absolute" as const,
    top: "33%", left: 0,
    width: "6%", height: "34%",
    border: "2px solid rgba(255,255,255,0.25)",
    borderLeft: "none",
  },
  // Área derecha (visita)
  pitchAreaRight: {
    position: "absolute" as const,
    top: "18%", right: 0,
    width: "14%", height: "64%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRight: "none",
  },
  pitchAreaRightSmall: {
    position: "absolute" as const,
    top: "33%", right: 0,
    width: "6%", height: "34%",
    border: "2px solid rgba(255,255,255,0.25)",
    borderRight: "none",
  },

  /* lineup */
  lineupGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" },
  lineupTitle: (color: string) => ({
    fontWeight: 600, fontSize: "0.7rem", color,
    textTransform: "uppercase" as const, letterSpacing: "0.08em",
    marginBottom: 6, padding: "0 0.75rem",
  }),
  playerRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0.5rem 0.75rem",
    borderBottom: "1px solid #f7f7f7",
    fontSize: "0.82rem", color: "#1f2937",
  },
  playerNum: (_bg: string) => ({
    color: "#9ca3af",
    fontSize: "0.7rem", fontWeight: 600,
    minWidth: 18, textAlign: "right" as const,
    flexShrink: 0,
  }),

  /* stats */
  probBox: { background: "#f9f9f9", borderRadius: 10, padding: "1rem", marginBottom: "1rem" },
  probTitle: { fontSize: "0.8rem", fontWeight: 700, color: "#263a55", marginBottom: 10, textAlign: "center" as const },
  probLabels: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 6 },
  probBar: { display: "flex", height: 7, borderRadius: 4, overflow: "hidden" },
  statsLabel: { fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, marginBottom: 6, letterSpacing: "0.05em" },
  statRow: {
    display: "grid", gridTemplateColumns: "1fr auto 1fr",
    gap: 8, alignItems: "center",
    padding: "0.45rem 0", borderBottom: "1px solid #f0f0f0", fontSize: "0.85rem",
  },

  /* H2H */
  h2hRow: (bordered: boolean) => ({
    display: "flex", gap: "1rem",
    paddingBottom: "1rem", marginBottom: "1rem",
    borderBottom: bordered ? "1px solid #f0f0f0" : "none",
  }),
  h2hDate: { minWidth: 68, paddingTop: 4 },
  h2hDivider: { width: 1, background: "#eee", flexShrink: 0 },
  h2hMatches: { flex: 1, display: "flex", flexDirection: "column" as const, gap: 8 },
  h2hTeamRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  h2hGoal: (winner: boolean) => ({
    background: winner ? "#263a55" : "transparent",
    color: winner ? "#fff" : "#9ca3af",
    borderRadius: 6, padding: "0.15rem 0.6rem",
    fontWeight: 700, fontSize: "0.85rem",
    minWidth: 28, textAlign: "center" as const,
  }),

  /* subs panel */
  subsPanel: {
    background: "#fff", borderRadius: 14,
    padding: "1.25rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  },
  subsPanelHeader: {
    background: "#e90052", borderRadius: 9,
    padding: "0.6rem 1rem", marginBottom: "1rem",
    display: "flex", alignItems: "center", gap: 8,
  },
  subsPanelTitle: { color: "#fff", fontWeight: 700, fontSize: "0.95rem", margin: 0 },
  subsSelector: {
    display: "flex", gap: 4, marginBottom: "1rem",
    background: "#f0f2f5", borderRadius: 9, padding: 4,
  },
  subsBtn: (active: boolean) => ({
    flex: 1, padding: "0.4rem", border: "none", borderRadius: 7,
    background: active ? "#263a55" : "transparent",
    cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center",
    transition: "background 0.2s",
  }),
  subsLogoSmall: { width: 26, height: 26, objectFit: "contain" as const },
  subsRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0.45rem 0", borderBottom: "1px solid #f0f0f0", fontSize: "0.82rem",
  },
  subsNum: {
    background: "#f0f2f5", borderRadius: "50%",
    width: 30, height: 30,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: "0.72rem", flexShrink: 0, color: "#263a55",
  },
};

/* ─── Componente principal ───────────────────────────────── */
export default function PartidosVivo({ match, onBack }: PartidosVivoProps) {
  const [tab, setTab] = useState("Alineaciones");
  const [equipoSust, setEquipoSust] = useState<"home" | "away">("home");

  const sustituciones = equipoSust === "home" ? sustitucionesHome : sustitucionesAway;

  return (
    <div style={S.root}>

      {/* Header */}
      <div style={S.header}>
        <button type="button" onClick={onBack} style={S.backBtn}>← Volver</button>
        <div style={S.liveChip}>
          <div style={S.liveDot} />
          <span style={S.liveBadge}>EN VIVO</span>
          <span style={S.liveMin}>{match.minute}</span>
        </div>
      </div>

      {/* Scoreboard */}
      <div style={S.scoreboard}>
        <div style={S.teamBlock}>
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} style={S.teamLogo} />
          <span style={S.teamName}>{match.homeTeam.name}</span>
        </div>

        <div style={S.scoreCenter}>
          <div style={S.stadiumTag}>📍 {match.stadium}</div>
          <div style={S.scoreBox}>{match.homeTeam.score} - {match.awayTeam.score}</div>
          <span style={S.scoreMinute}>{match.minute}</span>
        </div>

        <div style={S.teamBlock}>
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} style={S.teamLogo} />
          <span style={S.teamName}>{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Grid principal */}
      <div style={S.mainGrid}>

        {/* Panel izquierdo */}
        <div style={S.panel}>

          {/* Tabs */}
          <div style={S.tabsWrapper}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={S.tab(tab === t)}>{t}</button>
            ))}
          </div>

          {/* ── Alineaciones ── */}
          {tab === "Alineaciones" && (
            <div>
              <div style={S.pitch}>
                {/* Líneas de cancha */}
                <div style={S.pitchMid} />
                <div style={S.pitchCircle} />
                <div style={S.pitchCenterDot} />
                <div style={S.pitchAreaLeft} />
                <div style={S.pitchAreaLeftSmall} />
                <div style={S.pitchAreaRight} />
                <div style={S.pitchAreaRightSmall} />

                {/* ── LOCAL (blanco) — ataca de izquierda a derecha, formación 4-3-3 ── */}
                {/* Portero */}
                <Shirt color="#fff" x="5%"  y="50%" />
                {/* Defensas */}
                <Shirt color="#fff" x="20%" y="15%" />
                <Shirt color="#fff" x="20%" y="38%" />
                <Shirt color="#fff" x="20%" y="62%" />
                <Shirt color="#fff" x="20%" y="85%" />
                {/* Medios */}
                <Shirt color="#fff" x="36%" y="25%" />
                <Shirt color="#fff" x="36%" y="50%" />
                <Shirt color="#fff" x="36%" y="75%" />
                {/* Delanteros */}
                <Shirt color="#fff" x="50%" y="18%" />
                <Shirt color="#fff" x="50%" y="50%" />
                <Shirt color="#fff" x="50%" y="82%" />

                {/* ── VISITA (rosa) — ataca de derecha a izquierda, formación 4-3-3 ── */}
                {/* Portero */}
                <Shirt color="#e90052" x="95%" y="50%" />
                {/* Defensas */}
                <Shirt color="#e90052" x="80%" y="15%" />
                <Shirt color="#e90052" x="80%" y="38%" />
                <Shirt color="#e90052" x="80%" y="62%" />
                <Shirt color="#e90052" x="80%" y="85%" />
                {/* Medios */}
                <Shirt color="#e90052" x="64%" y="25%" />
                <Shirt color="#e90052" x="64%" y="50%" />
                <Shirt color="#e90052" x="64%" y="75%" />
                {/* Delanteros */}
                <Shirt color="#e90052" x="50%" y="32%" />
                <Shirt color="#e90052" x="50%" y="65%" />
              </div>

              <div style={S.lineupGrid}>
                <div style={{ borderRight: "1px solid #f0f0f0" }}>
                  <p style={S.lineupTitle("#263a55")}>{match.homeTeam.name}</p>
                  {alineacionLocal.map((j) => (
                    <div key={j.numero} style={S.playerRow}>
                      <span style={S.playerNum("#263a55")}>{j.numero}</span>
                      <span>{j.nombre}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={S.lineupTitle("#e90052")}>{match.awayTeam.name}</p>
                  {alineacionVisit.map((j) => (
                    <div key={j.numero} style={S.playerRow}>
                      <span style={S.playerNum("#e90052")}>{j.numero}</span>
                      <span>{j.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Estadísticas ── */}
          {tab === "Estadísticas" && (
            <div>
              <div style={S.probBox}>
                <p style={S.probTitle}>Probabilidad de victoria</p>
                <div style={S.probLabels}>
                  <span style={{ fontWeight: 700, color: "#263a55" }}>{match.homeTeam.name} 35%</span>
                  <span style={{ color: "#9ca3af" }}>Empate 10%</span>
                  <span style={{ fontWeight: 700, color: "#e90052" }}>{match.awayTeam.name} 55%</span>
                </div>
                <div style={S.probBar}>
                  <div style={{ width: "35%", background: "#e90052" }} />
                  <div style={{ width: "10%", background: "#d1d5db" }} />
                  <div style={{ width: "55%", background: "#16a34a" }} />
                </div>
              </div>

              <p style={S.statsLabel}>Estadísticas del equipo</p>
              {estadisticas.map((s) => (
                <div key={s.label} style={S.statRow}>
                  <span style={{ fontWeight: 700, color: "#263a55" }}>{s.local}</span>
                  <span style={{ color: "#9ca3af", fontSize: "0.78rem", textAlign: "center", minWidth: 120 }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: "#e90052", textAlign: "right" }}>{s.visita}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── H2H ── */}
          {tab === "H2H" && (
            <div>
              <p style={{ ...S.lineupTitle("#263a55"), marginBottom: 12 }}>Historial de enfrentamientos</p>
              {h2h.map((p, i) => (
                <div key={i} style={S.h2hRow(i < h2h.length - 1)}>
                  <div style={S.h2hDate}>
                    <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#263a55" }}>{p.fecha}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{p.tipo}</div>
                  </div>
                  <div style={S.h2hDivider} />
                  <div style={S.h2hMatches}>
                    <div style={S.h2hTeamRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={match.homeTeam.logo} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.local}</span>
                      </div>
                      <span style={S.h2hGoal(p.golesL > p.golesV)}>{p.golesL}</span>
                    </div>
                    <div style={S.h2hTeamRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={match.awayTeam.logo} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.visita}</span>
                      </div>
                      <span style={S.h2hGoal(p.golesV > p.golesL)}>{p.golesV}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel sustituciones */}
        <div style={S.subsPanel}>
          <div style={S.subsPanelHeader}>
            <span style={S.subsPanelTitle}>Sustituciones</span>
          </div>

          <div style={S.subsSelector}>
            <button onClick={() => setEquipoSust("home")} style={S.subsBtn(equipoSust === "home")}>
              <img src={match.homeTeam.logo} alt="" style={S.subsLogoSmall} />
            </button>
            <button onClick={() => setEquipoSust("away")} style={S.subsBtn(equipoSust === "away")}>
              <img src={match.awayTeam.logo} alt="" style={S.subsLogoSmall} />
            </button>
          </div>

          {sustituciones.map((s, i) => (
            <div key={i} style={S.subsRow}>
              <div style={S.subsNum}>{s.numero}</div>
              <span>{s.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}