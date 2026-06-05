import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type InstructivoPaso = {
  titulo: string;
  detalle: string;
};

type Props = {
  titulo: string;
  intro?: string;
  pasos: InstructivoPaso[];
};

/*
Botón "¿Cómo funciona?" + modal instructivo. Explica la dinámica del módulo en
pasos numerados, a ojos de un usuario promedio. Mismo patrón de overlay/portal
que ComputingModal para mantener consistencia.
*/
export default function InstructivoModal({ titulo, intro, pasos }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" className="ol-help-btn" onClick={() => setOpen(true)}>
        <span className="ol-help-btn-icon" aria-hidden>?</span>
        ¿Cómo funciona?
      </button>

      {open && createPortal(
        <div className="ol-picker-overlay" onClick={() => setOpen(false)}>
          <div className="ol-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ol-help-head">
              <h3 className="ol-help-title">{titulo}</h3>
              <button type="button" className="ol-picker-close" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
            </div>
            {intro && <p className="ol-help-intro">{intro}</p>}
            <ol className="ol-help-steps">
              {pasos.map((paso, i) => (
                <li key={i} className="ol-help-step">
                  <span className="ol-help-step-num">{i + 1}</span>
                  <div className="ol-help-step-body">
                    <p className="ol-help-step-title">{paso.titulo}</p>
                    <p className="ol-help-step-text">{paso.detalle}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
