import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PL_FACTS } from "./PL_FACTS";

// Overlay con spinner que rota PL facts cada 4.2s mientras corre la inferencia ML.
// Bloquea el scroll del body para evitar que el usuario navegue durante el cómputo.
export default function ComputingModal() {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const iv = setInterval(() => setFactIndex((p) => (p + 1) % PL_FACTS.length), 4200);
    return () => {
      document.body.style.overflow = "";
      clearInterval(iv);
    };
  }, []);

  const fact = PL_FACTS[factIndex];

  return createPortal(
    <div className="ol-overlay">
      <div className="ol-overlay-card" onClick={(e) => e.stopPropagation()}>
        <div className="ol-overlay-header">
          <span className="ol-spinner ol-spinner--sm" />
          <span className="ol-overlay-status">Calculando modelo…</span>
        </div>

        <div className="ol-overlay-fact" key={factIndex}>
          <img
            src={fact.badge}
            alt={fact.club}
            className="ol-overlay-badge"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="ol-overlay-stat-row">
            <span className="ol-overlay-stat">{fact.stat}</span>
            <span className="ol-overlay-unit">{fact.unit}</span>
          </div>
          <p className="ol-overlay-label">{fact.label}</p>
          <p className="ol-overlay-detail">{fact.detail}</p>
        </div>

        <div className="ol-overlay-dots">
          {PL_FACTS.map((_, i) => (
            <span key={i} className={`ol-overlay-dot${i === factIndex ? " ol-overlay-dot--active" : ""}`} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
