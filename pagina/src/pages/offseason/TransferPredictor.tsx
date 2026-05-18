import { useEffect, useState } from "react";
import type { PLClub } from "../../components/offseason/types";

const API_URL = import.meta.env.VITE_API_URL;

type Player = { id: number; name: string; age: number; position: string };
type PredictResult = { probability: number; fit_score: "Low" | "Medium" | "High"; reasons: string[] };
type HistoryEntry = { playerName: string; targetClub: string; result: PredictResult };

function fitClass(score: string) {
  if (score === "High") return "ol-fit--high";
  if (score === "Medium") return "ol-fit--medium";
  return "ol-fit--low";
}

export default function TransferPredictor({ clubs }: { clubs: PLClub[] }) {
  const [sourceClubId, setSourceClubId] = useState<number | "">("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [targetClubId, setTargetClubId] = useState<number | "">("");
  const [marketValue, setMarketValue] = useState("");
  const [yearsLeft, setYearsLeft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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

  const targetClubs = clubs.filter((c) => c.id !== sourceClubId);
  const canPredict = !!selectedPlayer && targetClubId !== "";

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
          market_value_eur: marketValue ? parseFloat(marketValue) * 1_000_000 : undefined,
          years_left: yearsLeft ? parseFloat(yearsLeft) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      const targetClub = clubs.find((c) => c.id === targetClubId)?.name ?? "";
      setResult(data.data);
      setHistory((prev) => [{ playerName: selectedPlayer.name, targetClub, result: data.data }, ...prev].slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
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

  return (
    <div className="ol-grid">
      <section className="ol-panel">
        <div className="ol-section-title">
          <span className="ol-accent" />
          <h2>Jugador y destino</h2>
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
                {playersLoading ? "Cargando jugadores…" : !sourceClubId ? "Selecciona un club primero" : "Seleccionar jugador…"}
              </option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
            </select>
          </label>
        </div>

        {selectedPlayer ? (
          <div className="ol-player-card">
            <p className="ol-player-name">{selectedPlayer.name}</p>
            <p className="ol-player-meta">{selectedPlayer.position} · {selectedPlayer.age} años</p>
          </div>
        ) : null}

        <div className="ol-field-group">
          <label className="ol-label">
            Club destino
            <select className="ol-select" value={targetClubId} onChange={(e) => setTargetClubId(e.target.value ? Number(e.target.value) : "")} disabled={!selectedPlayer}>
              <option value="">Seleccionar destino…</option>
              {targetClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>

        <p className="ol-section-minor">Detalles adicionales (opcional)</p>
        <div className="ol-field-row">
          <label className="ol-label">
            Valor de mercado (€M)
            <input type="number" className="ol-input" placeholder="ej. 45" value={marketValue} min={0} onChange={(e) => setMarketValue(e.target.value)} />
          </label>
          <label className="ol-label">
            Años de contrato
            <input type="number" className="ol-input" placeholder="ej. 2" value={yearsLeft} min={0} max={6} step={0.5} onChange={(e) => setYearsLeft(e.target.value)} />
          </label>
        </div>

        <button type="button" className="ol-primary" onClick={handlePredict} disabled={!canPredict || loading}>
          {loading ? "Analizando transferencia…" : "Predecir transferencia"}
        </button>
        {error ? <p className="ol-error">{error}</p> : null}
      </section>

      <section className="ol-panel">
        <div className="ol-section-title ol-section-title--navy">
          <span className="ol-accent ol-accent--navy" />
          <h2>Resultado</h2>
        </div>

        {!result && !loading ? (
          <div className="ol-empty">
            <p>Selecciona un jugador y un club destino para ver la predicción.</p>
          </div>
        ) : null}

        {loading ? (
          <div className="ol-loading">
            <span className="ol-spinner" />
            <p>El modelo ML está analizando la transferencia…</p>
          </div>
        ) : null}

        {result ? (
          <div className="ol-result">
            <div className="ol-prob-block">
              <p className="ol-meta-label">Probabilidad</p>
              <p className="ol-prob-value">{result.probability.toFixed(1)}%</p>
              <div className="ol-prob-bar">
                <div className="ol-prob-fill" style={{ width: `${result.probability}%` }} />
              </div>
            </div>

            <div className="ol-fit-row">
              <span className="ol-fit-label">Fit Score</span>
              <span className={`ol-fit-badge ${fitClass(result.fit_score)}`}>{result.fit_score}</span>
            </div>

            <div className="ol-reasons-block">
              <p className="ol-meta-label">Razones</p>
              <ul className="ol-reasons-list">
                {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <button type="button" className="ol-secondary ol-secondary--full" onClick={handleReset}>
              Try another transfer
            </button>
          </div>
        ) : null}

        {history.length > 0 ? (
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
                  <span className="ol-history-prob">{h.result.probability.toFixed(1)}%</span>
                  <span className={`ol-fit-badge ol-fit-badge--sm ${fitClass(h.result.fit_score)}`}>{h.result.fit_score}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
