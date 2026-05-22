import { useEffect, useState } from "react";
import type { PLClub } from "../../components/offseason/types";
import ClubGrid from "../laboratorio/ClubGrid";

const API_URL = import.meta.env.VITE_API_URL;

type Player   = { id: number; name: string; age: number; position: string };
type Transfer = {
  playerId: number; playerName: string; position: string;
  fromClubId: number; fromClubName: string;
  toClubId: number;   toClubName: string;
};
type ClubResult = { position: number; club: string; club_id: number; avg_pts: number; avg_pts_base: number; title_odds_delta: number };

function clubInitials(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function clubHue(name: string) {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) & 0xfffffff;
  return h % 360;
}

function posBg(pos: string) {
  const p = pos.toLowerCase();
  if (p.includes("goal"))    return "#e0f2fe";
  if (p.includes("defend"))  return "#dcfce7";
  if (p.includes("midfield")) return "#fef9c3";
  return "#fce7f3";
}

function posColor(pos: string) {
  const p = pos.toLowerCase();
  if (p.includes("goal"))    return "#0369a1";
  if (p.includes("defend"))  return "#15803d";
  if (p.includes("midfield")) return "#854d0e";
  return "#9d174d";
}

function posAbbr(pos: string) {
  const p = pos.toLowerCase();
  if (p.includes("goal"))    return "POR";
  if (p.includes("defend"))  return "DEF";
  if (p.includes("midfield")) return "MED";
  return "DEL";
}

