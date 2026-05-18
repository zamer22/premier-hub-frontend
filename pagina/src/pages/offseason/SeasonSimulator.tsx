import { useEffect, useState } from "react";
import type { PLClub } from "../../components/offseason/types";

const API_URL = import.meta.env.VITE_API_URL;

type Player = { id: number; name: string; age: number; position: string };
type Transfer = {
  playerId: number;
  playerName: string;
  fromClubId: number;
  fromClubName: string;
  toClubId: number;
  toClubName: string;
};
type ClubResult = { position: number; club: string; club_id: number; title_odds_delta: number };

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
      .then((data) => setPlayers(data.success ? data.data : []))
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
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      fromClubId: from.id,
      fromClubName: from.name,
      toClubId: to.id,
      toClubName: to.name,
    }]);
    setSelectedPlayer(null);
    setTargetClubId("");
  };

  const handleSimulate = async () => {
    if (!transfers.length) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ml/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transfers: transfers.map((t) => ({ player_id: t.playerId, from_club_id: t.fromClubId, to_club_id: t.toClubId })),
        }),
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
    <div className="ol-grid">
      <section className="ol-panel">
        <div className="ol-section-title">
          <span className="ol-accent" />
          <h2>Fichajes hipotéticos</h2>
        </div>

        <div className="ol-field-group">
          <label className="ol-label">
            Club del jugador
            <select className="ol-select" value={sourceClubId} onChange={(e) => setSourceClubId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Seleccionar club…</option>
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label className="ol-label">
            Jugador
            <select
              className="ol-select"
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

          <label className="ol-label">
            Club destino
            <select className="ol-select" value={targetClubId} onChange={(e) => setTargetClubId(e.target.value ? Number(e.target.value) : "")} disabled={!selectedPlayer}>
              <option value="">Seleccionar destino…</option>
              {targetClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>

        <button type="button" className="ol-secondary ol-secondary--full" onClick={handleAdd} disabled={!canAdd}>
          {transfers.length >= 5 ? "Máximo 5 transferencias" : "+ Agregar transferencia"}
        </button>

        {transfers.length > 0 ? (
          <div className="ol-transfer-list">
            {transfers.map((t) => (
              <div key={t.playerId} className="ol-transfer-row">
                <div className="ol-transfer-info">
                  <span className="ol-transfer-player">{t.playerName}</span>
                  <span className="ol-transfer-clubs">{t.fromClubName} → {t.toClubName}</span>
                </div>
                <button type="button" className="ol-remove" onClick={() => setTransfers((prev) => prev.filter((x) => x.playerId !== t.playerId))} aria-label="Eliminar">×</button>
              </div>
            ))}
          </div>
        ) : null}

        <button type="button" className="ol-primary" onClick={handleSimulate} disabled={!transfers.length || loading} style={{ marginTop: "1rem" }}>
          {loading ? "Simulando temporada…" : "Simulate Season"}
        </button>
        {error ? <p className="ol-error">{error}</p> : null}
      </section>

      <section className="ol-panel">
        <div className="ol-section-title ol-section-title--navy">
          <span className="ol-accent ol-accent--navy" />
          <h2>Tabla proyectada</h2>
        </div>

        {!result && !loading ? (
          <div className="ol-empty">
            <p>Agrega al menos una transferencia hipotética y presiona Simulate Season.</p>
          </div>
        ) : null}

        {loading ? (
          <div className="ol-loading">
            <span className="ol-spinner" />
            <p>Ejecutando 1000 simulaciones de Monte Carlo…</p>
          </div>
        ) : null}

        {result ? (
          <div className="ol-table-wrap">
            <table className="ol-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Club</th>
                  <th>Δ Título</th>
                </tr>
              </thead>
              <tbody>
                {result.map((row) => {
                  const affected = transfers.some((t) => t.fromClubId === row.club_id || t.toClubId === row.club_id);
                  return (
                    <tr key={row.club_id} className={affected ? "ol-row--affected" : ""}>
                      <td className="ol-cell-pos">{row.position}</td>
                      <td className="ol-cell-club">{row.club}</td>
                      <td className={`ol-cell-delta ${row.title_odds_delta > 0 ? "ol-delta--pos" : row.title_odds_delta < 0 ? "ol-delta--neg" : ""}`}>
                        {row.title_odds_delta > 0 ? "+" : ""}{row.title_odds_delta.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
