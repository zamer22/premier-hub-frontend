// Pedido enriquecido que devuelve /api/admin — incluye joins a producto, variante y usuario.
export interface AdminPedido {
  id_pedido: number;
  id_usuario: number;
  id_producto: number;
  id_variante: number | null;
  costo: string;
  direccion_snapshot: any;
  lat_destino: number | null;
  lng_destino: number | null;
  lat_actual: number | null;
  lng_actual: number | null;
  tracking_numero: string | null;
  fecha_estimada: string | null;
  notas_admin: string | null;
  estado: "procesando" | "enviado" | "en_camino" | "entregado" | "cancelado";
  fecha_pedido: string;
  fecha_entrega: string | null;
  producto?: { id_producto: number; nombre: string; imagen: string | null; tipo: string } | null;
  variante?: { id_variante: number; talla: string } | null;
  usuario?: { id_usuario: number; nickname: string | null; nombre_usuario: string | null; correo: string | null } | null;
}

export interface AdminEnviosProps {
  user: { id_usuario: number; nickname: string; es_admin?: boolean; [k: string]: any };
  onLogout: () => void;
}

// Producto del catálogo base (admin view). categoria 'perfil' va a inventario; 'real' crea pedidos.
export interface AdminProduct {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  costo: number;
  stock: number;
  imagen: string | null;
  es_nuevo: boolean;
  categoria: "perfil" | "real" | string;
  tipo: string | null;
  equipo: string | null;
  rareza: string | null;
  id_temporada: number | null;
  css: string | null;
  es_de_liga: boolean;
}

// Listado del marketplace. fecha_creacion suele venir poblada; created_at es legacy.
export interface AdminListado {
  id_listado: number;
  id_vendedor: number;
  id_inventario: number | null;
  precio: number;
  estado: "activo" | "vendido" | "cancelado";
  created_at?: string;
  fecha_creacion?: string;
  fecha_venta?: string | null;
  id_comprador?: number | null;
  nombre?: string | null;
  imagen?: string | null;
  css?: string | null;
  tipo?: string | null;
  rareza?: string | null;
  categoria?: string | null;
  equipo?: string | null;
  vendedor_nickname?: string | null;
}

export type ListadoEstadoFilter = "todos" | "activo" | "vendido" | "cancelado";
export type ProductCategoriaFilter = "todos" | "perfil" | "real";

export type NewProductForm = {
  nombre: string;
  descripcion: string;
  costo: string;
  stock: string;
  imagen: string;
  es_nuevo: boolean;
  es_de_liga: boolean;
  categoria: "perfil" | "real";
  tipo: string;
  equipo: string;
  rareza: string;
  id_temporada: string;
};
