import { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;
interface RankingRow { id: number; nickname: string; posicion: number; puntos: number; partidas: number; victorias: number; derrotas: number; }

export default function Tablero() {
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = async (): Promise<void> => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ranking`);
      const data = await res.json();
      if (data.success) setRanking(data.data);
      else setError(data.error || "Error al cargar ranking");
    } catch (e) {
      setError("No se pudo conectar con la API");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRanking(); }, []);

  return (
    <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ color: "#263a55", fontSize: "1.25rem", marginBottom: "0.2rem" }}>Leaderboard</h2>
          <p style={{ color: "#84878F", fontSize: "0.8rem" }}>Ranking general de jugadores</p>
        </div>
        <button onClick={fetchRanking} disabled={loading} style={{
          padding: "0.45rem 1.2rem", background: "#E90052", color: "#fff", border: "none",
          borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
          opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
        }}>Refresh</button>
      </div>
      {loading && <p style={{ color: "#84878F", fontSize: "0.85rem" }}>Cargando ranking...</p>}
      {error && <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>{error}</p>}
      {!loading && !error && ranking.length === 0 && <p style={{ color: "#84878F", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>No hay datos de ranking disponibles</p>}
      {ranking.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#263a55", color: "#fff" }}>
              {["#", "Jugador", "Puntos", "Partidas", "V", "D"].map((h) => (
                <th key={h} style={{ padding: "0.65rem 0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, i) => (
              <tr key={row.id} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f0f0f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "#fafafa" : "#fff"}>
                <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "26px", height: "26px", borderRadius: "50%", fontSize: "0.75rem", fontWeight: 700,
                    background: row.posicion === 1 ? "#E90052" : row.posicion === 2 ? "#263a55" : row.posicion === 3 ? "#871d54" : "#eee",
                    color: row.posicion <= 3 ? "#fff" : "#666",
                  }}>{row.posicion}</span>
                </td>
                <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee", fontWeight: 600 }}>{row.nickname}</td>
                <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee", fontWeight: 700, color: "#E90052" }}>{row.puntos.toLocaleString()}</td>
                <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee" }}>{row.partidas}</td>
                <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee", color: "#16a34a" }}>{row.victorias}</td>
                <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee", color: "#dc2626" }}>{row.derrotas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
