import { useEffect, useState } from "react";
import { crestUrl } from "../../components/offseason/ClubGrid";
import type { IconicMatch, MatchPreview, RewindResult } from "../../components/offseason/types";
import EventRow, { KIND_ABBR } from "../../components/offseason/EventRow";
import InstructivoModal from "../../components/offseason/InstructivoModal";

const API_URL = import.meta.env.VITE_API_URL;

const INSTRUCTIVO_PASOS = [
  { titulo: "Elige un partido", detalle: "Selecciona uno de los partidos icónicos de la lista para cargar su línea de tiempo." },
  { titulo: "Quita eventos clave", detalle: "Marca los goles o tarjetas rojas que quieres borrar del partido para construir el escenario hipotético." },
  { titulo: "Calcula el resultado", detalle: "El modelo recalcula el marcador como si esos eventos nunca hubieran pasado." },
  { titulo: "Compara", detalle: "Abajo verás el resultado real contra el alternativo y por qué cambió." },
];

export default function MatchRewind({
  onLoadingChange,
  onActionSuccess,
}: {
  onLoadingChange: (v: boolean) => void;
  onActionSuccess?: (accion: string, resultado?: Record<string, unknown>) => void;
}) {
  const [iconicMatches, setIconicMatches]   = useState<IconicMatch[]>([]);
  const [preview, setPreview]               = useState<MatchPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<RewindResult | null>(null);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => { onLoadingChange(loading); }, [loading, onLoadingChange]);

  useEffect(() => {
    fetch(`${API_URL}/api/ml/iconic-matches`)
      .then((r) => r.json())
      .then((data) => { if (data.success && Array.isArray(data.data)) setIconicMatches(data.data); })
      .catch(() => {});
  }, []);

  const handleLoadMatch = async (id: number) => {
    const fixtureId = id;
    if (!fixtureId) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    setSelectedEvents(new Set());
    setResult(null);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/ml/match/${fixtureId}`);
      const data = await res.json();
      if (!data.success) { setPreviewError(data.message); return; }
      setPreview(data.data);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
    setResult(null);
    setError(null);
  };

  const handleRewind = async () => {
    if (!preview || selectedEvents.size === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const modifications = preview.events
        .filter((e) => selectedEvents.has(e.id) && e.removable)
        .map((e) => ({ kind: e.kind, team: e.team, minute: e.minute }));

      const res  = await fetch(`${API_URL}/api/ml/rewind`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          match_id:      preview.fixture_id,
          match_minutes: preview.match_minutes,
          modifications,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setResult(data.data);
      onActionSuccess?.("match_rewind", { no_change: data.data.no_change });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const homeEvents     = preview?.events.filter((e) => e.team === "home" && e.removable) ?? [];
  const awayEvents     = preview?.events.filter((e) => e.team === "away" && e.removable) ?? [];
  const selectedList   = preview?.events.filter((e) => selectedEvents.has(e.id)) ?? [];
  const removableCount = homeEvents.length + awayEvents.length;

  return (
    <div className="ol-stack">
      {/* ── Selección ───────────────────────────────────────────────────── */}
      <section className="ol-panel">
        <div className="ol-section-title">
          <span className="ol-accent" />
          <h2>Seleccionar partido</h2>
          <InstructivoModal
            titulo="Match Rewind"
            intro="Revive un partido histórico y cambia su desenlace quitando goles o expulsiones clave."
            pasos={INSTRUCTIVO_PASOS}
          />
        </div>

        <div className="ol-field-group" style={{ marginBottom: "0.65rem" }}>
          <label className="ol-label">
            Partidos icónicos
            <select
              className="ol-select"
              defaultValue=""
              onChange={(e) => { if (e.target.value) handleLoadMatch(Number(e.target.value)); }}
              disabled={iconicMatches.length === 0 || previewLoading}
            >
              <option value="">{iconicMatches.length === 0 ? "Cargando partidos…" : "Seleccionar partido icónico…"}</option>
              {iconicMatches.map((m) => (
                <option key={m.fixture_id} value={m.fixture_id}>{m.label}</option>
              ))}
            </select>
          </label>
        </div>
        {previewError && <p className="ol-error">{previewError}</p>}

        {!preview && !previewLoading && !previewError && (
          <div className="ol-empty" style={{ minHeight: 140 }}>
            <p>Elige un partido icónico para ver su línea de tiempo.</p>
          </div>
        )}

        {preview && (
          <>
            <div className="ol-match-ticket">
              <div className="ol-ticket-team">
                <img src={crestUrl(preview.home_team.id)} alt={preview.home_team.name} className="ol-crest--md" loading="lazy" />
                <span className="ol-ticket-team-name">{preview.home_team.name}</span>
              </div>
              <div className="ol-ticket-score">
                <span>{preview.score.home}</span>
                <span className="ol-ticket-sep">–</span>
                <span>{preview.score.away}</span>
              </div>
              <div className="ol-ticket-team ol-ticket-team--right">
                <span className="ol-ticket-team-name">{preview.away_team.name}</span>
                <img src={crestUrl(preview.away_team.id)} alt={preview.away_team.name} className="ol-crest--md" loading="lazy" />
              </div>
            </div>

            {preview.events.length === 0 ? (
              <div className="ol-empty" style={{ minHeight: 80 }}>
                <p>No hay datos de eventos para este partido.</p>
              </div>
            ) : (
              <>
                <p className="ol-section-minor" style={{ marginTop: "1rem" }}>
                  Marca los eventos que quieres quitar del escenario hipotético.
                </p>

                <div className="ol-events-columns">
                  <div className="ol-events-col">
                    <p className="ol-events-col-header">
                      <img src={crestUrl(preview.home_team.id)} alt={preview.home_team.name} className="ol-crest--xs" loading="lazy" />
                      {preview.home_team.name}
                    </p>
                    {homeEvents.length === 0 && <p className="ol-events-empty">Sin eventos</p>}
                    {homeEvents.map((e) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        selected={selectedEvents.has(e.id)}
                        onToggle={toggleEvent}
                      />
                    ))}
                  </div>

                  <div className="ol-events-col">
                    <p className="ol-events-col-header">
                      <img src={crestUrl(preview.away_team.id)} alt={preview.away_team.name} className="ol-crest--xs" loading="lazy" />
                      {preview.away_team.name}
                    </p>
                    {awayEvents.length === 0 && <p className="ol-events-empty">Sin eventos</p>}
                    {awayEvents.map((e) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        selected={selectedEvents.has(e.id)}
                        onToggle={toggleEvent}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* ── Resultado (abajo) ────────────────────────────────────────────── */}
      <section className="ol-panel">
        <div className="ol-section-title ol-section-title--navy">
          <span className="ol-accent ol-accent--navy" />
          <h2>Escenario hipotético</h2>
        </div>

        {preview && selectedList.length > 0 ? (
          <div className="ol-mod-summary-list">
            <p className="ol-meta-label">Si esto no hubiera pasado…</p>
            {selectedList.map((e) => (
              <div key={e.id} className="ol-mod-tag">
                <span className="ol-mod-tag-icon">{KIND_ABBR[e.kind]}</span>
                <span className="ol-mod-tag-text">
                  <strong>{e.minute}'</strong> — {e.label} de {e.player_name}
                  <span className="ol-mod-tag-team"> ({e.team_name})</span>
                </span>
                <button
                  type="button"
                  className="ol-mod-tag-remove"
                  onClick={() => toggleEvent(e.id)}
                  aria-label="Quitar"
                >×</button>
              </div>
            ))}
          </div>
        ) : (
          !result && !loading && (
            <div className="ol-empty" style={{ minHeight: 120 }}>
              <p>
                {preview
                  ? (removableCount > 0
                      ? "Marca uno o más goles o tarjetas rojas para construir el escenario hipotético."
                      : "Este partido no tiene goles ni tarjetas rojas para modificar.")
                  : "Carga un partido para ver sus eventos."}
              </p>
            </div>
          )
        )}

        {preview && selectedList.length > 0 && !loading && !result && (
          <button
            type="button"
            className="ol-primary"
            onClick={handleRewind}
            style={{ marginTop: "0.75rem" }}
          >
            Calcular resultado alternativo
          </button>
        )}

        {loading && (
          <div className="ol-loading">
            <span className="ol-spinner" />
            <p>Calculando el escenario alternativo…</p>
          </div>
        )}

        {error && <p className="ol-error" style={{ marginTop: "0.5rem" }}>{error}</p>}

        {result && (
          <div className="ol-result" style={{ marginTop: "0.25rem" }}>
            <div className="ol-score-compare">
              <div className="ol-score-card">
                <p className="ol-meta-label">Resultado real</p>
                <p className="ol-score-value">
                  {result.original_score.home} – {result.original_score.away}
                </p>
              </div>
              <div className="ol-score-arrow">→</div>
              <div className={`ol-score-card ${result.no_change ? "" : "ol-score-card--alt"}`}>
                <p className="ol-meta-label">Resultado alternativo</p>
                <p className="ol-score-value">
                  {result.predicted_score.home} – {result.predicted_score.away}
                </p>
              </div>
            </div>

            {result.no_change && (
              <div className="ol-no-change">
                El resultado no habría cambiado con estos eventos eliminados.
              </div>
            )}

            {result.key_changes.length > 0 && (
              <div className="ol-reasons-block">
                <p className="ol-meta-label">Cómo lo calcula el modelo</p>
                <ul className="ol-reasons-list">
                  {result.key_changes.map((kc, i) => (
                    <li key={i}>{kc.description}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              className="ol-secondary ol-secondary--full"
              onClick={() => { setResult(null); setSelectedEvents(new Set()); }}
              style={{ marginTop: "0.75rem" }}
            >
              Probar otro escenario
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
