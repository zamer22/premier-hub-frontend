// Helpers compartidos entre TransferPredictor / SeasonSimulator / MatchRewind.

// Foto del jugador (API-Football media CDN). Si el id no tiene foto, la imagen
// falla y los pickers muestran el fallback con iniciales.
export const playerPhotoUrl = (id: number) =>
  `https://media.api-sports.io/football/players/${id}.png`;

// Iniciales del club para el badge cuando no hay crest cargado.
export function clubInitials(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// Hue deterministico (hash djb2 mod 360) — mismo club siempre el mismo color.
export function clubHue(name: string) {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) & 0xfffffff;
  return h % 360;
}

// Abreviación de posición en español (3 letras) — usado en pills y tags.
export function posAbbr(pos: string) {
  const p = pos.toLowerCase();
  if (p.includes("goal"))     return "POR";
  if (p.includes("defend"))   return "DEF";
  if (p.includes("midfield")) return "MED";
  return "DEL";
}

// Background pastel según posición — usado en SeasonSimulator transfer rows.
export function posBg(pos: string) {
  const p = pos.toLowerCase();
  if (p.includes("goal"))     return "#e0f2fe";
  if (p.includes("defend"))   return "#dcfce7";
  if (p.includes("midfield")) return "#fef9c3";
  return "#fce7f3";
}

export function posColor(pos: string) {
  const p = pos.toLowerCase();
  if (p.includes("goal"))     return "#0369a1";
  if (p.includes("defend"))   return "#15803d";
  if (p.includes("midfield")) return "#854d0e";
  return "#9d174d";
}

// ── Transfer Predictor specific ─────────────────────────────────────────────

export function fitLabel(s: string) {
  if (s === "High")   return "Alto";
  if (s === "Medium") return "Medio";
  return "Bajo";
}

export function fitClass(s: string) {
  if (s === "High")   return "ol-fit--high";
  if (s === "Medium") return "ol-fit--medium";
  return "ol-fit--low";
}

// Color del gauge según probabilidad — usa CSS variables del tema.
export function gaugeColor(p: number) {
  if (p >= 65) return "var(--ph-green-600)";
  if (p >= 40) return "var(--ph-amber-500)";
  return "var(--ph-danger-600)";
}
