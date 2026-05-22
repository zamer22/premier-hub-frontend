import { useEffect, useState } from "react";
import type { PLClub } from "../../components/offseason/types";

const API_URL = import.meta.env.VITE_API_URL;

type Player = { id: number; name: string; age: number; position: string };
type Transfer = {
  playerId: number; playerName: string;
  fromClubId: number; fromClubName: string;
  toClubId: number; toClubName: string;
};
type ClubResult = {
  position: number; club: string; club_id: number;
  avg_pts: number; avg_pts_base: number;
  title_probability: number; title_odds_delta: number;
  top4_probability: number; top4_delta: number;
  relegation_probability: number; relegation_delta: number;
};

function Delta({ value }: { value: number }) {
  const cls = value > 0.5 ? "lab-delta--pos" : value < -0.5 ? "lab-delta--neg" : "lab-delta--neu";
  return <span className={cls}>{value > 0 ? "+" : ""}{value.toFixed(1)}%</span>;
}

export default function SeasonSimulator({ clubs }: { clubs: PLClub[] }) {
  const [sourceClubId, setSourceClubId] = useState<number | "">("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [targetClubId, setTargetClubId] = useState<number | "">("");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClubResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceClubId) { setPlayers([]); setSelectedPlayer(null); return; }
    setPlayersLoading(true);
    setSelectedPlayer(null);
    fetch(`${API_URL}/api/ml/players?club_id=${sourceClubId}`)
      .then((r) => r.json())
      .then((d) => setPlayers(d.success ? d.data : []))
      .catch(() => setPlayers([]))
      .finally(() => setPlayersLoading(false));
  }, [sourceClubId]);

  const usedPlayerIds = new Set(transfers.map((t) => t.playerId));
  const targetClubs = clubs.filter((c) => c.id !== sourceClubId);
  const canAdd = !!selectedPlayer && targetClubId !== "" && transfers.length < 5 && !usedPlayerIds.has(selectedPlayer?.id ?? -1);

  const handleAdd = () => {
    if (!canAdd || !selectedPlayer) return;
    const from = clubs.find((c) => c.id === sourceClubId)!;
    const to = clubs.find((c) => c.id === targetClubId)!;
    setTransfers((prev) => [...prev, {
      playerId: selectedPlayer.id, playerName: selectedPlayer.name,
      fromClubId: from.id, fromClubName: from.name,
      toClubId: to.id, toClubName: to.name,
    }]);
    setSelectedPlayer(null); setTargetClubId("");
  };

  const handleSimulate = async () => {
    if (!transfers.length) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ml/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transfers: transfers.map((t) => ({ player_id: t.playerId, from_club_id: t.fromClubId, to_club_id: t.toClubId })) }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setResult(data.data.table);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lab-grid">
      <section className="lab-panel">
        <div className="lab-section-title">
          <span className="lab-accent-bar" />
          <h2>Fichajes hipotéticos</h2>
        </div>

        <div className="lab-field-group">
          <label className="lab-label">
            Club del jugador
            <select className="lab-select" value={sourceClubId} onChange={(e) => setSourceClubId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Seleccionar club…</option>
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label className="lab-label">
            Jugador
            <select
              className="lab-select"
              value={selectedPlayer?.id ?? ""}
              onChange={(e) => setSelectedPlayer(players.find((p) => p.id === Number(e.target.value)) ?? null)}
              disabled={!sourceClubId || playersLoading}
            >
              <option value="">
                {playersLoading ? "Cargando…" : !sourceClubId ? "Selecciona un club primero" : "Seleccionar jugador…"}
              </option>
              {players.map((p) => (
                <option key={p.id} value={p.id} disabled={usedPlayerIds.has(p.id)}>
                  {p.name} ({p.position}){usedPlayerIds.has(p.id) ? " — ya agregado" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="lab-label">
            Club destino
            <select className="lab-select" value={targetClubId} onChange={(e) => setTargetClubId(e.target.value ? Number(e.target.value) : "")} disabled={!selectedPlayer}>
              <option value="">Seleccionar destino…</option>
              {targetClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>

        <button type="button" className="lab-btn-secondary lab-btn-secondary--full" onClick={handleAdd} disabled={!canAdd}>
          {transfers.length >= 5 ? "Máximo 5 transferencias" : "+ Agregar transferencia"}
        </button>

        {transfers.length > 0 && (
          <div className="lab-transfer-list">
            {transfers.map((t) => (
              <div key={t.playerId} className="lab-transfer-row">
                <div className="lab-transfer-info">
                  <span className="lab-transfer-player">{t.playerName}</span>
                  <span className="lab-transfer-clubs">{t.fromClubName} → {t.toClubName}</span>
                </div>
                <button type="button" className="lab-remove" onClick={() => setTransfers((prev) => prev.filter((x) => x.playerId !== t.playerId))} aria-label="Eliminar">×</button>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="lab-btn-primary" onClick={handleSimulate} disabled={!transfers.length || loading}>
          {loading ? "Simulando temporada…" : "Simular temporada"}
        </button>
        {error && <p className="lab-error">{error}</p>}
      </section>

      <section className="lab-panel">
        <div className="lab-section-title">
          <span className="lab-accent-bar lab-accent-bar--muted" />
          <h2>Tabla proyectada</h2>
        </div>

        {!result && !loading && (
          <div className="lab-empty">
            <p>Agrega al menos una transferencia hipotética y presiona simular temporada.</p>
          </div>
        )}

        {loading && (
          <div className="lab-loading">
            <span className="lab-spinner" />
            <p>Ejecutando 1000 simulaciones de Monte Carlo…</p>
          </div>
        )}

        {result && (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Club</th>
                  <th>Pts/RP</th>
                  <th>Título %</th>
                  <th>Top 4 %</th>
                  <th>Rel %</th>
                </tr>
              </thead>
              <tbody>
                {result.map((row) => {
                  const affected = transfers.some((t) => t.fromClubId === row.club_id || t.toClubId === row.club_id);
                  return (
                    <tr key={row.club_id} className={affected ? "lab-row--affected" : ""}>
                      <td className={`lab-cell-pos${row.position <= 4 ? " lab-cell-pos--top4" : row.position >= 18 ? " lab-cell-pos--rel" : ""}`}>
                        {row.position}
                      </td>
                      <td className="lab-cell-club">{row.club}</td>
                      <td>
                        {row.avg_pts.toFixed(1)}
                        {" "}<Delta value={row.avg_pts - row.avg_pts_base} />
                      </td>
                      <td>
                        {row.title_probability?.toFixed(1) ?? "—"}%
                        {row.title_odds_delta !== 0 && <> <Delta value={row.title_odds_delta} /></>}
                      </td>
                      <td>
                        {row.top4_probability?.toFixed(1) ?? "—"}%
                        {row.top4_delta !== 0 && <> <Delta value={row.top4_delta} /></>}
                      </td>
                      <td>
                        {row.relegation_probability?.toFixed(1) ?? "—"}%
                        {row.relegation_delta !== 0 && <> <Delta value={row.relegation_delta} /></>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {transfers.length > 0 && (
              <p className="lab-table-note">Filas resaltadas = clubes afectados por los fichajes hipotéticos</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
