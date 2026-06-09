import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ClubPlayer } from "../../hooks/useClubPlayers";
import { clubInitials, posAbbr, playerPhotoUrl } from "./utils";

type Props = {
  players: ClubPlayer[];
  loading: boolean;
  selectedId: number | "";
  onSelect: (id: number) => void;
  disabled?: boolean;
  // Ids ya usados (ej. fichajes encadenados en SeasonSimulator) — se muestran inhabilitados.
  disabledIds?: Set<number>;
  placeholder?: string;
  title?: string;
};

// Avatar con foto del jugador; si la imagen falla, queda visible el fallback de iniciales.
function PlayerAvatar({ player, sm }: { player: ClubPlayer; sm?: boolean }) {
  return (
    <span className={`ol-picker-avatar${sm ? " ol-picker-avatar--sm" : ""}`}>
      <span className="ol-picker-avatar-fallback">{clubInitials(player.name)}</span>
      <img
        src={playerPhotoUrl(player.id)}
        alt=""
        className="ol-picker-avatar-img"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </span>
  );
}

/*
Selector de jugador como tarjeta desplegable: botón compacto con la foto + nombre
del jugador elegido y un modal centrado con las fotos de todo el squad. Reemplaza
al <select> nativo para usar las fotos de los jugadores igual que los escudos.
*/
export default function PlayerPicker({
  players,
  loading,
  selectedId,
  onSelect,
  disabled,
  disabledIds,
  placeholder = "Seleccionar jugador",
  title = "Elige un jugador",
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = players.find((p) => p.id === selectedId);

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
        disabled={disabled || loading}
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <>
            <PlayerAvatar player={selected} sm />
            <span className="ol-picker-trigger-label">{selected.name}</span>
            <span className="ol-picker-trigger-tag">{posAbbr(selected.position)}</span>
          </>
        ) : (
          <span className="ol-picker-trigger-placeholder">
            {loading ? "Cargando..." : placeholder}
          </span>
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
              {loading && <p className="ol-picker-empty">Cargando jugadores...</p>}
              {!loading && players.length === 0 && <p className="ol-picker-empty">No hay jugadores disponibles.</p>}
              {!loading && players.map((p) => {
                const used = disabledIds?.has(p.id) ?? false;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={used}
                    className={`ol-picker-card ol-picker-card--player${selectedId === p.id ? " ol-picker-card--active" : ""}`}
                    onClick={() => choose(p.id)}
                  >
                    <PlayerAvatar player={p} />
                    <span className="ol-picker-card-name">{p.name}</span>
                    <span className="ol-picker-card-pos">
                      {posAbbr(p.position)}{used ? " · ya agregado" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
