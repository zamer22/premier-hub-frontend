import { useEffect, useState } from "react";
import { crestUrl } from "./ClubGrid";

const API_URL = import.meta.env.VITE_API_URL;

type IconicMatch = {
  fixture_id: number;
  title: string;
  description: string;
  date: string;
  season: number;
  home_team: { id: number; name: string };
  away_team: { id: number; name: string };
  score: { home: number; away: number };
};

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
  const [iconicMatches, setIconicMatches] = useState<IconicMatch[]>([]);
  const [selectedIconic, setSelectedIconic] = useState<IconicMatch | null>(null);
  const [preview, setPreview] = useState<MatchPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string; team: "home" | "away" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewindResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/ml/iconic-matches`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setIconicMatches(d.data); })
      .catch(() => {});
  }, []);

  const handleSelectMatch = async (match: IconicMatch) => {
    setSelectedIconic(match);
    setPreview(null);
    setSelectedPlayer(null);
    setResult(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ml/match/${match.fixture_id}`);
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
    setLoading(true); setError(null); setResult(null);
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
        className={`lab-player-btn${selectedPlayer?.id === player.id ? " lab-player-btn--active" : ""}`}
        onClick={() => setSelectedPlayer({ id: player.id, name: player.name, team })}
      >
        <span className="lab-player-pos">{posLabel(player.pos)}</span>
        <span className="lab-player-nm">{player.name}</span>
      </button>
    ));

  return (
    <div className="lab-grid">
      <section className="lab-panel">
        <div className="lab-section-title">
          <span className="lab-accent-bar" />
          <h2>Seleccionar partido</h2>
        </div>

        {iconicMatches.length === 0 && (
          <div className="lab-loading">
            <span className="lab-spinner" />
            <p>Cargando partidos históricos…</p>
          </div>
        )}

        {iconicMatches.length > 0 && !selectedIconic && (
          <div className="lab-iconic-grid">
            {iconicMatches.map((m) => (
              <button
                key={m.fixture_id}
                type="button"
                className="lab-iconic-card"
                onClick={() => handleSelectMatch(m)}
              >
                <div className="lab-iconic-crests">
                  <img src={crestUrl(m.home_team.id)} alt={m.home_team.name} className="lab-iconic-crest" loading="lazy" />
                  <span className="lab-iconic-vs">vs</span>
                  <img src={crestUrl(m.away_team.id)} alt={m.away_team.name} className="lab-iconic-crest" loading="lazy" />
                </div>
                <p className="lab-iconic-title">{m.title}</p>
                <p className="lab-iconic-date">{m.date} · {m.season}/{String(m.season + 1).slice(2)}</p>
              </button>
            ))}
          </div>
        )}

        {selectedIconic && (
          <>
            <button type="button" className="lab-btn-secondary" onClick={() => { setSelectedIconic(null); setPreview(null); setResult(null); }}>
              ← Volver a la lista
            </button>

            {previewLoading && (
              <div className="lab-loading">
                <span className="lab-spinner" />
                <p>Cargando alineaciones…</p>
              </div>
            )}

            {previewError && <p className="lab-error">{previewError}</p>}

            {preview && (
              <>
                <div className="lab-match-header">
                  <span className="lab-match-team">
                    <img src={crestUrl(preview.home_team.id)} alt={preview.home_team.name} className="lab-match-crest" loading="lazy" />
                    {preview.home_team.name}
                  </span>
                  <span className="lab-match-score">{preview.score.home} – {preview.score.away}</span>
                  <span className="lab-match-team lab-match-team--right">
                    {preview.away_team.name}
                    <img src={crestUrl(preview.away_team.id)} alt={preview.away_team.name} className="lab-match-crest" loading="lazy" />
                  </span>
                </div>

                <p className="lab-lineup-hint">Selecciona un jugador para quitarlo del partido</p>

                <div className="lab-lineups">
                  <div className="lab-lineup-col">
                    <p className="lab-lineup-club">{preview.home_team.name}</p>
                    {renderLineup(preview.lineups.home, "home")}
                  </div>
                  <div className="lab-lineup-col">
                    <p className="lab-lineup-club">{preview.away_team.name}</p>
                    {renderLineup(preview.lineups.away, "away")}
                  </div>
                </div>

                {selectedPlayer && (
                  <div className="lab-mod-summary">
                    Quitar a <strong>{selectedPlayer.name}</strong> del{" "}
                    {selectedPlayer.team === "home" ? preview.home_team.name : preview.away_team.name}
                  </div>
                )}

                <button type="button" className="lab-btn-primary" onClick={handleRewind} disabled={!selectedPlayer || loading}>
                  {loading ? "Calculando resultado alternativo…" : "Revivir partido"}
                </button>
                {error && <p className="lab-error">{error}</p>}
              </>
            )}
          </>
        )}
      </section>

      <section className="lab-panel">
        <div className="lab-section-title">
          <span className="lab-accent-bar lab-accent-bar--muted" />
          <h2>Resultado alternativo</h2>
        </div>

        {!result && !loading && (
          <div className="lab-empty">
            <p>Selecciona un partido histórico, elige un jugador y presiona Rewind.</p>
          </div>
        )}

        {loading && (
          <div className="lab-loading">
            <span className="lab-spinner" />
            <p>Calculando el resultado alternativo…</p>
          </div>
        )}

        {result && (
          <div className="lab-result">
            <div className="lab-score-compare">
              <div className="lab-score-card">
                <p className="lab-meta-label">Original</p>
                <p className="lab-score-value">{result.original_score.home} – {result.original_score.away}</p>
              </div>
              <div className="lab-score-arrow">→</div>
              <div className={`lab-score-card${result.no_change ? "" : " lab-score-card--alt"}`}>
                <p className="lab-meta-label">Alternativo</p>
                <p className="lab-score-value">{result.predicted_score.home} – {result.predicted_score.away}</p>
              </div>
            </div>

            {result.no_change && (
              <div className="lab-no-change">El resultado no habría cambiado con esta modificación.</div>
            )}

            {result.key_changes.length > 0 && (
              <div className="lab-reasons-block">
                <p className="lab-meta-label">Impacto de la modificación</p>
                <ul className="lab-reasons-list">
                  {result.key_changes.map((kc, i) => (
                    <li key={i}>
                      <span className="lab-reason-arrow">›</span>
                      {kc.description}
                      <span className={`lab-xg-delta${kc.xg_delta >= 0 ? " lab-xg-delta--pos" : " lab-xg-delta--neg"}`}>
                        {kc.xg_delta >= 0 ? "+" : ""}{kc.xg_delta.toFixed(2)} xG
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
