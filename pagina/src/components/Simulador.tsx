import { useState } from "react";
const API_URL: string = "http://localhost:4000";
interface SimResult { resultado: string; probabilidades: { pierde_local: number; empate: number; gana_local: number }; }
interface Simulacion { id_simulacion: number; status: string; resultado: SimResult | null; cambios: any; partido_data: any; }

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

  const original = { goles_local: 2, goles_visitante: 1, faltas_local: 14, faltas_visitante: 12, tarjetas_local: 3, tarjetas_visitante: 2, posesion_local: 52 };

  const handleSimular = async (): Promise<void> => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/simulador/simular`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: 1, partido_data: original,
          cambios: { goles_local: golesLocal, goles_visitante: golesVisit, faltas_local: faltasLocal, faltas_visitante: faltasVisit, tarjetas_local: tarjetasLocal, tarjetas_visitante: tarjetasVisit, posesion_local: posesion },
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      const simId = data.data.id_simulacion;
      const poll = async (): Promise<void> => {
        const check = await fetch(`${API_URL}/api/simulador/simulacion/${simId}`);
        const cd = await check.json();
        if (cd.data.status === "completado") { setResult(cd.data); setLoading(false); }
        else if (cd.data.status === "error") { setError("Error procesando"); setLoading(false); }
        else { setTimeout(poll, 1000); }
      };
      setTimeout(poll, 1000);
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: "65px", padding: "0.4rem", border: "1px solid #ddd", borderRadius: "6px", fontSize: "0.85rem", textAlign: "center" };
  const labelStyle: React.CSSProperties = { fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" };

  const resultLabel = (r: string): string => r === "gana_local" ? "GANA LOCAL" : r === "pierde_local" ? "PIERDE LOCAL" : "EMPATE";
  const resultColor = (r: string): string => r === "gana_local" ? "#16a34a" : r === "pierde_local" ? "#dc2626" : "#f59e0b";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      {/* Input */}
      <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ width: "4px", height: "20px", background: "#E90052", borderRadius: "2px" }} />
          <h2 style={{ color: "#263a55", fontSize: "1.1rem" }}>Simulador ML</h2>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#84878F", marginBottom: "1rem" }}>Arsenal 2-1 Chelsea (Original). Modifica valores:</p>
        <div style={{ display: "grid", gap: "0.2rem" }}>
          <div style={labelStyle}><span>Goles local</span><input type="number" value={golesLocal} onChange={(e) => setGolesLocal(Number(e.target.value))} style={inputStyle} /></div>
          <div style={labelStyle}><span>Goles visitante</span><input type="number" value={golesVisit} onChange={(e) => setGolesVisit(Number(e.target.value))} style={inputStyle} /></div>
          <div style={labelStyle}><span>Faltas local</span><input type="number" value={faltasLocal} onChange={(e) => setFaltasLocal(Number(e.target.value))} style={inputStyle} /></div>
          <div style={labelStyle}><span>Faltas visitante</span><input type="number" value={faltasVisit} onChange={(e) => setFaltasVisit(Number(e.target.value))} style={inputStyle} /></div>
          <div style={labelStyle}><span>Tarjetas local</span><input type="number" value={tarjetasLocal} onChange={(e) => setTarjetasLocal(Number(e.target.value))} style={inputStyle} /></div>
          <div style={labelStyle}><span>Tarjetas visitante</span><input type="number" value={tarjetasVisit} onChange={(e) => setTarjetasVisit(Number(e.target.value))} style={inputStyle} /></div>
          <div style={labelStyle}><span>Posesion local %</span><input type="number" value={posesion} onChange={(e) => setPosesion(Number(e.target.value))} style={inputStyle} /></div>
        </div>
        <button onClick={handleSimular} disabled={loading} style={{
          width: "100%", marginTop: "1rem", padding: "0.6rem", background: "#E90052", color: "#fff", border: "none",
          borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.9rem", fontWeight: 700,
          opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
        }}>{loading ? "Procesando modelo..." : "Simular con TensorFlow.js"}</button>
        {error && <p style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "0.5rem" }}>{error}</p>}
      </div>

      {/* Result */}
      <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ width: "4px", height: "20px", background: "#263a55", borderRadius: "2px" }} />
          <h2 style={{ color: "#263a55", fontSize: "1.1rem" }}>Comparacion</h2>
        </div>

        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "#84878F" }}>
            <p style={{ fontSize: "0.85rem" }}>Modifica los valores y presiona Simular para ver la prediccion</p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "#84878F" }}>
            <div style={{ width: "30px", height: "30px", border: "3px solid #eee", borderTop: "3px solid #E90052", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.85rem" }}>El modelo de ML esta procesando...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {result?.resultado && (
          <div style={{ animation: "slideUp 0.4s ease" }}>
            {/* Prediccion */}
            <div style={{ textAlign: "center", padding: "1rem", background: resultColor(result.resultado.resultado) + "15", borderRadius: "10px", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#84878F", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Prediccion</p>
              <p style={{ fontSize: "1.4rem", fontWeight: 800, color: resultColor(result.resultado.resultado) }}>{resultLabel(result.resultado.resultado)}</p>
            </div>

            {/* Probabilidades */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {[
                { label: "Gana", value: result.resultado.probabilidades.gana_local, color: "#16a34a" },
                { label: "Empate", value: result.resultado.probabilidades.empate, color: "#f59e0b" },
                { label: "Pierde", value: result.resultado.probabilidades.pierde_local, color: "#dc2626" },
              ].map((p) => (
                <div key={p.label} style={{ flex: 1, textAlign: "center", padding: "0.5rem", background: "#f9f9f9", borderRadius: "8px" }}>
                  <p style={{ fontSize: "0.7rem", color: "#84878F" }}>{p.label}</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: p.color }}>{Math.round(p.value * 100)}%</p>
                </div>
              ))}
            </div>

            {/* Antes vs Despues */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0.75rem", alignItems: "start" }}>
              <div style={{ background: "#f9f9f9", borderRadius: "10px", padding: "0.75rem" }}>
                <p style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#84878F", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Original</p>
                <div style={{ fontSize: "0.8rem", lineHeight: "1.6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Goles</span><strong>{original.goles_local} - {original.goles_visitante}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Faltas</span><strong>{original.faltas_local} - {original.faltas_visitante}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tarjetas</span><strong>{original.tarjetas_local} - {original.tarjetas_visitante}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Posesion</span><strong>{original.posesion_local}%</strong></div>
                </div>
                <div style={{ textAlign: "center", marginTop: "0.5rem", padding: "0.3rem", background: "#263a55", borderRadius: "6px", color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>
                  GANA LOCAL 2-1
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", paddingTop: "3rem", color: "#E90052", fontSize: "1.5rem", fontWeight: 800 }}>→</div>

              <div style={{ background: "#f9f9f9", borderRadius: "10px", padding: "0.75rem" }}>
                <p style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#84878F", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Modificado</p>
                <div style={{ fontSize: "0.8rem", lineHeight: "1.6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Goles</span><strong style={{ color: golesLocal !== original.goles_local || golesVisit !== original.goles_visitante ? "#E90052" : "inherit" }}>{golesLocal} - {golesVisit}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Faltas</span><strong style={{ color: faltasLocal !== original.faltas_local ? "#E90052" : "inherit" }}>{faltasLocal} - {faltasVisit}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tarjetas</span><strong style={{ color: tarjetasLocal !== original.tarjetas_local ? "#E90052" : "inherit" }}>{tarjetasLocal} - {tarjetasVisit}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Posesion</span><strong style={{ color: posesion !== original.posesion_local ? "#E90052" : "inherit" }}>{posesion}%</strong></div>
                </div>
                <div style={{ textAlign: "center", marginTop: "0.5rem", padding: "0.3rem", background: resultColor(result.resultado.resultado), borderRadius: "6px", color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>
                  {resultLabel(result.resultado.resultado)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
