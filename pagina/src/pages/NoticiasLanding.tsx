import { useEffect, useMemo, useState } from "react";
import "../estilos/EstiloNoticiasLanding.css";

const API_URL = "http://localhost:4000";

interface ApiNewsItem {
  id?: number | null;
  title?: string | null;
  summary?: string | null;
  content?: string | null;
  source?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  readTime?: number | null;
  url?: string | null;
}

interface NewsApiResponse {
  success?: boolean;
  data?: ApiNewsItem[];
  error?: string;
}

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  source: string;
  image: string | null;
  publishedAt: string;
  readTime: number;
  url: string | null;
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function parseDate(dateString: string): number | null {
  const time = Date.parse(dateString);
  return Number.isNaN(time) ? null : time;
}

function formatRelative(dateString: string): string {
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

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

function formatFullDate(dateString: string): string {
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

function estimateReadTime(...parts: string[]): number {
  const text = parts.filter(Boolean).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 180));
}

function normalizeReadTime(value: unknown, ...parts: string[]): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  return estimateReadTime(...parts);
}

function normalizeNewsItem(item: ApiNewsItem, index: number): NewsItem | null {
  const title = normalizeText(item.title);
  const content = normalizeText(item.content);
  const summary =
    normalizeText(item.summary) || content || "Sin resumen disponible.";
  const publishedAt = normalizeText(item.publishedAt);

  if (!title || !publishedAt) {
    return null;
  }

  return {
    id:
      typeof item.id === "number" && Number.isFinite(item.id)
        ? item.id
        : index + 1,
    title,
    summary,
    content,
    source: normalizeText(item.source) || "Fuente externa",
    image: normalizeOptionalText(item.image),
    publishedAt,
    readTime: normalizeReadTime(item.readTime, title, summary, content),
    url: normalizeOptionalText(item.url),
  };
}

function buildArticleText(item: NewsItem): string[] {
  const parts = [item.summary, item.content].filter(Boolean);

  return parts.filter(
    (part, index) =>
      parts.findIndex(
        (candidate) => candidate.toLowerCase() === part.toLowerCase(),
      ) === index,
  );
}

