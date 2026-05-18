import type { Producto, Listado } from "./types";

export function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    jersey: "Jersey", balonazo: "Balón", ropa: "Ropa", accesorio: "Accesorio",
    banner: "Banner", marco: "Marco", titulo: "Titulo", trofeo: "Trofeo",
    achievement: "Achievement", foto_perfil: "Postcard",
  };
  return map[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, " ");
}

export function productBackground(p: Producto | Listado): string {
  const metadata = p.metadata || {};
  const cssBackground = p.css || metadata.background || metadata.css_background;
  if (cssBackground) return String(cssBackground);
  if (p.imagen) return `#c8dff5 url(${p.imagen}) center/contain no-repeat`;
  if (p.tipo === "marco") return "linear-gradient(135deg, #263a55, #871d54)";
  return "#c8dff5";
}
