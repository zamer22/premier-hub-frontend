const API_URL = import.meta.env.VITE_API_URL;
export const DEFAULT_FILTER = "Todos los equipos";
export const PREMIER_TEAM_OPTIONS = [
  "Arsenal",
  "Aston Villa",
  "Bournemouth",
  "Brentford",
  "Brighton",
  "Chelsea",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Ipswich",
  "Leicester",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle",
  "Nottingham Forest",
  "Southampton",
  "Tottenham",
  "West Ham",
  "Wolverhampton Wanderers",
] as const;


// Respuesta del API sin normalizar
export interface ApiNewsItem {
  id?: number | null;
  title?: string | null;
  headline?: string | null;
  summary?: string | null;
  content?: string | null;
  source?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  readTime?: number | null;
  url?: string | null;
  teams?: string[] | null;
  primaryTeam?: string | null;
}


// Formato de noticia normalizado (el que se muestra en la app)
export interface NewsItem {
  id: number;
  title: string;
  headline: string;
  summary: string;
  content: string;
  source: string;
  image: string | null;
  publishedAt: string;
  readTime: number;
  url: string | null;
  teams: string[];
  primaryTeam: string | null;
}


export interface NewsApiResponse {
  success?: boolean;
  data?: ApiNewsItem[];
  error?: string;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

type NewsCacheSnapshot = {
  news: NewsItem[];
  error: string | null;
  hasMore: boolean;
  page: number;
  search: string;
  teamFilter: string;
  cachedAt: number;
};

export type FetchNewsParams = {
  offset?: number;
  page?: number;
  limit?: number;
  team?: string | null;
  search?: string | null;
};

export type FetchNewsResult = {
  news: NewsItem[];
  error: string | null;
  hasMore: boolean;
  page: number;
  limit: number;
};

const PREVIEW_MAX_LENGTH = 220;
const PREVIEW_MIN_LENGTH = 120;
const DUPLICATE_LEAD_WORDS = 6;
const FRONTEND_NEWS_CACHE_KEY = "premierhub_news_cache_v1";
const FRONTEND_NEWS_CACHE_TTL_MS = 1000 * 60 * 15;
let memoryNewsCache: NewsCacheSnapshot | null = null;

const INLINE_NOISE_PATTERNS = [
  /\b[A-ZÁÉÍÓÚÜÑ.'\s]+Actualizado\s+\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}:\d{2}[A-Z]+\b/giu,
  /\b[A-ZÁÉÍÓÚÜÑ ]+\d{1,2}[A-ZÁÉÍÓÚÜÑ ]+Ver ficha partido\b/giu,
  /\bCalendario de [^.?!]{0,140}(?:MARCA|AP|EFE|AFP|REUTERS|LaPresse)\b/giu,
  /\b(?:Gol de|Victoria de|Jugadores de|Cristian Romero del Tottenham|Robin Roefs, portero del Sunderland|Malo Gusto disputa un balón con Rodri en el Chelsea-Manchester City)[^.?!]{0,140}(?:\|\s*)?(?:AP|EFE|AFP|REUTERS|MARCA|LaPresse)\b/giu,
];

const SENTENCE_NOISE_PATTERNS = [
  /ver ficha partido/i,
  /^ficha técnica/i,
  /^árbitro:/i,
  /^goles:/i,
  /^estadio:/i,
  /^incidencias:/i,
  /^espectadores:/i,
  /^noticias relacionadas/i,
  /actualizado \d{2}\/\d{2}\/\d{4}/i,
  /^calendario de /i,
  /^[A-ZÁÉÍÓÚÜÑ ]+\d{1,2}[A-ZÁÉÍÓÚÜÑ ]+$/u,
];


/* ------------------------------------------------------------------------
Funciones de normalización, formateo y utilidades para manejar las noticias.
------------------------------------------------------------------------ */
// Elimina espacios extra y saltos de línea
export function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/\u00a0/g, " ")
    .replace(/([.!?])(?=[A-ZÁÉÍÓÚÜÑ¿¡“"])/gu, "$1 ")
    .replace(/([A-ZÁÉÍÓÚÜÑ]{2,})([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ])/gu, "$1 $2")
    .replace(/([A-ZÁÉÍÓÚÜÑ]+)(\d{1,2})([A-ZÁÉÍÓÚÜÑ]+)/gu, "$1 $2 $3")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeUrlValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function splitIntoSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ¿¡“"])/u)
    .map((sentence) => normalizeText(sentence))
    .filter((sentence): sentence is string => sentence !== null);
}

function getLeadingWords(value: string, count: number): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count);
}

function sharesLeadingWords(left: string, right: string, minWords = DUPLICATE_LEAD_WORDS): boolean {
  const leftWords = getLeadingWords(left, minWords);
  const rightWords = getLeadingWords(right, minWords);

  if (leftWords.length < minWords || rightWords.length < minWords) {
    return false;
  }

  return leftWords.join(" ") === rightWords.join(" ");
}

function sanitizeSummaryText(value: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/\bLeer\b\.?$/iu, "")
    .replace(/\.{3,}$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoisySentence(sentence: string): boolean {
  const normalized = sentence.trim();

  if (!normalized) {
    return true;
  }

  if (SENTENCE_NOISE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (
    /:\s.*;.*;.*;/u.test(normalized) ||
    /\b(?:Árbitro|Goles|Estadio|Incidencias):/iu.test(normalized)
  ) {
    return true;
  }

  return (
    normalized.length < 120 &&
    /\b(?:AP|EFE|AFP|REUTERS|MARCA|LaPresse)\b/u.test(normalized) &&
    !/[,:;]/.test(normalized)
  );
}

function sanitizeArticleText(value: string | null): string {
  if (!value) {
    return "";
  }

  const withoutInlineNoise = INLINE_NOISE_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, " "),
    value,
  );

  return splitIntoSentences(withoutInlineNoise)
    .filter((sentence) => !isNoisySentence(sentence))
    .join(" ");
}

function stripLeadingDuplicate(content: string, leads: Array<string | null | undefined>): string {
  if (!content) {
    return "";
  }

  const usefulLeads = leads
    .map((lead) => normalizeText(lead))
    .filter((lead): lead is string => Boolean(lead));

  if (usefulLeads.length === 0) {
    return content;
  }

  const sentences = splitIntoSentences(content);
  let startIndex = 0;

  while (
    startIndex < sentences.length &&
    usefulLeads.some((lead) => sharesLeadingWords(sentences[startIndex], lead))
  ) {
    startIndex += 1;
  }

  const stripped = sentences.slice(startIndex).join(" ").trim();
  return stripped || content;
}

function buildPreviewFromContent(content: string, leads: string[]): string {
  if (!content) {
    return "";
  }

  const collected: string[] = [];

  for (const sentence of splitIntoSentences(content)) {
    if (leads.some((lead) => sharesLeadingWords(sentence, lead))) {
      continue;
    }

    collected.push(sentence);

    if (collected.join(" ").length >= PREVIEW_MIN_LENGTH) {
      break;
    }
  }

  return truncateText(collected.join(" ").trim(), PREVIEW_MAX_LENGTH);
}

function shouldRegenerateSummary(
  originalSummary: string | null,
  cleanedSummary: string,
  title: string,
  headline: string,
): boolean {
  if (!cleanedSummary) {
    return true;
  }

  if (
    cleanedSummary.length < 70 ||
    (originalSummary ? /\.{3,}\s*$/u.test(originalSummary) : false) ||
    /\bleer\b$/iu.test(cleanedSummary) ||
    /actualizado \d{2}\/\d{2}\/\d{4}/iu.test(cleanedSummary) ||
    /ver ficha partido/iu.test(cleanedSummary)
  ) {
    return true;
  }

  const normalizedSummary = cleanedSummary.toLowerCase();
  return (
    normalizedSummary === title.toLowerCase() ||
    normalizedSummary === headline.toLowerCase()
  );
}


// Normaliza una lista de cadenas (strings), eliminando duplicados y valores vacíos
export function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter((item): item is string => item !== null)
    .filter(
      (item, index, items) =>
        items.findIndex(
          (candidate) => candidate.toLowerCase() === item.toLowerCase(),
        ) === index,
    );
}


