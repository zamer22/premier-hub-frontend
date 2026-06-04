import { useEffect, useState } from "react";
import type { PLClub } from "../../components/offseason/types";
import ClubGrid from "../../components/offseason/ClubGrid";
import {
  clubInitials, clubHue, posAbbr,
  fitLabel, fitClass, gaugeColor,
} from "../../components/offseason/utils";

const API_URL = import.meta.env.VITE_API_URL;
const CIRC = 2 * Math.PI * 42; // circunferencia para r=42

type Player = { id: number; name: string; age: number; position: string };
type PredictResult = { probability: number; fit_score: "Low" | "Medium" | "High"; reasons: string[] };
type HistoryEntry = { playerName: string; fromClub: string; targetClub: string; result: PredictResult };

export default function TransferPredictor({
  clubs,
  onLoadingChange,
  onActionSuccess,
}: {
  clubs: PLClub[];
  onLoadingChange: (v: boolean) => void;
  onActionSuccess?: (accion: string, resultado?: Record<string, unknown>) => void;
}) {
  const [sourceClubId, setSourceClubId] = useState<number | "">("");
  const [players, setPlayers]           = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [targetClubId, setTargetClubId] = useState<number | "">("");
  const [marketValue, setMarketValue]   = useState("");
  const [yearsLeft, setYearsLeft]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<PredictResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [history, setHistory]           = useState<HistoryEntry[]>([]);

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

  const targetClubs   = clubs.filter((c) => c.id !== sourceClubId);
  const sourceClub    = clubs.find((c) => c.id === sourceClubId);
  const targetClub    = clubs.find((c) => c.id === targetClubId);
  const mvNum         = marketValue ? parseFloat(marketValue) : NaN;
  const mvTooLow      = !isNaN(mvNum) && mvNum > 0 && mvNum < 0.5;
  const canPredict    = !!selectedPlayer && targetClubId !== "" && !mvTooLow;

  const handlePredict = async () => {
    if (!canPredict || !selectedPlayer) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ml/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: selectedPlayer.id,
          target_club_id: targetClubId,
          market_value_eur: marketValue && !isNaN(mvNum) && mvNum >= 0.5
            ? mvNum * 1_000_000
            : undefined,
          years_left: yearsLeft ? parseFloat(yearsLeft) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      const fromName   = sourceClub?.name ?? "";
      const targetName = targetClub?.name ?? "";
      setResult(data.data);
      setHistory((prev) =>
        [{ playerName: selectedPlayer.name, fromClub: fromName, targetClub: targetName, result: data.data }, ...prev].slice(0, 5)
      );
      onActionSuccess?.("transfer_predict", { probability: data.data.probability });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedPlayer(null);
    setTargetClubId("");
    setMarketValue("");
    setYearsLeft("");
    setResult(null);
    setError(null);
  };

  const arc = result ? (result.probability / 100) * CIRC : 0;

  return (
    <div className="ol-grid">
      {/* ── Panel izquierdo ─────────────────────────────────────────────── */}
      <section className="ol-panel">
        <div className="ol-section-title">
          <span className="ol-accent" />
          <h2>Jugador y destino</h2>
        </div>

        {/* Ruta visual de la transferencia */}
        <div className="ol-route">
          <div className="ol-route-side">
            {sourceClub ? (
              <>
                <div className="ol-club-badge" style={{ background: `hsl(${clubHue(sourceClub.name)},52%,32%)` }}>
                  {clubInitials(sourceClub.name)}
                </div>
                <span className="ol-route-name">{sourceClub.name}</span>
              </>
            ) : (
              <div className="ol-club-badge ol-club-badge--empty">?</div>
            )}
          </div>
          <div className="ol-route-arrow">
            <svg width="44" height="14" viewBox="0 0 44 14" fill="none">
              <line x1="0" y1="7" x2="36" y2="7" stroke="var(--ph-border-strong)" strokeWidth="1.5"/>
              <polyline points="28,1 36,7 28,13" stroke="var(--ph-border-strong)" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="ol-route-side">
            {targetClub ? (
              <>
                <div className="ol-club-badge" style={{ background: `hsl(${clubHue(targetClub.name)},52%,32%)` }}>
                  {clubInitials(targetClub.name)}
                </div>
                <span className="ol-route-name">{targetClub.name}</span>
              </>
            ) : (
              <div className="ol-club-badge ol-club-badge--empty">?</div>
            )}
          </div>
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
              {players.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.position}</option>)}
            </select>
          </label>
        </div>

        {selectedPlayer && (
          <div className="ol-player-card">
            <div className="ol-player-card-inner">
              <div>
                <p className="ol-player-name">{selectedPlayer.name}</p>
                <p className="ol-player-meta">{selectedPlayer.position} · {selectedPlayer.age} años</p>
              </div>
              <span className="ol-pos-pill">{posAbbr(selectedPlayer.position)}</span>
            </div>
          </div>
        )}

        <div className="ol-field-group">
          <label className="ol-label">
            Club destino
            <ClubGrid clubs={targetClubs} selectedId={targetClubId} onSelect={setTargetClubId} disabled={!selectedPlayer} />
          </label>
        </div>

        <p className="ol-section-minor">Detalles del jugador (opcional)</p>
        <div className="ol-field-row">
          <label className="ol-label">
            Valor de mercado (€M)
            <input
              type="number"
              className={`ol-input${mvTooLow ? " ol-input--error" : ""}`}
              placeholder="ej. 45 (vacío = estimado)"
              value={marketValue}
              min={0.5}
              step={0.5}
              onChange={(e) => setMarketValue(e.target.value)}
            />
            {mvTooLow && (
              <span className="ol-field-hint ol-field-hint--error">
                Mínimo €0.5M — deja vacío para usar el estimado del modelo
              </span>
            )}
          </label>
          <label className="ol-label">
            Años de contrato
            <input
              type="number"
              className="ol-input"
              placeholder="ej. 2"
              value={yearsLeft}
              min={0}
              max={6}
              step={0.5}
              onChange={(e) => setYearsLeft(e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="ol-primary"
          onClick={handlePredict}
          disabled={!canPredict || loading}
        >
          {loading ? "Analizando transferencia…" : "Predecir transferencia"}
        </button>
        {error && <p className="ol-error">{error}</p>}
      </section>

      {/* ── Panel derecho ────────────────────────────────────────────────── */}
      <section className="ol-panel">
        <div className="ol-section-title ol-section-title--navy">
          <span className="ol-accent ol-accent--navy" />
          <h2>Resultado</h2>
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--ph-muted)", margin: "0 0 0.75rem" }}>
          El modelo mide qué tan bien encaja este jugador en el perfil histórico de un fichaje de la Premier League. No es la probabilidad de que se cierre este traspaso específico.
        </p>

        {!result && !loading && (
          <div className="ol-empty">
            <div className="ol-gauge-placeholder">
              <svg className="ol-gauge-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ph-border)" strokeWidth="7" />
              </svg>
              <div className="ol-gauge-center">
                <span className="ol-gauge-placeholder-text">—%</span>
              </div>
            </div>
            <p style={{ textAlign: "center", color: "var(--ph-muted)", fontSize: "0.86rem", margin: "0.75rem 0 0" }}>
              Selecciona jugador y destino para ver la predicción
            </p>
          </div>
        )}

        {loading && (
          <div className="ol-loading">
            <span className="ol-spinner" />
            <p>El modelo ML está analizando la transferencia…</p>
          </div>
        )}

        {result && (
          <div className="ol-result">
            {/* Gauge circular */}
            <div className="ol-gauge-wrap">
              <svg className="ol-gauge-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ph-border)" strokeWidth="7" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={gaugeColor(result.probability)}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${arc} ${CIRC}`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
              </svg>
              <div className="ol-gauge-center">
                <span className="ol-gauge-value" style={{ color: gaugeColor(result.probability) }}>
                  {result.probability.toFixed(1)}%
                </span>
                <span className="ol-gauge-sub">aptitud PL</span>
              </div>
            </div>

            <div className="ol-fit-row">
              <span className="ol-fit-label">Compatibilidad</span>
              <span className={`ol-fit-badge ${fitClass(result.fit_score)}`}>{fitLabel(result.fit_score)}</span>
            </div>

            <div className="ol-reasons-block">
              <p className="ol-meta-label">Factores clave</p>
              <ul className="ol-reasons-list">
                {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <button type="button" className="ol-secondary ol-secondary--full" onClick={handleReset}>
              Probar otra transferencia
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="ol-history">
            <p className="ol-meta-label">Historial de sesión</p>
            {history.map((h, i) => (
              <div key={i} className="ol-history-card">
                <div className="ol-history-info">
                  <span className="ol-history-player">{h.playerName}</span>
                  <span className="ol-history-sep">→</span>
                  <span className="ol-history-club">{h.targetClub}</span>
                </div>
                <div className="ol-history-meta">
                  <span className="ol-history-prob" style={{ color: gaugeColor(h.result.probability) }}>
                    {h.result.probability.toFixed(1)}%
                  </span>
                  <span className={`ol-fit-badge ol-fit-badge--sm ${fitClass(h.result.fit_score)}`}>
                    {fitLabel(h.result.fit_score)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
