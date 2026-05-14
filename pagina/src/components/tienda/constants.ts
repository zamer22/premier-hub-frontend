import type { NewDireccionForm } from "./types";

// Vite bakea VITE_API_URL en build. En dev apunta a localhost:4001.
export const API_URL = import.meta.env.VITE_API_URL;
export const DEFAULT_MAP_CENTER: [number, number] = [19.4326, -99.1332];

export const EMPTY_DIRECCION: NewDireccionForm = {
  alias: "", nombre_destinatario: "", telefono: "", calle: "", ciudad: "",
  estado: "", codigo_postal: "", pais: "MX", lat: null, lng: null, es_predeterminada: false,
};

export const ESTADO_PEDIDO_LABEL: Record<string, string> = {
  procesando: "Procesando", enviado: "Enviado", en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado",
};
export const ESTADO_PEDIDO_COLOR: Record<string, { bg: string; fg: string }> = {
  procesando: { bg: "#fef3c7", fg: "#92400e" },
  enviado:    { bg: "#dbeafe", fg: "#1e40af" },
  en_camino:  { bg: "#e0e7ff", fg: "#4338ca" },
  entregado:  { bg: "#dcfce7", fg: "#16a34a" },
  cancelado:  { bg: "#fee2e2", fg: "#dc2626" },
};
// Orden del timeline en PedidoModal — cancelado no aparece en la barra de progreso.
export const ESTADO_FLOW = ["procesando", "enviado", "en_camino", "entregado"] as const;

export const TIPOS_REAL = ["todos", "jersey", "balonazo", "ropa", "accesorio"];