// Corta el texto a una longitud máxima sin cortar palabras a la mitad, y agrega "..." al final si es que se corta (para titulos)
export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const sliced = value.slice(0, maxLength + 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const safeCut = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;

  return `${sliced.slice(0, safeCut).trim()}...`;
}


// Transforma una fecha en formato string a un timestamp, o null si no es una fecha válida.
export function parseDate(dateString: string): number | null {
  const time = Date.parse(dateString);
  return Number.isNaN(time) ? null : time;
}


// Trasforma una fecha en formato string a un formato relativo (hace X minutos, horas o días) o un mensaje de error si no es una fecha válida.
export function formatRelative(dateString: string): string {
  const time = parseDate(dateString);

  if (time === null) {
    return "Fecha no disponible";
  }

  const diffMin = Math.max(1, Math.floor((Date.now() - time) / 60000));

  if (diffMin < 60) {
    return `Hace ${diffMin} min`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  return `Hace ${Math.floor(diffHours / 24)} d`;
}


// Transforma una fecha en formato string a un formato completo (día de la semana, día, mes, año, hora y minutos) o un mensaje de error si no es una fecha válida.
export function formatFullDate(dateString: string): string {
  const time = parseDate(dateString);

  if (time === null) {
    return "Fecha no disponible";
  }

  return new Date(time).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


// Estima el tiempo de lectura en minutos basado en la cantidad de palabras.
export function estimateReadTime(...parts: string[]): number {
  const text = parts.filter(Boolean).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 180));
}


