import type { Producto, Listado } from "./types";
import { productBackground, tipoLabel } from "./utils";

interface ProductVisualProps {
  p: Producto | Listado;
  height?: number;
}

export default function ProductVisual({ p, height = 140 }: ProductVisualProps) {
  const isTextItem = ["titulo", "achievement"].includes(p.tipo);
  const isPostcard = p.tipo === "foto_perfil";
  return (
    <div style={{
      height,
      background: productBackground(p),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0.85rem",
      boxSizing: "border-box",
    }}>
      {isTextItem && (
        <span style={{ color: "#263a55", fontSize: "1.05rem", fontWeight: 900, textAlign: "center", lineHeight: 1.2 }}>
          {p.nombre}
        </span>
      )}
      {isPostcard && !p.imagen && (
        <span style={{ color: "#9aa3af", fontSize: "0.82rem", fontWeight: 900, textAlign: "center", textTransform: "uppercase" }}>
          Sin imagen
        </span>
      )}
      {!p.imagen && !isTextItem && !isPostcard && p.tipo !== "marco" && (
        <span style={{ color: "#9aa3af", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {tipoLabel(p.tipo)}
        </span>
      )}
    </div>
  );
}
