import { useEffect, useState } from "react";
import type { PLClub } from "../../components/offseason/types";

const API_URL = import.meta.env.VITE_API_URL;

type Player = { id: number; name: string; age: number; position: string };
type PredictResult = { probability: number; fit_score: "Low" | "Medium" | "High"; reasons: string[] };
type HistoryEntry = { playerName: string; targetClub: string; result: PredictResult };

function fitClass(score: string) {
  if (score === "High") return "lab-fit--high";
  if (score === "Medium") return "lab-fit--medium";
  return "lab-fit--low";
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
      .then((d) => setPlayers(d.success ? d.data : []))
      .catch(() => setPlayers([]))
      .finally(() => setPlayersLoading(false));
  }, [sourceClubId]);

  const targetClubs = clubs.filter((c) => c.id !== sourceClubId);
  const canPredict = !!selectedPlayer && targetClubId !== "";

  const handlePredict = async () => {
    if (!canPredict || !selectedPlayer) return;
    setLoading(true); setError(null); setResult(null);
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
    setResult(null); setSelectedPlayer(null); setTargetClubId(""); setMarketValue(""); setYearsLeft("");
  };

  return (
    <div className="lab-grid">
      <section className="lab-panel">
        <div className="lab-section-title">
          <span className="lab-accent-bar" />
          <h2>Jugador y destino</h2>
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
                {playersLoading ? "Cargando jugadores…" : !sourceClubId ? "Selecciona un club primero" : "Seleccionar jugador…"}
              </option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
            </select>
          </label>
        </div>

        {selectedPlayer && (
          <div className="lab-player-card">
            <p className="lab-player-card-name">{selectedPlayer.name}</p>
            <p className="lab-player-card-meta">{selectedPlayer.position} · {selectedPlayer.age} años</p>
          </div>
        )}

        <div className="lab-field-group">
          <label className="lab-label">
            Club destino
            <select className="lab-select" value={targetClubId} onChange={(e) => setTargetClubId(e.target.value ? Number(e.target.value) : "")} disabled={!selectedPlayer}>
              <option value="">Seleccionar destino…</option>
              {targetClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>

        <p className="lab-section-minor">Detalles adicionales (opcional)</p>
        <div className="lab-field-row">
          <label className="lab-label">
            Valor de mercado (€M)
            <input type="number" className="lab-input" placeholder="ej. 45" value={marketValue} min={0} onChange={(e) => setMarketValue(e.target.value)} />
          </label>
          <label className="lab-label">
            Años de contrato
            <input type="number" className="lab-input" placeholder="ej. 2" value={yearsLeft} min={0} max={6} step={0.5} onChange={(e) => setYearsLeft(e.target.value)} />
          </label>
        </div>

        <button type="button" className="lab-btn-primary" onClick={handlePredict} disabled={!canPredict || loading}>
          {loading ? "Analizando transferencia…" : "Predecir transferencia"}
        </button>
        {error && <p className="lab-error">{error}</p>}
      </section>

      <section className="lab-panel">
        <div className="lab-section-title">
          <span className="lab-accent-bar lab-accent-bar--muted" />
          <h2>Resultado</h2>
        </div>

        {!result && !loading && (
          <div className="lab-empty">
            <p>Selecciona un jugador y un club destino para ver la predicción.</p>
          </div>
        )}

        {loading && (
          <div className="lab-loading">
            <span className="lab-spinner" />
            <p>El modelo ML está analizando la transferencia…</p>
          </div>
        )}

        {result && (
          <div className="lab-result">
            <div className="lab-prob-block">
              <p className="lab-meta-label">Probabilidad</p>
              <p className="lab-prob-value">
                {result.probability.toFixed(1)}<span>%</span>
              </p>
              <progress className="lab-prob-bar" value={result.probability} max={100} />
            </div>

            <div className="lab-fit-row">
              <span className="lab-fit-label">Fit Score</span>
              <span className={`lab-fit-badge ${fitClass(result.fit_score)}`}>{result.fit_score}</span>
            </div>

            <div className="lab-reasons-block">
              <p className="lab-meta-label">Factores</p>
              <ul className="lab-reasons-list">
                {result.reasons.map((r, i) => (
                  <li key={i}>
                    <span className="lab-reason-arrow">›</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <button type="button" className="lab-btn-secondary lab-btn-secondary--full" onClick={handleReset}>
              Intentar otra transferencia
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="lab-history">
            <p className="lab-meta-label">Historial de sesión</p>
            {history.map((h, i) => (
              <div key={i} className="lab-history-card">
                <div className="lab-history-info">
                  <span className="lab-history-player">{h.playerName}</span>
                  <span className="lab-history-sep">→</span>
                  <span className="lab-history-club">{h.targetClub}</span>
                </div>
                <div className="lab-history-meta">
                  <span className="lab-history-prob">{h.result.probability.toFixed(1)}%</span>
                  <span className={`lab-fit-badge lab-fit-badge--sm ${fitClass(h.result.fit_score)}`}>{h.result.fit_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
