import { useState, useEffect } from "react";
const API_URL: string = "http://localhost:4000";

interface ApiMatch {
  fixture: { id: number; date: string; status: { short: string; long: string } };
  league: { round: string };
  teams: { home: { name: string; logo: string }; away: { name: string; logo: string } };
  goals: { home: number | null; away: number | null };
}

interface Standing {
  rank: number;
  team: { name: string; logo: string };
  points: number;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  goalsDiff: number;
}

export default function Partido() {
  const [proximos, setProximos] = useState<ApiMatch[]>([]);
  const [resultados, setResultados] = useState<ApiMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        if (s.success && Array.isArray(s.data)) setStandings(s.data);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(`Error cargando datos: ${err instanceof Error ? err.message : String(err)}`);
      }
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (d: string): string => {
    const date = new Date(d);
    return date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const MatchCard = ({ m }: { m: ApiMatch }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0.75rem 1rem", background: "#fff", borderRadius: "8px", marginBottom: "0.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
        <img src={m.teams.home.logo} alt="" style={{ width: "24px", height: "24px" }} />
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.teams.home.name}</span>
      </div>
      <div style={{ fontWeight: 700, color: "#E90052", fontSize: "0.95rem", minWidth: "50px", textAlign: "center" }}>
        {m.goals.home !== null ? `${m.goals.home} - ${m.goals.away}` : "vs"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.teams.away.name}</span>
        <img src={m.teams.away.logo} alt="" style={{ width: "24px", height: "24px" }} />
      </div>
    </div>
  );

  if (loading) return <p style={{ color: "#84878F" }}>Cargando datos de la Premier League...</p>;
  if (error) return <p style={{ color: "#dc2626" }}>{error}</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      {/* Standings */}
      <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ width: "4px", height: "20px", background: "#E90052", borderRadius: "2px" }} />
          <h2 style={{ color: "#263a55", fontSize: "1.1rem" }}>Tabla de Posiciones</h2>
        </div>
        {standings.length > 0 ? (
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
                  <tr key={s.rank} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", fontWeight: 600 }}>{s.rank}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <img src={s.team.logo} alt="" style={{ width: "18px", height: "18px" }} />
                      <span style={{ fontWeight: 500 }}>{s.team.name}</span>
                    </td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.all.played}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.all.win}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.all.draw}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.all.lose}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.all.goals.for}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee" }}>{s.all.goals.against}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", color: s.goalsDiff > 0 ? "#16a34a" : s.goalsDiff < 0 ? "#dc2626" : "#666" }}>{s.goalsDiff > 0 ? "+" : ""}{s.goalsDiff}</td>
                    <td style={{ padding: "0.4rem", borderBottom: "1px solid #eee", fontWeight: 700, color: "#E90052" }}>{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#84878F", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>Sin datos de posiciones</p>
        )}
      </div>

      {/* Proximos */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div style={{ width: "4px", height: "20px", background: "#E90052", borderRadius: "2px" }} />
          <h3 style={{ color: "#263a55", fontSize: "1rem" }}>Proximos Partidos</h3>
        </div>
        {proximos.length === 0 && <p style={{ fontSize: "0.85rem", color: "#84878F" }}>Sin proximos partidos</p>}
        {proximos.map((m) => (
          <div key={m.fixture.id}>
            <p style={{ fontSize: "0.7rem", color: "#84878F", marginBottom: "0.25rem", marginTop: "0.5rem" }}>{formatDate(m.fixture.date)}</p>
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
          <div key={m.fixture.id}>
            <p style={{ fontSize: "0.7rem", color: "#84878F", marginBottom: "0.25rem", marginTop: "0.5rem" }}>{formatDate(m.fixture.date)}</p>
            <MatchCard m={m} />
          </div>
        ))}
      </div>
    </div>
  );
}