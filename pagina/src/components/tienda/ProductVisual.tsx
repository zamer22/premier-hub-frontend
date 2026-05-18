import type { Producto, Listado } from "./types";
import { productBackground, tipoLabel } from "./utils";
import "../../estilos/Tienda.css";

interface ProductVisualProps {
  p: Producto | Listado;
  height?: number;
}

export default function ProductVisual({ p, height = 140 }: ProductVisualProps) {
  const isTextItem = ["titulo", "achievement"].includes(p.tipo);
  const isPostcard = p.tipo === "foto_perfil";
  return (
    <div className="t-visual" style={{ height, background: productBackground(p) }}>
      {isTextItem && <span className="t-visual__text">{p.nombre}</span>}
      {isPostcard && !p.imagen && <span className="t-visual__noimg">Sin imagen</span>}
      {!p.imagen && !isTextItem && !isPostcard && p.tipo !== "marco" && (
        <span className="t-visual__label">{tipoLabel(p.tipo)}</span>
      )}
    </div>
  );
}
