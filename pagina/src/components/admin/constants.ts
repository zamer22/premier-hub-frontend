import type { AdminPedido, NewProductForm } from "./types";

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

// Estados de un listado en marketplace (distinto del flujo de pedido).
export const LISTADO_ESTADO_LABEL: Record<string, string> = {
  activo: "Activo", vendido: "Vendido", cancelado: "Cancelado",
};

// Tipos seleccionables al crear un objeto desde el panel admin.
export const NEW_PRODUCT_TIPOS = [
  "marco", "titulo", "banner", "trofeo", "achievement",
  "foto_perfil", "jersey", "balonazo", "ropa", "accesorio",
];

export const EMPTY_NEW_PRODUCT: NewProductForm = {
  nombre: "",
  descripcion: "",
  costo: "",
  stock: "0",
  imagen: "",
  es_nuevo: true,
  es_de_liga: false,
  categoria: "perfil",
  tipo: "",
  equipo: "",
  rareza: "",
  id_temporada: "",
};