export default function SeasonSimulator({
  clubs,
  onLoadingChange,
}: {
  clubs: PLClub[];
  onLoadingChange: (v: boolean) => void;
}) {
  const [sourceClubId, setSourceClubId]     = useState<number | "">("");
  const [players, setPlayers]               = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [targetClubId, setTargetClubId]     = useState<number | "">("");
  const [transfers, setTransfers]           = useState<Transfer[]>([]);
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<ClubResult[] | null>(null);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => { onLoadingChange(loading); }, [loading, onLoadingChange]);

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
  const targetClubs   = clubs.filter((c) => c.id !== sourceClubId);
  const canAdd        = !!selectedPlayer && targetClubId !== "" && transfers.length < 5 && !usedPlayerIds.has(selectedPlayer?.id ?? -1);

  const handleAdd = () => {
    if (!canAdd || !selectedPlayer) return;
    const from = clubs.find((c) => c.id === sourceClubId)!;
    const to   = clubs.find((c) => c.id === targetClubId)!;
    setTransfers((prev) => [...prev, {
      playerId:     selectedPlayer.id,
      playerName:   selectedPlayer.name,
      position:     selectedPlayer.position,
      fromClubId:   from.id,
      fromClubName: from.name,
      toClubId:     to.id,
      toClubName:   to.name,
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
          transfers: transfers.map((t) => ({
            player_id:   t.playerId,
            from_club_id: t.fromClubId,
            to_club_id:   t.toClubId,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setResult(data.data.table);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const baselineRanking = result
    ? [...result].sort((a, b) => b.avg_pts_base - a.avg_pts_base)
    : [];
  const basePosition = (clubId: number) =>
    baselineRanking.findIndex((r) => r.club_id === clubId) + 1;

  return (
    <div className="ol-grid">
      {/* ── Panel izquierdo ─────────────────────────────────────────────── */}
      <section className="ol-panel">
        <div className="ol-section-title">
          <span className="ol-accent" />
          <h2>Ventana de fichajes</h2>
          {transfers.length > 0 && (
            <span className="ol-count-badge">{transfers.length}/5</span>
          )}
        </div>

        <div className="ol-field-group">
          <label className="ol-label">
            Club del jugador
            <ClubGrid clubs={clubs} selectedId={sourceClubId} onSelect={setSourceClubId} />
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
                  {p.name} · {p.position}{usedPlayerIds.has(p.id) ? " (ya agregado)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="ol-label">
            Club destino
            <ClubGrid clubs={targetClubs} selectedId={targetClubId} onSelect={setTargetClubId} disabled={!selectedPlayer} />
          </label>
        </div>

        <button
          type="button"
          className="ol-secondary ol-secondary--full"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          {transfers.length >= 5 ? "Máximo 5 fichajes" : "+ Agregar fichaje"}
        </button>

        {transfers.length > 0 && (
          <div className="ol-transfer-list">
            {transfers.map((t) => (
              <div key={t.playerId} className="ol-transfer-row">
                <div
                  className="ol-transfer-pos-bar"
                  style={{ background: posBg(t.position) }}
                  title={t.position}
                >
                  <span style={{ color: posColor(t.position), fontSize: "0.66rem", fontWeight: 900 }}>
                    {posAbbr(t.position)}
                  </span>
                </div>
                <div className="ol-transfer-info">
                  <span className="ol-transfer-player">{t.playerName}</span>
                  <div className="ol-transfer-clubs-row">
                    <div className="ol-club-badge ol-club-badge--xs" style={{ background: `hsl(${clubHue(t.fromClubName)},52%,32%)` }}>
                      {clubInitials(t.fromClubName)}
                    </div>
                    <span className="ol-transfer-arrow">→</span>
                    <div className="ol-club-badge ol-club-badge--xs" style={{ background: `hsl(${clubHue(t.toClubName)},52%,32%)` }}>
                      {clubInitials(t.toClubName)}
                    </div>
                    <span className="ol-transfer-clubs">{t.fromClubName} → {t.toClubName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="ol-remove"
                  onClick={() => setTransfers((prev) => prev.filter((x) => x.playerId !== t.playerId))}
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="ol-primary"
          onClick={handleSimulate}
          disabled={!transfers.length || loading}
          style={{ marginTop: "1rem" }}
        >
          {loading ? "Calculando…" : "Simular temporada"}
        </button>
        {error && <p className="ol-error">{error}</p>}
      </section>

      {/* ── Panel derecho ────────────────────────────────────────────────── */}
      <section className="ol-panel">
        <div className="ol-section-title ol-section-title--navy">
          <span className="ol-accent ol-accent--navy" />
          <h2>Tabla proyectada</h2>
        </div>

        {!result && !loading && (
          <div className="ol-empty">
            <p>Agrega fichajes hipotéticos y presiona Simular temporada para ver cómo cambiaría la tabla.</p>
          </div>
        )}

        {loading && (
          <div className="ol-loading">
            <span className="ol-spinner" />
            <p>Calculando tabla proyectada…</p>
          </div>
        )}

        {result && (
          <div className="ol-table-wrap">
            <table className="ol-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Club</th>
                  <th style={{ width: 54, textAlign: "right" }}>Pts</th>
                  <th style={{ width: 72, textAlign: "right" }}>Cambio</th>
                </tr>
              </thead>
              <tbody>
                {result.map((row) => {
                  const affected = transfers.some(
                    (t) => t.fromClubId === row.club_id || t.toClubId === row.club_id
                  );
                  const ptsDelta = row.avg_pts - row.avg_pts_base;
                  const posDelta = basePosition(row.club_id) - row.position;
                  const isPos = ptsDelta > 0.05;
                  const isNeg = ptsDelta < -0.05;
                  return (
                    <tr key={row.club_id} className={affected ? "ol-row--affected" : ""}>
                      <td className="ol-cell-pos">
                        {row.position <= 4 && <span className="ol-pos-dot ol-pos-dot--ucl" />}
                        {row.position >= 18 && <span className="ol-pos-dot ol-pos-dot--rel" />}
                        {row.position}
                        {posDelta !== 0 && (
                          <span style={{
                            fontSize: "0.62rem",
                            marginLeft: "2px",
                            color: posDelta > 0 ? "var(--ph-green-600)" : "var(--ph-danger-600)",
                          }}>
                            {posDelta > 0 ? `↑${posDelta}` : `↓${Math.abs(posDelta)}`}
                          </span>
                        )}
                      </td>
                      <td className="ol-cell-club">
                        <div className="ol-table-club-row">
                          <div
                            className="ol-club-badge ol-club-badge--xs"
                            style={{ background: `hsl(${clubHue(row.club)},52%,32%)` }}
                          >
                            {clubInitials(row.club)}
                          </div>
                          {row.club}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontSize: "0.84rem", color: "var(--ph-text)" }}>
                        {row.avg_pts.toFixed(1)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`ol-cell-delta ${isPos ? "ol-delta--pos" : isNeg ? "ol-delta--neg" : ""}`}>
                          {isPos ? "+" : ""}{ptsDelta.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: "0.65rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.73rem", color: "var(--ph-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="ol-pos-dot ol-pos-dot--ucl" />Top 4 — Champions League
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="ol-pos-dot ol-pos-dot--rel" />18–20 — Descenso
              </span>
              <span>↑↓ Posiciones ganadas/perdidas con los fichajes</span>
            </div>
            <p style={{ marginTop: "0.4rem", fontSize: "0.73rem", color: "var(--ph-muted)" }}>
              Pts: media de la simulación con los fichajes. Cambio: diferencia respecto a proyección sin fichajes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
