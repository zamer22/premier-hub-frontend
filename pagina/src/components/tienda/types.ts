export interface Variante {
  id_variante: number; talla: string; stock: number;
}
// categoria: 'perfil' → va a inventario_producto; 'real' → crea pedido con envío.
export interface Producto {
  id_producto: number; nombre: string; costo: string; tipo: string;
  stock: number; es_nuevo: boolean; equipo: string | null; imagen: string | null;
  temporada_nombre?: string; temporada_fin?: string; categoria?: string;
  descripcion?: string | null; variantes?: Variante[]; rareza?: string | null; css?: string | null; metadata?: Record<string, any> | null;
}
export interface InventarioItem extends Producto {
  id_inventario: number; fecha_compra: string; en_marketplace: boolean;
  talla?: string | null;
}
export interface Listado {
  id_listado: number; id_vendedor: number; precio: string;
  nombre: string; tipo: string; imagen: string | null; equipo: string | null;
  vendedor_nickname: string; fecha_creacion: string;
  css?: string | null; metadata?: Record<string, any> | null;
}
export interface Direccion {
  id_direccion: number;
  id_usuario: number;
  alias: string;
  nombre_destinatario: string;
  telefono: string | null;
  calle: string;
  ciudad: string;
  estado: string | null;
  codigo_postal: string | null;
  pais: string;
  lat: number | null;
  lng: number | null;
  es_predeterminada: boolean;
}
// direccion_snapshot es JSON (no FK) para que siga válido si el usuario borra la dirección.
export interface Pedido {
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
  producto?: { id_producto: number; nombre: string; imagen: string | null; tipo: string; descripcion?: string | null } | null;
  variante?: { id_variante: number; talla: string } | null;
}
export interface Comentario {
  id_comentario: number;
  id_producto: number;
  id_usuario: number;
  calificacion: number;
  comentario: string;
  fecha_creacion: string;
  usuario?: { nickname: string | null; nombre_usuario: string | null } | null;
}
export type NewDireccionForm = {
  alias: string;
  nombre_destinatario: string;
  telefono: string;
  calle: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
  lat: number | null;
  lng: number | null;
  es_predeterminada: boolean;
};
// Discriminated union que decide qué texto y acción muestra ConfirmModal.
export type ConfirmAction =
  | { kind: "buy-product"; producto: Producto; variante: Variante | null }
  | { kind: "buy-listing"; listado: Listado }
  | { kind: "publish"; item: InventarioItem; precio: number };

export type SubTab = "perfil" | "real" | "marketplace" | "pedidos";
export type MarketView = "explorar" | "mis-items";

export interface TiendaUser {
  id_usuario: number; nickname: string; dinero: number; [k: string]: any;
}