function NewsImage({
  image,
  alt,
  className,
  fallbackClassName,
}: {
  image: string | null;
  alt: string;
  className: string;
  fallbackClassName: string;
}) {
  if (!image) {
    return <div className={fallbackClassName}>Premier League</div>;
  }

  return <img src={image} alt={alt} className={className} />;
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`noticias-chip ${active ? "noticias-chip--active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function RelatedCard({
  item,
  onOpen,
}: {
  item: NewsItem;
  onOpen: (item: NewsItem) => void;
}) {
  return (
    <button
      type="button"
      className="noticias-related-card"
      onClick={() => onOpen(item)}
    >
      <NewsImage
        image={item.image}
        alt={item.title}
        className="noticias-related-card__image"
        fallbackClassName="noticias-related-card__fallback"
      />
      <p className="noticias-related-card__title">{item.title}</p>
      <p className="noticias-related-card__summary">{item.summary}</p>
      <div className="noticias-related-card__footer">
        <span className="noticias-related-card__source">{item.source}</span>
        <span className="noticias-related-card__cta">Leer mas</span>
      </div>
    </button>
  );
}

function NewsDetailPage({
  item,
  relatedNews,
  onBack,
  onOpen,
}: {
  item: NewsItem;
  relatedNews: NewsItem[];
  onBack: () => void;
  onOpen: (item: NewsItem) => void;
}) {
  const paragraphs = buildArticleText(item);

  return (
    <div className="noticias-page">
      <div className="noticias-detail-header">
        <div>
          <p className="noticias-eyebrow">Noticias</p>
          <h2 className="noticias-page-title">Lectura completa</h2>
        </div>

        <button type="button" className="noticias-back-button" onClick={onBack}>
          Volver a noticias
        </button>
      </div>

      <article className="noticias-detail-card">
        <div className="noticias-detail-hero">
          <NewsImage
            image={item.image}
            alt={item.title}
            className="noticias-detail-hero__image"
            fallbackClassName="noticias-detail-hero__fallback"
          />

          <div className="noticias-detail-hero__content">
            <p className="noticias-detail-hero__source">{item.source}</p>
            <h3 className="noticias-detail-hero__title">{item.title}</h3>
            <p className="noticias-detail-hero__summary">{item.summary}</p>

            <div className="noticias-detail-hero__meta">
              <span>{formatFullDate(item.publishedAt)}</span>
              <span>{item.readTime} min de lectura</span>
              <span>Premier League</span>
            </div>
          </div>
        </div>

        <div className="noticias-detail-body">
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${item.id}-${index}`}
              className="noticias-detail-body__text"
            >
              {paragraph}
            </p>
          ))}

          {paragraphs.length === 0 && (
            <p className="noticias-detail-body__text">
              Esta noticia no trae mas cuerpo de texto desde el API. Puedes
              abrir la fuente original para revisar la version completa
              publicada por el medio.
            </p>
          )}

          {item.url && (
            <div className="noticias-detail-body__actions">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="noticias-source-link"
              >
                Abrir fuente original
              </a>
            </div>
          )}
        </div>
      </article>

      {relatedNews.length > 0 && (
        <section className="noticias-related-section">
          <div>
            <p className="noticias-related-section__eyebrow">
              Siguiente lectura
            </p>
            <h3 className="noticias-related-section__title">
              Mas noticias de la Premier League
            </h3>
          </div>

          <div className="noticias-related-grid">
            {relatedNews.map((related) => (
              <RelatedCard key={related.id} item={related} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function NoticiasLanding() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("Todas");

  useEffect(() => {
    const controller = new AbortController();

    const loadNews = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/noticias`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = (await response.json()) as NewsApiResponse;

        if (!json.success || !Array.isArray(json.data)) {
          setNews([]);
          setError(
            json.error ||
              "No fue posible cargar noticias de la Premier League.",
          );
          return;
        }

        const normalized = json.data
          .map((item, index) => normalizeNewsItem(item, index))
          .filter((item): item is NewsItem => item !== null);

        setNews(normalized);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        console.error(requestError);
        setNews([]);
        setError("Error conectando con API");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadNews();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!selectedNews) {
      return;
    }

    const stillExists = news.some((item) => item.id === selectedNews.id);

    if (!stillExists) {
      setSelectedNews(null);
    }
  }, [news, selectedNews]);

  useEffect(() => {
    if (!selectedNews) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedNews]);

  const sourceOptions = useMemo(() => {
    const uniqueSources = Array.from(
      new Set(news.map((item) => item.source)),
    ).slice(0, 5);

    return ["Todas", ...uniqueSources];
  }, [news]);

  const filteredNews = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return news.filter((item) => {
      const matchesSource =
        sourceFilter === "Todas" || item.source === sourceFilter;
      const haystack =
        `${item.title} ${item.summary} ${item.content} ${item.source}`.toLowerCase();
      const matchesSearch =
        searchTerm.length === 0 || haystack.includes(searchTerm);

      return matchesSource && matchesSearch;
    });
  }, [news, search, sourceFilter]);

  const featuredNews = filteredNews[0] ?? null;
  const galleryNews = filteredNews.slice(1, 4);
  const moreNews = filteredNews.slice(4, 10);
  const relatedNews = selectedNews
    ? news.filter((item) => item.id !== selectedNews.id).slice(0, 3)
    : [];

  if (loading) {
    return (
      <div className="noticias-page">
        <p className="noticias-status">
          Cargando noticias de la Premier League...
        </p>
      </div>
    );
  }

  if (selectedNews) {
    return (
      <NewsDetailPage
        item={selectedNews}
        relatedNews={relatedNews}
        onBack={() => setSelectedNews(null)}
        onOpen={(item) => setSelectedNews(item)}
      />
    );
  }

  return (
    <div className="noticias-page">
      <div className="noticias-page-header">
        <div>
          <p className="noticias-eyebrow">Noticias</p>
          <h2 className="noticias-page-title">
            Actualidad de la Premier League
          </h2>
          <p className="noticias-page-description">
            Vista editorial inspirada en el layout de referencia, pero
            alimentada solo con noticias del API.
          </p>
        </div>
      </div>

      <section className="noticias-shell">
        <div className="noticias-toolbar">
          <div className="noticias-chip-list">
            {sourceOptions.map((source) => (
              <FilterChip
                key={source}
                label={source}
                active={sourceFilter === source}
                onClick={() => setSourceFilter(source)}
              />
            ))}
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar noticias especificas"
            className="noticias-search"
          />
        </div>

        {error && <div className="noticias-warning">{error}</div>}

        {featuredNews ? (
          <>
            <button
              type="button"
              className="noticias-featured-card"
              onClick={() => setSelectedNews(featuredNews)}
            >
              <NewsImage
                image={featuredNews.image}
                alt={featuredNews.title}
                className="noticias-featured-card__image"
                fallbackClassName="noticias-featured-card__fallback"
              />

              <div className="noticias-featured-card__content">
                <div>
                  <p className="noticias-featured-card__source">
                    {featuredNews.source}
                  </p>
                  <h3 className="noticias-featured-card__title">
                    {featuredNews.title}
                  </h3>
                  <p className="noticias-featured-card__summary">
                    {featuredNews.summary}
                  </p>
                </div>

                <div className="noticias-featured-card__footer">
                  <div className="noticias-featured-card__meta">
                    <span>{formatRelative(featuredNews.publishedAt)}</span>
                    <span>{featuredNews.readTime} min</span>
                  </div>

                  <span className="noticias-featured-card__cta">Leer mas</span>
                </div>
              </div>
            </button>

            {galleryNews.length > 0 && (
              <div className="noticias-gallery-grid">
                {galleryNews.map((item) => (
                  <RelatedCard
                    key={item.id}
                    item={item}
                    onOpen={(newsItem) => setSelectedNews(newsItem)}
                  />
                ))}
              </div>
            )}

            {moreNews.length > 0 && (
              <div className="noticias-more-section">
                <div>
                  <p className="noticias-more-section__eyebrow">
                    Mas titulares
                  </p>
                  <h3 className="noticias-more-section__title">
                    Noticias recientes filtradas
                  </h3>
                </div>

                <div className="noticias-more-grid">
                  {moreNews.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="noticias-more-card"
                      onClick={() => setSelectedNews(item)}
                    >
                      <div className="noticias-more-card__header">
                        <span className="noticias-more-card__source">
                          {item.source}
                        </span>
                        <span className="noticias-more-card__time">
                          {formatRelative(item.publishedAt)}
                        </span>
                      </div>

                      <p className="noticias-more-card__title">{item.title}</p>
                      <p className="noticias-more-card__summary">
                        {item.summary}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="noticias-empty">
            No se encontraron noticias de la Premier League con los filtros
            actuales.
          </div>
        )}
      </section>
    </div>
  );
}
