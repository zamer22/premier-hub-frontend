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
      <div style={{ padding: "0.75rem 1rem" }}>
        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#263a55", marginBottom: "0.2rem", lineHeight: "1.3" }}>{p.nombre}</p>
        <p style={{ fontSize: "0.75rem", color: "#84878F", marginBottom: "0.5rem" }}>
          {tipoLabel(p.tipo)}{p.equipo ? ` · ${p.equipo}` : ""}
          {stockTotal === 0
            ? <span style={{ marginLeft: "0.4rem", background: "#fee2e2", color: "#dc2626", fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "4px" }}>Sin stock</span>
            : <span style={{ marginLeft: "0.4rem", color: "#84878F" }}>· {stockTotal} disp.</span>
          }
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#263a55" }}>{p.costo} pts</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (tieneVariantes) onOpenModal(p);
              else if (p.categoria === "real") onCheckout(p, null);
              else onConfirm({ kind: "buy-product", producto: p, variante: null });
            }}
            disabled={!canBuy}
            style={{
              padding: "0.35rem 0.75rem", border: "none", borderRadius: "6px",
              background: canBuy ? "#E90052" : "#ddd",
              color: canBuy ? "#fff" : "#999",
              cursor: canBuy ? "pointer" : "not-allowed",
              fontSize: "0.8rem", fontWeight: 600, transition: "background 0.2s",
            }}
          >
            {tieneVariantes ? "Ver tallas" : "Comprar"}
          </button>
        </div>
      </div>
    </div>
  );
}
