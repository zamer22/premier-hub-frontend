import { type ReactNode, useState } from "react";
import "./Simulador.css";

const API_URL = import.meta.env.VITE_API_URL;

interface SimResult {
  resultado: string;
  probabilidades: { pierde_local: number; empate: number; gana_local: number };
}

interface Simulacion {
  id_simulacion: number;
  status: string;
  resultado: SimResult | null;
  cambios: unknown;
  partido_data: unknown;
}

const original = {
  goles_local: 2,
  goles_visitante: 1,
  faltas_local: 14,
  faltas_visitante: 12,
  tarjetas_local: 3,
  tarjetas_visitante: 2,
  posesion_local: 52,
};

function resultLabel(result: string): string {
  if (result === "gana_local") return "Gana local";
  if (result === "pierde_local") return "Pierde local";
  return "Empate";
}

function resultTone(result: string): string {
  if (result === "gana_local") return "sim-tone--win";
  if (result === "pierde_local") return "sim-tone--loss";
  return "sim-tone--draw";
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="sim-field">
      <span>{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="sim-input" />
    </label>
  );
}

function StatLine({
  label,
  children,
  changed,
}: {
  label: string;
  children: ReactNode;
  changed?: boolean;
}) {
  return (
    <div className="sim-stat-line">
      <span>{label}</span>
      <strong className={changed ? "sim-changed" : ""}>{children}</strong>
    </div>
  );
}

export default function Simulador() {
  const [golesLocal, setGolesLocal] = useState(2);
  const [golesVisit, setGolesVisit] = useState(1);
  const [faltasLocal, setFaltasLocal] = useState(12);
  const [faltasVisit, setFaltasVisit] = useState(10);
  const [tarjetasLocal, setTarjetasLocal] = useState(2);
  const [tarjetasVisit, setTarjetasVisit] = useState(1);
  const [posesion, setPosesion] = useState(55);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Simulacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimular = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/simulador/simular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: 1,
          partido_data: original,
          cambios: {
            goles_local: golesLocal,
            goles_visitante: golesVisit,
            faltas_local: faltasLocal,
            faltas_visitante: faltasVisit,
            tarjetas_local: tarjetasLocal,
            tarjetas_visitante: tarjetasVisit,
            posesion_local: posesion,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        setLoading(false);
        return;
      }
      const simId = data.data.id_simulacion;
      const poll = async (): Promise<void> => {
        const check = await fetch(`${API_URL}/api/simulador/simulacion/${simId}`);
        const cd = await check.json();
        if (cd.data.status === "completado") {
          setResult(cd.data);
          setLoading(false);
        } else if (cd.data.status === "error") {
          setError("Error procesando");
          setLoading(false);
        } else {
          setTimeout(poll, 1000);
        }
      };
      setTimeout(poll, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  };

  const probabilities = result?.resultado
    ? [
        { key: "win", label: "Gana", value: result.resultado.probabilidades.gana_local },
        { key: "draw", label: "Empate", value: result.resultado.probabilidades.empate },
        { key: "loss", label: "Pierde", value: result.resultado.probabilidades.pierde_local },
      ]
    : [];

  return (
    <div className="sim-grid">
      <section className="sim-panel">
        <div className="sim-section-title">
          <span className="sim-accent" />
          <h2>Simulador ML</h2>
        </div>
        <p className="sim-copy">Arsenal 2-1 Chelsea. Modifica valores y compara escenarios.</p>

        <div className="sim-fields">
          <Field label="Goles local" value={golesLocal} onChange={setGolesLocal} />
          <Field label="Goles visitante" value={golesVisit} onChange={setGolesVisit} />
          <Field label="Faltas local" value={faltasLocal} onChange={setFaltasLocal} />
          <Field label="Faltas visitante" value={faltasVisit} onChange={setFaltasVisit} />
          <Field label="Tarjetas local" value={tarjetasLocal} onChange={setTarjetasLocal} />
          <Field label="Tarjetas visitante" value={tarjetasVisit} onChange={setTarjetasVisit} />
          <Field label="Posesión local %" value={posesion} onChange={setPosesion} />
        </div>

        <button type="button" onClick={handleSimular} disabled={loading} className="sim-primary">
          {loading ? "Procesando modelo..." : "Simular con TensorFlow.js"}
        </button>
        {error ? <p className="sim-error">{error}</p> : null}
      </section>

      <section className="sim-panel">
        <div className="sim-section-title sim-section-title--navy">
          <span className="sim-accent" />
          <h2>Comparación</h2>
        </div>

        {!result && !loading ? (
          <div className="sim-empty">
            <p>Modifica los valores y presiona Simular para ver la predicción.</p>
          </div>
        ) : null}

        {loading ? (
          <div className="sim-loading">
            <span className="sim-spinner" />
            <p>El modelo de ML está procesando...</p>
          </div>
        ) : null}

        {result?.resultado ? (
          <div className="sim-result">
            <div className={`sim-prediction ${resultTone(result.resultado.resultado)}`}>
              <p>Predicción</p>
              <strong>{resultLabel(result.resultado.resultado)}</strong>
            </div>

            <div className="sim-prob-grid">
              {probabilities.map((probability) => (
                <div key={probability.key} className={`sim-prob-card sim-prob-card--${probability.key}`}>
                  <p>{probability.label}</p>
                  <strong>{Math.round(probability.value * 100)}%</strong>
                </div>
              ))}
            </div>

            <div className="sim-compare-grid">
              <div className="sim-compare-card">
                <p className="sim-card-label">Original</p>
                <div className="sim-stat-list">
                  <StatLine label="Goles">{original.goles_local} - {original.goles_visitante}</StatLine>
                  <StatLine label="Faltas">{original.faltas_local} - {original.faltas_visitante}</StatLine>
                  <StatLine label="Tarjetas">{original.tarjetas_local} - {original.tarjetas_visitante}</StatLine>
                  <StatLine label="Posesión">{original.posesion_local}%</StatLine>
                </div>
                <div className="sim-outcome sim-outcome--base">Gana local 2-1</div>
              </div>

              <div className="sim-arrow">→</div>

              <div className="sim-compare-card">
                <p className="sim-card-label">Modificado</p>
                <div className="sim-stat-list">
                  <StatLine label="Goles" changed={golesLocal !== original.goles_local || golesVisit !== original.goles_visitante}>
                    {golesLocal} - {golesVisit}
                  </StatLine>
                  <StatLine label="Faltas" changed={faltasLocal !== original.faltas_local || faltasVisit !== original.faltas_visitante}>
                    {faltasLocal} - {faltasVisit}
                  </StatLine>
                  <StatLine label="Tarjetas" changed={tarjetasLocal !== original.tarjetas_local || tarjetasVisit !== original.tarjetas_visitante}>
                    {tarjetasLocal} - {tarjetasVisit}
                  </StatLine>
                  <StatLine label="Posesión" changed={posesion !== original.posesion_local}>
                    {posesion}%
                  </StatLine>
                </div>
                <div className={`sim-outcome ${resultTone(result.resultado.resultado)}`}>
                  {resultLabel(result.resultado.resultado)}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
