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
