import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type TeamInfo = { id: number; name: string };
type PlayerInfo = { id: number; name: string; pos: string };
type LineupTeam = { startXI?: Array<{ player: PlayerInfo }>; substitutes?: Array<{ player: PlayerInfo }> };
type MatchPreview = {
  fixture_id: number;
  home_team: TeamInfo;
  away_team: TeamInfo;
  score: { home: number; away: number };
  lineups: { home: LineupTeam; away: LineupTeam };
};
type KeyChange = { description: string; xg_delta: number };
type RewindResult = {
  original_score: { home: number; away: number };
  predicted_score: { home: number; away: number };
  key_changes: KeyChange[];
  no_change: boolean;
};

function posLabel(pos: string): string {
  if (pos === "G") return "POR";
  if (["D", "CB", "LB", "RB", "LWB", "RWB"].includes(pos)) return "DEF";
  if (["M", "CM", "DM", "AM", "LM", "RM"].includes(pos)) return "MED";
  return "DEL";
}

export default function MatchRewind() {
  const [fixtureInput, setFixtureInput] = useState("");
  const [preview, setPreview] = useState<MatchPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string; team: "home" | "away" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewindResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMatch = async () => {
    const id = parseInt(fixtureInput);
    if (!id) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    setSelectedPlayer(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ml/match/${id}`);
      const data = await res.json();
      if (!data.success) { setPreviewError(data.message); return; }
      setPreview(data.data);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRewind = async () => {
    if (!preview || !selectedPlayer) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ml/rewind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: preview.fixture_id,
          modifications: [{ type: "remove_player", player_id: selectedPlayer.id, team: selectedPlayer.team }],
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const renderLineup = (lineup: LineupTeam, team: "home" | "away") =>
    (lineup.startXI ?? []).map(({ player }) => (
      <button
        key={player.id}
        type="button"
        className={`ol-player-btn${selectedPlayer?.id === player.id ? " ol-player-btn--active" : ""}`}
        onClick={() => setSelectedPlayer({ id: player.id, name: player.name, team })}
      >
        <span className="ol-player-pos">{posLabel(player.pos)}</span>
        <span className="ol-player-nm">{player.name}</span>
      </button>
    ));

  return (
    <div className="ol-grid">
      <section className="ol-panel">
        <div className="ol-section-title">
          <span className="ol-accent" />
          <h2>Seleccionar partido</h2>
        </div>

        <div className="ol-fixture-row">
          <input
            type="number"
            className="ol-input ol-input--grow"
            placeholder="Fixture ID de API-Football"
            value={fixtureInput}
            onChange={(e) => setFixtureInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLoadMatch(); }}
          />
          <button type="button" className="ol-secondary" onClick={handleLoadMatch} disabled={!fixtureInput || previewLoading}>
            {previewLoading ? "Cargando…" : "Cargar partido"}
          </button>
        </div>
        {previewError ? <p className="ol-error">{previewError}</p> : null}

        {!preview && !previewLoading && !previewError ? (
          <div className="ol-empty">
            <p>Ingresa el Fixture ID de un partido histórico de la Premier League para comenzar.</p>
          </div>
        ) : null}

        {preview ? (
          <>
            <div className="ol-match-header">
              <span className="ol-match-team">{preview.home_team.name}</span>
              <span className="ol-match-score-badge">{preview.score.home} – {preview.score.away}</span>
              <span className="ol-match-team ol-match-team--right">{preview.away_team.name}</span>
            </div>

            <p className="ol-lineup-hint">Selecciona un jugador para quitarlo del partido</p>

            <div className="ol-lineups">
              <div className="ol-lineup-col">
                <p className="ol-lineup-club">{preview.home_team.name}</p>
                {renderLineup(preview.lineups.home, "home")}
              </div>
              <div className="ol-lineup-col">
                <p className="ol-lineup-club">{preview.away_team.name}</p>
                {renderLineup(preview.lineups.away, "away")}
              </div>
            </div>

            {selectedPlayer ? (
              <div className="ol-mod-summary">
                Quitar a <strong>{selectedPlayer.name}</strong> del{" "}
                {selectedPlayer.team === "home" ? preview.home_team.name : preview.away_team.name}
              </div>
            ) : null}

            <button type="button" className="ol-primary" onClick={handleRewind} disabled={!selectedPlayer || loading} style={{ marginTop: "0.75rem" }}>
              {loading ? "Calculando resultado alternativo…" : "Rewind"}
            </button>
            {error ? <p className="ol-error">{error}</p> : null}
          </>
        ) : null}
      </section>

      <section className="ol-panel">
        <div className="ol-section-title ol-section-title--navy">
          <span className="ol-accent ol-accent--navy" />
          <h2>Resultado alternativo</h2>
        </div>

        {!result && !loading ? (
          <div className="ol-empty">
            <p>Carga un partido, selecciona un jugador y presiona Rewind.</p>
          </div>
        ) : null}

        {loading ? (
          <div className="ol-loading">
            <span className="ol-spinner" />
            <p>Calculando con xG proxy y simulación de Poisson…</p>
          </div>
        ) : null}

        {result ? (
          <div className="ol-result">
            <div className="ol-score-compare">
              <div className="ol-score-card">
                <p className="ol-meta-label">Original</p>
                <p className="ol-score-value">{result.original_score.home} – {result.original_score.away}</p>
              </div>
              <div className="ol-score-arrow">→</div>
              <div className={`ol-score-card ${result.no_change ? "" : "ol-score-card--alt"}`}>
                <p className="ol-meta-label">Alternativo</p>
                <p className="ol-score-value">{result.predicted_score.home} – {result.predicted_score.away}</p>
              </div>
            </div>

            {result.no_change ? (
              <div className="ol-no-change">El resultado no habría cambiado con esta modificación.</div>
            ) : null}

            {result.key_changes.length > 0 ? (
              <div className="ol-reasons-block">
                <p className="ol-meta-label">Impacto de la modificación</p>
                <ul className="ol-reasons-list">
                  {result.key_changes.map((kc, i) => (
                    <li key={i}>
                      {kc.description}
                      <span className={`ol-xg-delta ${kc.xg_delta >= 0 ? "ol-xg-delta--pos" : "ol-xg-delta--neg"}`}>
                        {kc.xg_delta >= 0 ? "+" : ""}{kc.xg_delta.toFixed(2)} xG
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
