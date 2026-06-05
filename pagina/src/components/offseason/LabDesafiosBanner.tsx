import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

// Forma mínima — solo lo que la mini-card necesita para contar desafíos listos.
type DesafioLite = {
  puntos: number;
  condicion: { cantidad: number };
  usuario_progreso: number;
  usuario_completado: boolean;
};

type Props = {
  onOpen: () => void;
  refreshKey?: number;
};

/**
 * Mini-card de entrada a la pantalla de Desafíos. Vive arriba a la derecha,
 * en el slot `actions` del encabezado del home del Laboratorio. Hace un fetch
 * ligero solo para mostrar cuántos desafíos están listos para reclamar.
 */
export default function LabDesafiosBanner({ onOpen, refreshKey = 0 }: Props) {
  const [total, setTotal]   = useState<number | null>(null);
  const [listos, setListos] = useState(0);

  useEffect(() => {
    let vivo = true;
    fetch(`${API_URL}/api/lab/desafios`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!vivo || !data.success) return;
        const items: DesafioLite[] = data.data ?? [];
        setTotal(items.length);
        setListos(
          items.filter(
            (d) => !d.usuario_completado && d.usuario_progreso >= d.condicion.cantidad
          ).length
        );
      })
      .catch(() => { if (vivo) setTotal(0); });
    return () => { vivo = false; };
  }, [refreshKey]);

  return (
    <button type="button" className="lab-mini" onClick={onOpen}>
      <span className="lab-mini-accent" aria-hidden="true" />
      <span className="lab-mini-title">Desafíos</span>
      {listos > 0 ? (
        <span className="lab-mini-badge">{listos} {listos === 1 ? "listo" : "listos"}</span>
      ) : (
        <span className="lab-mini-sub">{total === 0 ? "Sin desafíos" : "Ver todos"}</span>
      )}
      <span className="lab-mini-arrow" aria-hidden="true">→</span>
    </button>
  );
}
