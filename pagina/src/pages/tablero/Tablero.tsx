import { useEffect, useState } from "react";
import "./Tablero.css";

const API_URL = import.meta.env.VITE_API_URL;

interface RankingRow {
  id: number;
  nickname: string;
  posicion: number;
  puntos: number;
  partidas: number;
  victorias: number;
  derrotas: number;
}

function rankTone(position: number) {
  if (position === 1) return "rank-badge--first";
  if (position === 2) return "rank-badge--second";
  if (position === 3) return "rank-badge--third";
  return "";
}

export default function Tablero() {
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ranking`);
      const data = await res.json();
      if (data.success) setRanking(data.data);
      else setError(data.error || "Error al cargar ranking");
    } catch {
      setError("No se pudo conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  return (
    <section className="leaderboard-panel">
      <div className="leaderboard-header">
        <div>
          <p className="ph-eyebrow">Competencia</p>
          <h2 className="leaderboard-title">Leaderboard</h2>
          <p className="leaderboard-subtitle">Ranking general de jugadores</p>
        </div>
        <button type="button" onClick={fetchRanking} disabled={loading} className="leaderboard-refresh">
          Refresh
        </button>
      </div>

      {loading ? <p className="leaderboard-state">Cargando ranking...</p> : null}
      {error ? <p className="leaderboard-state leaderboard-state--error">{error}</p> : null}
      {!loading && !error && ranking.length === 0 ? (
        <p className="leaderboard-empty">No hay datos de ranking disponibles</p>
      ) : null}

      {ranking.length > 0 ? (
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                {["#", "Jugador", "Puntos", "Partidas", "V", "D"].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className={`rank-badge ${rankTone(row.posicion)}`}>{row.posicion}</span>
                  </td>
                  <td className="leaderboard-player">{row.nickname}</td>
                  <td className="leaderboard-points">{row.puntos.toLocaleString()}</td>
                  <td>{row.partidas}</td>
                  <td className="leaderboard-wins">{row.victorias}</td>
                  <td className="leaderboard-losses">{row.derrotas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
