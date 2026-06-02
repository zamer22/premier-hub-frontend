import type { AdminPedido } from "./types";
import { ESTADO_LABEL } from "./constants";

type Props = {
  pedidos: AdminPedido[];
  selectedId: number | null;
  onSelect: (p: AdminPedido) => void;
  loading: boolean;
};

export default function OrderList({ pedidos, selectedId, onSelect, loading }: Props) {
  return (
    <div className="adm-list">
      {loading && pedidos.length === 0 && <p className="adm-list__loading">Cargando...</p>}
      {!loading && pedidos.length === 0 && (
        <p className="adm-list__empty">Sin pedidos para los filtros aplicados</p>
      )}

      {pedidos.map((p) => {
        const isSel = selectedId === p.id_pedido;
        return (
          <div
            key={p.id_pedido}
            onClick={() => onSelect(p)}
            className={`adm-order${isSel ? " adm-order--sel" : ""}`}
          >
            <div className="adm-order__top">
              <span className="adm-order__id">#{p.id_pedido}</span>
              <span className="adm-order__status" data-estado={p.estado}>
                {ESTADO_LABEL[p.estado]}
              </span>
            </div>
            <p className="adm-order__name">{p.producto?.nombre || `Producto #${p.id_producto}`}</p>
            <p className="adm-order__user">
              {p.usuario?.nickname || p.usuario?.correo || `User #${p.id_usuario}`}
              {p.variante ? ` · talla ${p.variante.talla}` : ""}
            </p>
            <p className="adm-order__date">{new Date(p.fecha_pedido).toLocaleString("es-MX")}</p>
          </div>
        );
      })}
    </div>
  );
}
