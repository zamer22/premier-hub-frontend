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
      <div style={{ padding: "0.75rem 1rem" }}>
        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#263a55", marginBottom: "0.15rem" }}>{l.nombre}</p>
        <p style={{ fontSize: "0.7rem", color: "#84878F", marginBottom: "0.4rem" }}>
          Vendedor: {l.vendedor_nickname}{l.equipo ? ` · ${l.equipo}` : ""}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#263a55" }}>{l.precio} pts</span>
          <button
            onClick={onBuy}
            disabled={!canBuy}
            style={{
              padding: "0.35rem 0.75rem", border: "none", borderRadius: "6px",
              background: canBuy ? "#E90052" : "#ddd",
              color: canBuy ? "#fff" : "#999",
              cursor: canBuy ? "pointer" : "not-allowed",
              fontSize: "0.8rem", fontWeight: 600,
            }}
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