// Si el tiempo de lectura es un número válido y positivo, lo redondea.
export function normalizeReadTime(value: unknown, ...parts: string[]): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  return estimateReadTime(...parts);
}


// Divide un bloque de texto en párrafos basados en puntos, signos de interrogación o exclamación, y saltos de línea, asegurando que cada párrafo tenga al menos 2 oraciones si es posible.
export function splitIntoParagraphs(block: string): string[] {
  const sentences = block
    .split(/(?<=[.!?])\s+(?=[A-Z])/u)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [block];
  }

  const paragraphs: string[] = [];

  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(" "));
  }

  return paragraphs;
}


/* 
Función que toma un objeto de noticia sin normalizar (ApiNewsItem) y lo transforma en un objeto de noticia normalizado (NewsItem)
Parametros:
- item: el objeto de noticia sin normalizar que se desea transformar
- index: el índice del objeto en la lista original, utilizado para asignar un ID si el objeto no tiene uno válido

Retorna:
- Un objeto de noticia normalizado (NewsItem) si la transformación es exitosa y el objeto tiene los campos mínimos requeridos (title, headline y publishedAt)
- null si el objeto no tiene los campos mínimos requeridos o si ocurre algún error durante la normalización

Funcionamiento:
1. Normaliza el título, titular, resumen, contenido, fuente, imagen, fecha de publicación, tiempo de lectura, URL, equipos y equipo principal utilizando las funciones de normalización definidas anteriormente.
2. Si el título, titular o fecha de publicación no son válidos después de la normalización, retorna null.
3. Si el ID del objeto es un número válido, lo utiliza como ID; de lo contrario, asigna un ID basado en el índice.
4. Retorna un objeto de noticia normalizado con los campos requeridos y opcionales.
*/
export function normalizeNewsItem(
  item: ApiNewsItem,
  index: number,
): NewsItem | null {
  const rawTitle = normalizeText(item.title);
  const headline = normalizeText(item.headline) || rawTitle;
  const title = rawTitle || headline;
  const originalSummary = normalizeText(item.summary);
  const rawSummary = sanitizeSummaryText(originalSummary);
  const cleanContent = sanitizeArticleText(normalizeText(item.content));
  const summary = shouldRegenerateSummary(
    originalSummary,
    rawSummary,
    title || "",
    headline || "",
  )
    ? buildPreviewFromContent(cleanContent, [title || "", headline || ""]) || rawSummary || headline || "Sin resumen disponible."
    : rawSummary;
  const content = stripLeadingDuplicate(cleanContent, [summary, title, headline]);
  const publishedAt = normalizeText(item.publishedAt);
  const teams = normalizeStringList(item.teams);
  const primaryTeam = normalizeText(item.primaryTeam) || teams[0] || null;

  if (!headline || !publishedAt || !title) {
    return null;
  }

  return {
    id:
      typeof item.id === "number" && Number.isFinite(item.id)
        ? item.id
        : index + 1,
    title,
    headline,
    summary,
    content: content || "",
    source: normalizeText(item.source) || "Fuente externa",
    image: normalizeUrlValue(item.image),
    publishedAt,
    readTime: normalizeReadTime(item.readTime, title, summary, content || ""),
    url: normalizeUrlValue(item.url),
    teams,
    primaryTeam,
  };
}


