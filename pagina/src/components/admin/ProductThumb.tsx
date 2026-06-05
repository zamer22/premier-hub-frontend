import { tipoLabel } from "./utils";

type ThumbItem = { imagen?: string | null; css?: string | null; tipo?: string | null };

// Fallback visual cuando no hay imagen ni CSS: gradiente según tipo.
function fallbackBackground(tipo?: string | null) {
  if (tipo === "banner") return "linear-gradient(135deg, #263a55, #E90052)";
  if (tipo === "marco")  return "linear-gradient(135deg, #E90052, #f59e0b)";
  return "linear-gradient(135deg, #263a55, #871d54)";
}

export default function ProductThumb({ item }: { item: ThumbItem }) {
  return (
    <div
      className="adm-store-thumb"
      style={{
        background: item.imagen
          ? `#f0f2f5 url(${item.imagen}) center/cover no-repeat`
          : item.css || fallbackBackground(item.tipo),
      }}
    >
      {!item.imagen && !item.css && (
        <span>{tipoLabel(item.tipo).slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}
