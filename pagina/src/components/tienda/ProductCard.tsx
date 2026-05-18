import type { Producto, Variante, ConfirmAction } from "./types";
import { tipoLabel } from "./utils";
import ProductVisual from "./ProductVisual";
import "../../estilos/Tienda.css";

interface ProductCardProps {
  p: Producto;
  saldo: number;
  badge?: string;
  onOpenModal: (p: Producto) => void;
  onConfirm: (action: ConfirmAction) => void;
  onCheckout: (p: Producto, v: Variante | null) => void;
}

export default function ProductCard({ p, saldo, badge, onOpenModal, onConfirm, onCheckout }: ProductCardProps) {
  const tieneVariantes = !!p.variantes && p.variantes.length > 0;
  const stockTotal = tieneVariantes
    ? (p.variantes ?? []).reduce((sum, v) => sum + v.stock, 0)
    : (p.stock ?? 0);
  const canBuy = stockTotal > 0 && Number(p.costo) <= saldo;

  return (
    <div className="t-card" onClick={() => onOpenModal(p)}>
      {p.es_nuevo && <span className="t-badge t-badge--nuevo">NUEVO</span>}
      {badge && <span className="t-badge t-badge--real">{badge}</span>}
      <ProductVisual p={p} height={140} />
      <div className="t-card-body">
        <p className="t-card-name">{p.nombre}</p>
        <p className="t-card-meta">
          {tipoLabel(p.tipo)}{p.equipo ? ` · ${p.equipo}` : ""}
          {stockTotal === 0
            ? <span className="t-badge-nostock">Sin stock</span>
            : <span className="t-card-stock">· {stockTotal} disp.</span>
          }
        </p>
        <div className="t-card-footer">
          <span className="t-card-price">{p.costo} pts</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (tieneVariantes) onOpenModal(p);
              else if (p.categoria === "real") onCheckout(p, null);
              else onConfirm({ kind: "buy-product", producto: p, variante: null });
            }}
            disabled={!canBuy}
            className="t-card-btn t-card-btn--buy"
          >
            {tieneVariantes ? "Ver tallas" : "Comprar"}
          </button>
        </div>
      </div>
    </div>
  );
}
