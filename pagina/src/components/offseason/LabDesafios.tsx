import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type Desafio = {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: "diario" | "semanal";
  puntos: number;
  condicion: { accion: string; cantidad: number; condicion_extra?: Record<string, unknown> };
  fecha_fin: string;
  usuario_progreso: number;
  usuario_completado: boolean;
};

function Countdown({ fechaFin, tipo }: { fechaFin: string; tipo: "diario" | "semanal" }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(fechaFin).getTime() - Date.now();
      if (diff <= 0) { setLabel("Expirado"); return; }
      const totalH = Math.floor(diff / 3_600_000);
      const m      = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(totalH >= 24 ? `${Math.floor(totalH / 24)}d ${totalH % 24}h` : `${totalH}h ${m}m`);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [fechaFin]);

  return (
    <span className={`lab-desafio-tipo-badge lab-desafio-tipo-badge--${tipo}`}>
      {tipo === "diario" ? "Diario" : "Semanal"} · {label}
    </span>
  );
}

type Props = {
  refreshKey?: number;
  onSaldoChange?: (dinero: number) => void;
  // En la pantalla dedicada el título ya lo pone el encabezado de página,
  // así que ocultamos el título interno del panel para no duplicarlo.
  showTitle?: boolean;
};

export default function LabDesafios({ refreshKey = 0, onSaldoChange, showTitle = true }: Props) {
  const [desafios, setDesafios]     = useState<Desafio[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [reclamando, setReclamando] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`${API_URL}/api/lab/desafios`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDesafios(data.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleReclamar = async (desafio: Desafio) => {
    if (reclamando.has(desafio.id)) return;
    setReclamando((prev) => new Set(prev).add(desafio.id));
    try {
      const res  = await fetch(`${API_URL}/api/lab/desafios/${desafio.id}/reclamar`, {
        method:      "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) return;
      setDesafios((prev) =>
        prev.map((d) => d.id === desafio.id ? { ...d, usuario_completado: true } : d)
      );
      if (data.data.nuevo_dinero !== undefined) {
        onSaldoChange?.(data.data.nuevo_dinero);
      }
    } catch {}
    finally {
      setReclamando((prev) => { const s = new Set(prev); s.delete(desafio.id); return s; });
    }
  };

  if (loading) {
    return (
      <div className="ol-panel lab-desafios">
        {showTitle && (
          <div className="ol-section-title">
            <span className="ol-accent" />
            <h2>Desafíos</h2>
          </div>
        )}
        <div className="lab-desafios-skeleton">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="lab-desafio-skeleton-item" />)}
        </div>
      </div>
    );
  }

  if (error || !desafios.length) return null;

  const diarios   = desafios.filter((d) => d.tipo === "diario");
  const semanales = desafios.filter((d) => d.tipo === "semanal");

  const estaListo = (d: Desafio) =>
    d.usuario_progreso >= d.condicion.cantidad && !d.usuario_completado;

  const resumen = {
    total:        desafios.length,
    completados:  desafios.filter((d) => d.usuario_completado).length,
    porReclamar:  desafios.filter(estaListo).length,
    ptsGanados:   desafios.filter((d) => d.usuario_completado).reduce((s, d) => s + d.puntos, 0),
    ptsDisponibles: desafios.filter((d) => !d.usuario_completado).reduce((s, d) => s + d.puntos, 0),
  };

  const renderGroup = (items: Desafio[]) => {
    if (!items.length) return null;
    const tipo = items[0].tipo;
    return (
      <div className="lab-desafios-group">
        <div className="lab-desafios-group-header">
          <Countdown fechaFin={items[0].fecha_fin} tipo={tipo} />
        </div>
        <div className="lab-desafios-list">
          {items.map((d) => {
            const meta    = d.condicion.cantidad;
            const progreso = d.usuario_progreso;
            const listo   = progreso >= meta && !d.usuario_completado;
            const pct     = Math.min(100, (progreso / meta) * 100);

            let estado: "progreso" | "listo" | "completado" = "progreso";
            if (d.usuario_completado) estado = "completado";
            else if (listo)           estado = "listo";

            return (
              <div
                key={d.id}
                className={`lab-desafio-card lab-desafio-card--${estado}`}
              >
                <div className="lab-desafio-card-top">
                  <div className="lab-desafio-card-text">
                    <p className="lab-desafio-titulo">{d.titulo}</p>
                    <p className="lab-desafio-desc">{d.descripcion}</p>
                  </div>
                  <span className={`lab-desafio-pts${estado === "completado" ? " lab-desafio-pts--done" : ""}`}>
                    {d.puntos} pts
                  </span>
                </div>

                {/* Barra de progreso — siempre visible */}
                <div className="lab-desafio-footer">
                  <div className="lab-desafio-track">
                    <div
                      className={`lab-desafio-fill lab-desafio-fill--${estado}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="lab-desafio-counter">
                    {progreso}/{meta}
                  </span>
                </div>

                {/* Botón reclamar — solo cuando está listo */}
                {estado === "listo" && (
                  <button
                    type="button"
                    className="lab-desafio-reclamar"
                    disabled={reclamando.has(d.id)}
                    onClick={() => handleReclamar(d)}
                  >
                    {reclamando.has(d.id) ? "Reclamando…" : `Reclamar ${d.puntos} pts`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="lab-desafios-stack">
      <div className="ol-panel lab-desafios-resumen-card">
        <div className="lab-desafios-summary">
        <div className="lab-desafios-progress">
          <div className="lab-desafios-progress-head">
            <span className="lab-desafios-progress-label">Progreso de hoy</span>
            <span className="lab-desafios-progress-count">
              {resumen.completados}/{resumen.total}
            </span>
          </div>
          <div className="lab-desafios-progress-track">
            <div
              className="lab-desafios-progress-fill"
              style={{ width: `${resumen.total ? (resumen.completados / resumen.total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="lab-desafios-stats">
          <div className="lab-desafios-stat">
            <span className="lab-desafios-stat-value">{resumen.ptsGanados}</span>
            <span className="lab-desafios-stat-label">Pts ganados</span>
          </div>
          <div className="lab-desafios-stat">
            <span className="lab-desafios-stat-value">{resumen.ptsDisponibles}</span>
            <span className="lab-desafios-stat-label">Por ganar</span>
          </div>
          <div className={`lab-desafios-stat${resumen.porReclamar ? " lab-desafios-stat--alert" : ""}`}>
            <span className="lab-desafios-stat-value">{resumen.porReclamar}</span>
            <span className="lab-desafios-stat-label">Por reclamar</span>
          </div>
        </div>
        </div>
      </div>

      <div className="ol-panel lab-desafios">
        {showTitle && (
          <div className="ol-section-title">
            <span className="ol-accent" />
            <h2>Desafíos</h2>
            <span className="lab-desafios-hint">Completa acciones en el Lab y gana puntos</span>
          </div>
        )}
        <div className="lab-desafios-content">
          {renderGroup(diarios)}
          {renderGroup(semanales)}
        </div>
      </div>
    </div>
  );
}
