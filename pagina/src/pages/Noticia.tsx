import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:4000";

interface ApiNewsItem {
  id?: number;
  title?: string;
  headline?: string;
  summary?: string;
  description?: string;
  content?: string;
  source?: string;
  image?: string | null;
  image_url?: string | null;
  publishedAt?: string;
  published_at?: string;
  readTime?: number;
  read_time?: number;
  url?: string | null;
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

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "18px",
  border: "1px solid #ece8f4",
  boxShadow: "0 14px 30px rgba(25, 35, 58, 0.06)",
};

function cleanText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/\s*\[\+\d+\s+chars\]\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRelative(dateString: string): string {
  const date = new Date(dateString).getTime();
  const diffMin = Math.max(1, Math.floor((Date.now() - date) / 60000));

  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-MX", {
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

function normalizeNewsItem(item: ApiNewsItem, index: number): NewsItem | null {
  const title = cleanText(item.title ?? item.headline);
  const summary = cleanText(item.summary ?? item.description);
  const content = cleanText(item.content);
  const source = cleanText(item.source) || "Fuente externa";
  const publishedAt = item.publishedAt ?? item.published_at ?? "";

  const haystack = `${title} ${summary} ${content}`.toLowerCase();
  const isPremier =
    haystack.includes("premier league") ||
    haystack.includes("english premier league") ||
    haystack.includes("epl");

  if (!title || !summary || !publishedAt || !isPremier) {
    return null;
  }

  return {
    id: item.id ?? index + 1,
    title,
    summary,
    content,
    source,
    image: cleanText(item.image ?? item.image_url) || null,
    publishedAt,
    readTime:
      item.readTime ??
      item.read_time ??
      estimateReadTime(title, summary, content),
    url: cleanText(item.url) || null,
  };
}

function buildArticleText(item: NewsItem): string[] {
  const parts = [item.summary, item.content]
    .map((part) => cleanText(part))
    .filter(Boolean);

  return parts.filter(
    (part, index) =>
      parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) ===
      index,
  );
}

