import { useState, useEffect } from "react";
const API_URL: string = "https://api.zamer-o.com";

interface Match {
  id: number; utcDate: string; status: string; matchday: number;
  homeTeam: { name: string; shortName: string; crest: string };
  awayTeam: { name: string; shortName: string; crest: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

interface Standing {
  position: number;
  team: { name: string; shortName: string; crest: string };
  playedGames: number; won: number; draw: number; lost: number; points: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number;
}

export default function Partido() {
  const [proximos, setProximos] = useState<Match[]>([]);
  const [resultados, setResultados] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, r, s] = await Promise.all([
          fetch(`${API_URL}/api/partidos/proximos`).then(r => r.json()),
          fetch(`${API_URL}/api/partidos/resultados`).then(r => r.json()),
          fetch(`${API_URL}/api/partidos/standings`).then(r => r.json()),
        ]);
        if (p.success) setProximos(p.data.slice(0, 5));
        if (r.success) setResultados(r.data.slice(0, 5));
        if (s.success && s.data[0]?.standings?.[0]?.table) setStandings(s.data[0].standings[0].table);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (d: string): string => {
    const date = new Date(d);
    return date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const MatchCard = ({ m }: { m: Match }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0.75rem 1rem", background: "#fff", borderRadius: "8px", marginBottom: "0.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
        <img src={m.homeTeam.crest} alt="" style={{ width: "24px", height: "24px" }} />
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.homeTeam.shortName || m.homeTeam.name}</span>
      </div>
      <div style={{ fontWeight: 700, color: "#E90052", fontSize: "0.95rem", minWidth: "50px", textAlign: "center" }}>
        {m.score.fullTime.home !== null ? `${m.score.fullTime.home} - ${m.score.fullTime.away}` : "vs"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.awayTeam.shortName || m.awayTeam.name}</span>
        <img src={m.awayTeam.crest} alt="" style={{ width: "24px", height: "24px" }} />
      </div>
    </div>
  );

  if (loading) return <p style={{ color: "#84878F" }}>Cargando datos de la Premier League...</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      {/* Standings */}
      <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ width: "4px", height: "20px", background: "#E90052", borderRadius: "2px" }} />
          <h2 style={{ color: "#263a55", fontSize: "1.1rem" }}>Tabla de Posiciones</h2>
        </div>
        {standings.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #263a55" }}>
                  {["#", "Equipo", "PJ", "G", "E", "P", "GF", "GC", "DG", "Pts"].map((h) => (
                    <th key={h} style={{ padding: "0.5rem 0.4rem", textAlign: "left", fontWeight: 700, color: "#263a55", fontSize: "0.7rem", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 10).map((s, i) => (
                  <tr key={s.position} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", fontWeight: 600 }}>{s.position}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <img src={s.team.crest} alt="" style={{ width: "18px", height: "18px" }} />
                      <span style={{ fontWeight: 500 }}>{s.team.shortName || s.team.name}</span>
                    </td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.playedGames}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.won}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.draw}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.lost}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.goalsFor}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.goalsAgainst}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", color: s.goalDifference > 0 ? "#16a34a" : s.goalDifference < 0 ? "#dc2626" : "#666" }}>{s.goalDifference > 0 ? "+" : ""}{s.goalDifference}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", fontWeight: 700, color: "#E90052" }}>{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proximos */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div style={{ width: "4px", height: "20px", background: "#263a55", borderRadius: "2px" }} />
          <h3 style={{ color: "#263a55", fontSize: "1rem" }}>Proximos Partidos</h3>
        </div>
        {proximos.map((m) => (
          <div key={m.id}>
            <p style={{ fontSize: "0.7rem", color: "#84878F", marginBottom: "0.25rem", marginTop: "0.5rem" }}>{formatDate(m.utcDate)}</p>
            <MatchCard m={m} />
          </div>
        ))}
      </div>

      {/* Resultados */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div style={{ width: "4px", height: "20px", background: "#E90052", borderRadius: "2px" }} />
          <h3 style={{ color: "#263a55", fontSize: "1rem" }}>Resultados Recientes</h3>
        </div>
        {resultados.length === 0 && <p style={{ fontSize: "0.85rem", color: "#84878F" }}>Sin resultados recientes</p>}
        {resultados.map((m) => (
          <div key={m.id}>
            <p style={{ fontSize: "0.7rem", color: "#84878F", marginBottom: "0.25rem", marginTop: "0.5rem" }}>{formatDate(m.utcDate)}</p>
            <MatchCard m={m} />
          </div>
        ))}
      </div>
    </div>
  );
}
