const TIPO_LABELS: Record<string, string> = {
  balonazo: "Balón",
  foto_perfil: "Foto de perfil",
  achievement: "Logro",
  jersey: "Jersey",
  ropa: "Ropa",
  accesorio: "Accesorio",
  marco: "Marco",
  titulo: "Título",
  banner: "Banner",
  trofeo: "Trofeo",
};

export function tipoLabel(tipo?: string | null) {
  if (!tipo) return "Sin tipo";
  return TIPO_LABELS[tipo] || tipo;
}

export function categoriaLabel(categoria?: string | null) {
  if (categoria === "real") return "Objeto real";
  if (categoria === "perfil") return "Perfil";
  return "Sin categoría";
}

export function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// TypeError dentro de fetch suele significar que el backend está caído o el CORS rechazó.
export function getErrorMessage(error: unknown) {
  if (error instanceof TypeError) return "No se pudo conectar con el backend";
  if (error instanceof Error) return error.message;
  return "Error de conexión";
}