function NewsImage({
  image,
  height,
  radius,
}: {
  image: string | null;
  height: string;
  radius?: string;
}) {
  if (!image) {
    return (
      <div
        style={{
          height,
          borderRadius: radius,
          background:
            "linear-gradient(135deg, #223552 0%, #364f78 55%, #d91f5c 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.92)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 800,
          fontSize: "0.85rem",
        }}
      >
        Premier League
      </div>
    );
  }

  return (
    <div
      style={{
        height,
        borderRadius: radius,
        background: `url(${image}) center/cover`,
      }}
    />
  );
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
      onClick={onClick}
      style={{
        border: active ? "1px solid #9b2c68" : "1px solid #d6d9e2",
        background: active ? "rgba(155,44,104,0.1)" : "#ffffff",
        color: active ? "#9b2c68" : "#405066",
        borderRadius: "999px",
        padding: "0.5rem 0.9rem",
        fontSize: "0.75rem",
        fontWeight: 700,
        cursor: "pointer",
      }}
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
      onClick={() => onOpen(item)}
      style={{
        ...cardStyle,
        width: "100%",
        padding: "0.8rem",
        textAlign: "left",
        borderColor: "#ebe7f2",
        cursor: "pointer",
      }}
    >
      <NewsImage image={item.image} height="182px" radius="14px" />
      <p
        style={{
          color: "#1f2f48",
          fontSize: "0.85rem",
          lineHeight: 1.45,
          fontWeight: 700,
          margin: "0.85rem 0 0.45rem",
          minHeight: "60px",
        }}
      >
        {item.title}
      </p>
      <p
        style={{
          color: "#5d6573",
          fontSize: "0.76rem",
          lineHeight: 1.5,
          margin: "0 0 0.8rem",
          minHeight: "48px",
        }}
      >
        {item.summary}
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.73rem",
        }}
      >
        <span style={{ color: "#cb2e5d", fontWeight: 700 }}>{item.source}</span>
        <span style={{ color: "#1f2f48", fontWeight: 700 }}>Leer mas ↗</span>
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
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              color: "#7e8795",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "0 0 0.35rem",
            }}
          >
            Noticias
          </p>
          <h2 style={{ color: "#1f2f48", fontSize: "1.8rem", margin: 0 }}>
            Lectura completa
          </h2>
        </div>

        <button
          onClick={onBack}
          style={{
            border: "none",
            background: "#243752",
            color: "#ffffff",
            borderRadius: "999px",
            padding: "0.75rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Volver a noticias
        </button>
      </div>

      <article style={{ ...cardStyle, padding: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.15rem",
            alignItems: "stretch",
          }}
        >
          <NewsImage image={item.image} height="100%" radius="16px" />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0.4rem 0.2rem",
            }}
          >
            <p
              style={{
                color: "#cb2e5d",
                fontSize: "0.76rem",
                fontWeight: 800,
                margin: "0 0 0.55rem",
              }}
            >
              {item.source}
            </p>
            <h3
              style={{
                color: "#121a28",
                fontSize: "2rem",
                lineHeight: 1.05,
                margin: "0 0 0.85rem",
              }}
            >
              {item.title}
            </h3>
            <p
              style={{
                color: "#4d5563",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                margin: "0 0 1rem",
              }}
            >
              {item.summary}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.8rem",
                color: "#7e8795",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              <span>{formatFullDate(item.publishedAt)}</span>
              <span>{item.readTime} min de lectura</span>
              <span>Premier League</span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "1.5rem",
            padding: "0 0.4rem 0.2rem",
            display: "grid",
            gap: "1rem",
          }}
        >
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${item.id}-${index}`}
              style={{
                color: "#2c3747",
                fontSize: "1rem",
                lineHeight: 1.85,
                margin: 0,
              }}
            >
              {paragraph}
            </p>
          ))}

          {paragraphs.length === 0 && (
            <p
              style={{
                color: "#4d5563",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Esta noticia no trae mas cuerpo de texto desde el API. Puedes abrir la
              fuente original para revisar la version completa publicada por el medio.
            </p>
          )}

          {item.url && (
            <div style={{ paddingTop: "0.5rem" }}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  background: "#cb2e5d",
                  color: "#ffffff",
                  borderRadius: "999px",
                  padding: "0.78rem 1.05rem",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                }}
              >
                Abrir fuente original
              </a>
            </div>
          )}
        </div>
      </article>

      {relatedNews.length > 0 && (
        <section style={{ display: "grid", gap: "0.85rem" }}>
          <div>
            <p
              style={{
                color: "#7e8795",
                fontSize: "0.74rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 0.25rem",
              }}
            >
              Siguiente lectura
            </p>
            <h3 style={{ color: "#1f2f48", fontSize: "1.1rem", margin: 0 }}>
              Mas noticias de la Premier League
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "1rem",
            }}
          >
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
    const loadNews = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/noticias`);
        const json = await response.json();

        if (!json.success || !Array.isArray(json.data)) {
          setNews([]);
          setError("No fue posible cargar noticias de la Premier League.");
          return;
        }

        const normalized = json.data
          .map((item: ApiNewsItem, index: number) => normalizeNewsItem(item, index))
          .filter((item: NewsItem | null): item is NewsItem => item !== null);

        setNews(normalized);
      } catch (requestError) {
        console.error(requestError);
        setNews([]);
        setError("Error conectando con API");
      } finally {
        setLoading(false);
      }
    };

    loadNews();
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
    const uniqueSources = Array.from(new Set(news.map((item) => item.source))).slice(0, 5);
    return ["Todas", ...uniqueSources];
  }, [news]);

  const filteredNews = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return news.filter((item) => {
      const matchesSource = sourceFilter === "Todas" || item.source === sourceFilter;
      const haystack = `${item.title} ${item.summary} ${item.content} ${item.source}`.toLowerCase();
      const matchesSearch = searchTerm.length === 0 || haystack.includes(searchTerm);

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
    return <p style={{ color: "#7e8795" }}>Cargando noticias de la Premier League...</p>;
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
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div>
        <p
          style={{
            color: "#7e8795",
            fontSize: "0.78rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "0 0 0.35rem",
          }}
        >
          Noticias
        </p>
        <h2 style={{ color: "#1f2f48", fontSize: "1.8rem", margin: "0 0 0.35rem" }}>
          Actualidad de la Premier League
        </h2>
        <p style={{ color: "#6f7785", fontSize: "0.9rem", margin: 0 }}>
          Vista editorial inspirada en el layout de referencia, pero alimentada solo
          con noticias del API.
        </p>
      </div>

      <section
        style={{
          ...cardStyle,
          padding: "1rem",
          display: "grid",
          gap: "0.9rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.9rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.55rem",
              flexWrap: "wrap",
            }}
          >
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
            style={{
              width: "min(100%, 290px)",
              padding: "0.8rem 0.95rem",
              borderRadius: "999px",
              border: "1px solid #d8dce5",
              background: "#fafbfd",
              color: "#1f2f48",
              fontSize: "0.82rem",
              outline: "none",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid #f6dba2",
              background: "#fff8e7",
              color: "#8a6d1d",
              fontSize: "0.82rem",
              padding: "0.85rem 1rem",
            }}
          >
            {error}
          </div>
        )}

        {featuredNews ? (
          <>
            <button
              onClick={() => setSelectedNews(featuredNews)}
              style={{
                ...cardStyle,
                width: "100%",
                padding: "0.95rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1rem",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <NewsImage image={featuredNews.image} height="100%" radius="14px" />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "0.8rem",
                  padding: "0.3rem 0.2rem",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "#cb2e5d",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      margin: "0 0 0.5rem",
                    }}
                  >
                    {featuredNews.source}
                  </p>
                  <h3
                    style={{
                      color: "#111827",
                      fontSize: "2rem",
                      lineHeight: 1.02,
                      margin: "0 0 0.85rem",
                    }}
                  >
                    {featuredNews.title}
                  </h3>
                  <p
                    style={{
                      color: "#4d5563",
                      fontSize: "0.92rem",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {featuredNews.summary}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                      color: "#7e8795",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                    }}
                  >
                    <span>{formatRelative(featuredNews.publishedAt)}</span>
                    <span>{featuredNews.readTime} min</span>
                  </div>

                  <span style={{ color: "#111827", fontSize: "0.78rem", fontWeight: 800 }}>
                    Leer mas ↗
                  </span>
                </div>
              </div>
            </button>

            {galleryNews.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                {galleryNews.map((item) => (
                  <RelatedCard key={item.id} item={item} onOpen={(newsItem) => setSelectedNews(newsItem)} />
                ))}
              </div>
            )}

            {moreNews.length > 0 && (
              <div style={{ display: "grid", gap: "0.8rem", paddingTop: "0.15rem" }}>
                <div>
                  <p
                    style={{
                      color: "#7e8795",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    Mas titulares
                  </p>
                  <h3 style={{ color: "#1f2f48", fontSize: "1rem", margin: 0 }}>
                    Noticias recientes filtradas
                  </h3>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "0.85rem",
                  }}
                >
                  {moreNews.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedNews(item)}
                      style={{
                        ...cardStyle,
                        padding: "0.9rem 1rem",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          marginBottom: "0.45rem",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#cb2e5d",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                          }}
                        >
                          {item.source}
                        </span>
                        <span
                          style={{
                            color: "#7e8795",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {formatRelative(item.publishedAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          color: "#1f2f48",
                          fontSize: "0.88rem",
                          lineHeight: 1.45,
                          fontWeight: 700,
                          margin: "0 0 0.45rem",
                        }}
                      >
                        {item.title}
                      </p>

                      <p
                        style={{
                          color: "#5d6573",
                          fontSize: "0.77rem",
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        {item.summary}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid #ebe7f2",
              background: "#ffffff",
              color: "#6f7785",
              textAlign: "center",
              padding: "2.4rem 1rem",
              fontSize: "0.9rem",
            }}
          >
            No se encontraron noticias de la Premier League con los filtros actuales.
          </div>
        )}
      </section>
    </div>
  );
}
