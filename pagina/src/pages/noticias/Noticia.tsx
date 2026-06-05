import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EstiloNoticiasLanding.css";
import {
  NewsItem,
  buildArticleText,
  buildRelatedNews,
  fetchNews,
  formatFullDate,
  getCachedNewsSnapshot,
  setCachedNewsSnapshot,
} from "./noticiasShared";

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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [image]);

  if (!image || hasError) {
    return <div className={fallbackClassName}>Premier League</div>;
  }

  return (
    <img
      src={image}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

function TeamBadge({ team }: { team: string | null }) {
  return <span className="noticias-team-badge">{team || "Premier League"}</span>;
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
      className="noticias-card"
      onClick={() => onOpen(item)}
    >
      <NewsImage
        image={item.image}
        alt={item.title}
        className="noticias-card__image"
        fallbackClassName="noticias-card__fallback"
      />

      <div className="noticias-card__body">
        <div className="noticias-card__topline">
          <TeamBadge team={item.primaryTeam} />
          <span className="noticias-card__time">{item.readTime} min</span>
        </div>

        <p className="noticias-card__source">{item.source}</p>
        <h3 className="noticias-card__title">{item.title}</h3>
        <p className="noticias-card__summary">{item.summary}</p>
      </div>
    </button>
  );
}

export default function Noticia() {
  const navigate = useNavigate();
  const { newsId: newsIdParam } = useParams<{ newsId: string }>();
  const newsId = useMemo(() => {
    const parsed = Number.parseInt(newsIdParam || "", 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [newsIdParam]);
  const cachedNewsSnapshot = getCachedNewsSnapshot();
  const cachedSelectedNews =
    cachedNewsSnapshot?.news.find((item) => item.id === newsId) ?? null;
  const [news, setNews] = useState<NewsItem[]>(() => cachedNewsSnapshot?.news || []);
  const [loading, setLoading] = useState(() => !cachedSelectedNews);
  const [error, setError] = useState<string | null>(() => cachedNewsSnapshot?.error || null);

  useEffect(() => {
    if (newsId === null) {
      setLoading(false);
      return;
    }

    const selectedNewsInCurrentState =
      news.some((item) => item.id === newsId);

    if (selectedNewsInCurrentState) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadNews = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchNews({}, controller.signal);
        setNews(result.news);
        setError(result.error);
        setCachedNewsSnapshot({
          news: result.news,
          error: result.error,
          hasMore: result.hasMore,
          page: result.page,
        });
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
  }, [newsId]);

  const selectedNews = useMemo(
    () => news.find((item) => item.id === newsId) ?? null,
    [news, newsId],
  );

  useEffect(() => {
    if (selectedNews) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedNews]);

  const relatedNews = selectedNews ? buildRelatedNews(news, selectedNews) : [];
  const articleText = selectedNews ? buildArticleText(selectedNews) : [];

  if (loading) {
    return (
      <div className="noticias-page">
        <p className="noticias-status">Cargando noticia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="noticias-page">
        <div className="noticias-warning">{error}</div>
      </div>
    );
  }

  if (!selectedNews) {
    return (
      <div className="noticias-page">
        <div className="noticias-empty">
          No encontramos esa noticia. Quieres regresar al listado?.
        </div>
      </div>
    );
  }

  return (
    <div className="noticias-page noticias-page--detail">
      <div className="noticias-detail-header">
        <div>
          <p className="noticias-eyebrow">Noticias</p>
        </div>

        <button
          type="button"
          className="noticias-back-button"
          onClick={() => navigate("/noticias")}
        >
          ← Volver
        </button>
      </div>

      <article className="noticias-article">
        <NewsImage
          image={selectedNews.image}
          alt={selectedNews.title}
          className="noticias-article__hero"
          fallbackClassName="noticias-article__fallback"
        />

        <div className="noticias-article__header">
          <div className="noticias-article__meta">
            <TeamBadge team={selectedNews.primaryTeam} />
            <span className="noticias-article__source">{selectedNews.source}</span>
          </div>

          <h1 className="noticias-article__title">{selectedNews.title}</h1>
          <p className="noticias-article__summary">{selectedNews.summary}</p>

          <div className="noticias-article__facts">
            <div className="noticias-article__fact">
              <span className="noticias-article__fact-label">Fuente</span>
              <span className="noticias-article__fact-value">
                {selectedNews.source}
              </span>
            </div>
            <div className="noticias-article__fact">
              <span className="noticias-article__fact-label">Publicado</span>
              <span className="noticias-article__fact-value">
                {formatFullDate(selectedNews.publishedAt)}
              </span>
            </div>
            <div className="noticias-article__fact">
              <span className="noticias-article__fact-label">Lectura</span>
              <span className="noticias-article__fact-value">
                {selectedNews.readTime} min
              </span>
            </div>
          </div>
        </div>

        <div className="noticias-article__content">
          {articleText.map((paragraph, index) => (
            <p key={`${selectedNews.id}-${index}`} className="noticias-detail-body__text">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {relatedNews.length > 0 && (
        <section className="noticias-related-section">
          <div>
            <p className="noticias-related-section__eyebrow">Siguiente lectura</p>
            <h3 className="noticias-related-section__title">
              Más noticias de la Premier League
            </h3>
          </div>

          <div className="noticias-grid">
            {relatedNews.map((item) => (
              <RelatedCard
                key={item.id}
                item={item}
                onOpen={(nextItem) => navigate(`/noticias/${nextItem.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
