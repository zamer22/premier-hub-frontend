import type { CSSProperties } from "react";
import type { AdminPedido } from "./types";

export const ESTADOS: AdminPedido["estado"][] = ["procesando", "enviado", "en_camino", "entregado", "cancelado"];

export const ESTADO_LABEL: Record<string, string> = {
  procesando: "Procesando", enviado: "Enviado", en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado",
};

export const ESTADO_COLOR: Record<string, { bg: string; fg: string }> = {
  procesando: { bg: "#fef3c7", fg: "#92400e" },
  enviado:    { bg: "#dbeafe", fg: "#1e40af" },
  en_camino:  { bg: "#e0e7ff", fg: "#4338ca" },
  entregado:  { bg: "#dcfce7", fg: "#16a34a" },
  cancelado:  { bg: "#fee2e2", fg: "#dc2626" },
};

export const inputBase: CSSProperties = {
  padding: "0.55rem 0.7rem", border: "1.5px solid #e0e0e0", borderRadius: "8px",
  fontSize: "0.85rem", outline: "none", width: "100%", boxSizing: "border-box",
  color: "#263a55", background: "#fff",
};
