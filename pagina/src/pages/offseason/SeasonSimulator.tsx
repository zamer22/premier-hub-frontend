import { useEffect, useState } from "react";
import type { PLClub } from "../../components/offseason/types";
import ClubPicker from "../../components/offseason/ClubPicker";
import PlayerPicker from "../../components/offseason/PlayerPicker";
import InstructivoModal from "../../components/offseason/InstructivoModal";
import { useClubPlayers, type ClubPlayer } from "../../hooks/useClubPlayers";
import { clubInitials, clubHue, posAbbr, posBg, posColor } from "../../components/offseason/utils";

const API_URL = import.meta.env.VITE_API_URL;

const INSTRUCTIVO_PASOS = [
  { titulo: "Arma un traspaso", detalle: "Elige el club de origen, el jugador y el club destino. Cada selector abre una tarjeta con todos los equipos o jugadores." },
  { titulo: "Suma hasta 5 fichajes", detalle: "Pulsa “Agregar fichaje” para encadenar varios traspasos en el mismo escenario." },
  { titulo: "Simula la temporada", detalle: "Corremos miles de partidos simulados para proyectar los puntos finales de cada club." },
  { titulo: "Lee la tabla", detalle: "Abajo verás la tabla proyectada y cuántas posiciones sube o baja cada equipo respecto a no hacer ningún fichaje." },
];

type Transfer = {
  playerId: number; playerName: string; position: string;
  fromClubId: number; fromClubName: string;
  toClubId: number;   toClubName: string;
};
type ClubResult = { position: number; club: string; club_id: number; avg_pts: number; avg_pts_base: number; title_odds_delta: number };

export default function SeasonSimulator({
  clubs,
  onLoadingChange,
  onActionSuccess,
}: {
  clubs: PLClub[];
  onLoadingChange: (v: boolean) => void;
  onActionSuccess?: (accion: string, resultado?: Record<string, unknown>) => void;
}) {
  const [sourceClubId, setSourceClubId]     = useState<number | "">("");
  const [selectedPlayer, setSelectedPlayer] = useState<ClubPlayer | null>(null);
  const [targetClubId, setTargetClubId]     = useState<number | "">("");
  const [transfers, setTransfers]           = useState<Transfer[]>([]);
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<ClubResult[] | null>(null);
  const [error, setError]                   = useState<string | null>(null);

  const { players, loading: playersLoading } = useClubPlayers(sourceClubId);

  useEffect(() => { onLoadingChange(loading); }, [loading, onLoadingChange]);

  // Al cambiar de club, el jugador elegido deja de ser válido.
  useEffect(() => { setSelectedPlayer(null); }, [sourceClubId]);

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
      onActionSuccess?.("season_simulate", { table: data.data.table, num_fichajes: transfers.length });
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
    <div className="ol-stack">
      {/* ── Selección ───────────────────────────────────────────────────── */}
      <section className="ol-panel">
        <div className="ol-section-title">
          <span className="ol-accent" />
          <h2>Ventana de fichajes</h2>
          {transfers.length > 0 && (
            <span className="ol-count-badge">{transfers.length}/5</span>
          )}
          <InstructivoModal
            titulo="Season Simulator"
            intro="Arma una ventana de fichajes hipotética y mira cómo quedaría la tabla de la Premier League."
            pasos={INSTRUCTIVO_PASOS}
          />
        </div>

        <div className="ol-picker-row">
          <label className="ol-label">
            Club del jugador
            <ClubPicker
              clubs={clubs}
              selectedId={sourceClubId}
              onSelect={setSourceClubId}
              title="Club del jugador"
            />
          </label>

          <label className="ol-label">
            Jugador
            <PlayerPicker
              players={players}
              loading={playersLoading}
              selectedId={selectedPlayer?.id ?? ""}
              onSelect={(id) => setSelectedPlayer(players.find((p) => p.id === id) ?? null)}
              disabled={!sourceClubId}
              disabledIds={usedPlayerIds}
              placeholder={!sourceClubId ? "Elige un club primero" : "Seleccionar jugador"}
              title="Jugador a fichar"
            />
          </label>

          <label className="ol-label">
            Club destino
            <ClubPicker
              clubs={targetClubs}
              selectedId={targetClubId}
              onSelect={setTargetClubId}
              disabled={!selectedPlayer}
              title="Club destino"
            />
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

        <div className="ol-form-actions">
          <button
            type="button"
            className="ol-primary"
            onClick={handleSimulate}
            disabled={!transfers.length || loading}
          >
            {loading ? "Calculando…" : "Simular temporada"}
          </button>
          {error && <p className="ol-error">{error}</p>}
        </div>
      </section>

      {/* ── Resultados (abajo) ───────────────────────────────────────────── */}
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
