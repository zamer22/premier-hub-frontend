import type { Listado } from "./types";
import ProductVisual from "./ProductVisual";
import "../../estilos/Tienda.css";

interface ListingCardProps {
  l: Listado;
  saldo: number;
  onBuy: () => void;
}

export default function ListingCard({ l, saldo, onBuy }: ListingCardProps) {
  const canBuy = Number(l.precio) <= saldo;
  return (
    <div className="t-card">
      <ProductVisual p={l} height={120} />
      <div className="t-card-body">
        <p className="t-card-name">{l.nombre}</p>
        <p className="t-card-meta--sm">
          Vendedor: {l.vendedor_nickname}{l.equipo ? ` · ${l.equipo}` : ""}
        </p>
        <div className="t-card-footer">
          <span className="t-card-price">{l.precio} pts</span>
          <button onClick={onBuy} disabled={!canBuy} className="t-card-btn t-card-btn--buy">
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
