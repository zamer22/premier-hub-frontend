import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PLClub } from "./types";
import { crestUrl } from "./ClubGrid";

type Props = {
  clubs: PLClub[];
  selectedId: number | "";
  onSelect: (id: number) => void;
  disabled?: boolean;
  placeholder?: string;
  // Título del modal centrado (ej. "Club del jugador" / "Club destino").
  title?: string;
};

/*
Selector de club como tarjeta desplegable: un botón compacto muestra el club
elegido (escudo + nombre) y, al pulsarlo, abre un modal centrado sobre toda la
pantalla con la grilla de escudos. Reemplaza al ClubGrid inline para que el
formulario no se vea amontonado.
*/
export default function ClubPicker({
  clubs,
  selectedId,
  onSelect,
  disabled,
  placeholder = "Seleccionar equipo",
  title = "Elige un equipo",
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = clubs.find((c) => c.id === selectedId);

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

  const choose = (id: number) => { onSelect(id); setOpen(false); };

  return (
    <>
      <button
        type="button"
        className={`ol-picker-trigger${selected ? " ol-picker-trigger--filled" : ""}`}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <>
            <img src={crestUrl(selected.id)} alt="" className="ol-picker-trigger-crest" loading="lazy" />
            <span className="ol-picker-trigger-label">{selected.name}</span>
          </>
        ) : (
          <span className="ol-picker-trigger-placeholder">{placeholder}</span>
        )}
        <span className="ol-picker-trigger-chevron" aria-hidden>▾</span>
      </button>

      {open && createPortal(
        <div className="ol-picker-overlay" onClick={() => setOpen(false)}>
          <div className="ol-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ol-picker-head">
              <h3 className="ol-picker-title">{title}</h3>
              <button type="button" className="ol-picker-close" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
            </div>
            <div className="ol-picker-grid">
              {clubs.length === 0 && <p className="ol-picker-empty">Cargando clubes…</p>}
              {clubs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`ol-picker-card${selectedId === c.id ? " ol-picker-card--active" : ""}`}
                  onClick={() => choose(c.id)}
                >
                  <img src={crestUrl(c.id)} alt="" className="ol-picker-card-crest" loading="lazy" />
                  <span className="ol-picker-card-name">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