/* 
Función que construye el texto del artículo a mostrar en la página de detalle de una noticia
Parametros:
- item: el objeto de noticia normalizado (NewsItem) del cual se desea construir el texto del artículo

Retorna:
- Un array de strings, donde cada string representa un bloque de texto (párrafo) que se mostrará en la página de detalle de la noticia. El array puede contener uno o dos bloques, dependiendo de si el resumen y el contenido son suficientemente diferentes entre sí.

Funcionamiento:
1. Normaliza el resumen y el contenido del objeto de noticia.
2. Si ambos resumen y contenido
    - Si el resumen y el contenido son suficientemente similares (uno incluye al otro), se considera que son redundantes y se utiliza solo el bloque más largo entre ambos.
    - Si el resumen y el contenido son suficientemente diferentes, se incluyen ambos bloques en el resultado.
3. Elimina bloques vacíos o nulos, y elimina duplicados ignorando mayúsculas.
4. Divide cada bloque en párrafos utilizando la función splitIntoParagraphs, y devuelve el resultado como un array de strings.
*/
export function buildArticleText(item: NewsItem): string[] {
  const summary = item.summary;
  const content = item.content;
  const summaryNormalized = summary.toLowerCase();
  const contentNormalized = content.toLowerCase();

  let blocks: string[] = [];

  if (content && summary) {
    if (
      contentNormalized.includes(summaryNormalized) ||
      summaryNormalized.includes(contentNormalized)
    ) {
      blocks = [content.length >= summary.length ? content : summary];
    } else {
      blocks = [summary, content];
    }
  } else {
    blocks = [summary, content].filter(Boolean);
  }

  blocks = blocks.filter(
    (block, index, items) =>
      items.findIndex(
        (candidate) => candidate.toLowerCase() === block.toLowerCase(),
      ) === index,
  );

  return blocks.flatMap((block) => splitIntoParagraphs(block));
}


// Construye una lista de noticias relacionadas basada en el equipo principal de la noticia actual, ordenando primero por relevancia al equipo y luego por fecha de publicación.
export function buildRelatedNews(
  allNews: NewsItem[],
  currentNews: NewsItem,
): NewsItem[] {
  const currentTeam = currentNews.primaryTeam;

  return [...allNews]
    .filter((item) => item.id !== currentNews.id)
    .sort((left, right) => {
      const leftScore =
        (currentTeam && left.teams.includes(currentTeam) ? 2 : 0) +
        (left.primaryTeam === currentTeam ? 1 : 0);
      const rightScore =
        (currentTeam && right.teams.includes(currentTeam) ? 2 : 0) +
        (right.primaryTeam === currentTeam ? 1 : 0);

      return rightScore - leftScore;
    })
    .slice(0, 3);
}


// Función para jalar las noticias desde el API, normalizarlas y manejar errores
function isNewsCacheFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt <= FRONTEND_NEWS_CACHE_TTL_MS;
}

function normalizeNewsQueryValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function writeNewsCache(snapshot: NewsCacheSnapshot): void {
  memoryNewsCache = snapshot;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      FRONTEND_NEWS_CACHE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // ignore storage errors
  }
}

function readStoredNewsCache(): NewsCacheSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(FRONTEND_NEWS_CACHE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<NewsCacheSnapshot>;

    if (!parsed || !Array.isArray(parsed.news) || typeof parsed.cachedAt !== "number") {
      return null;
    }

    return {
      news: parsed.news as NewsItem[],
      error: typeof parsed.error === "string" ? parsed.error : null,
      hasMore: Boolean(parsed.hasMore),
      page: typeof parsed.page === "number" && parsed.page > 0 ? parsed.page : 1,
      search: typeof parsed.search === "string" ? parsed.search : "",
      teamFilter:
        typeof parsed.teamFilter === "string" ? parsed.teamFilter : DEFAULT_FILTER,
      cachedAt: parsed.cachedAt,
    };
  } catch {
    return null;
  }
}

export function getCachedNewsSnapshot(): NewsCacheSnapshot | null {
  if (memoryNewsCache && isNewsCacheFresh(memoryNewsCache.cachedAt)) {
    return memoryNewsCache;
  }

  const stored = readStoredNewsCache();

  if (stored && isNewsCacheFresh(stored.cachedAt)) {
    memoryNewsCache = stored;
    return stored;
  }

  return null;
}

export function setCachedNewsSnapshot(snapshot: {
  news: NewsItem[];
  error: string | null;
  hasMore?: boolean;
  page?: number;
  search?: string;
  teamFilter?: string;
}): void {
  writeNewsCache({
    news: snapshot.news,
    error: snapshot.error,
    hasMore: snapshot.hasMore ?? false,
    page: snapshot.page ?? 1,
    search: snapshot.search ?? "",
    teamFilter: snapshot.teamFilter ?? DEFAULT_FILTER,
    cachedAt: Date.now(),
  });
}

export function mergeNewsItems(current: NewsItem[], incoming: NewsItem[]): NewsItem[] {
  const seen = new Set<number>();
  const merged: NewsItem[] = [];

  for (const item of [...current, ...incoming]) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}

export async function fetchNews(
  params: FetchNewsParams = {},
  signal?: AbortSignal,
): Promise<FetchNewsResult> {
  const offset =
    typeof params.offset === "number" && params.offset >= 0 ? params.offset : 0;
  const page = typeof params.page === "number" && params.page > 0 ? params.page : 1;
  const limit =
    typeof params.limit === "number" && params.limit > 0 ? params.limit : 8;
  const team = normalizeNewsQueryValue(params.team);
  const search = normalizeNewsQueryValue(params.search);
  const query = new URLSearchParams({
    limit: String(limit),
  });

  if (offset > 0) {
    query.set("offset", String(offset));
  } else {
    query.set("page", String(page));
  }

  if (team) {
    query.set("team", team);
  }

  if (search) {
    query.set("search", search);
  }

  const response = await fetch(`${API_URL}/api/noticias?${query.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = (await response.json()) as NewsApiResponse;

  if (!json.success || !Array.isArray(json.data)) {
    return {
      news: [],
      error:
        json.error || "No fue posible cargar noticias de la Premier League.",
      hasMore: false,
      page: typeof json.page === "number" ? json.page : page,
      limit,
    };
  }

  return {
    news: json.data
      .map((item, index) => normalizeNewsItem(item, index))
      .filter((item): item is NewsItem => item !== null),
    error: null,
    hasMore: Boolean(json.hasMore),
    page: typeof json.page === "number" ? json.page : page,
    limit: typeof json.limit === "number" ? json.limit : limit,
  };
}
