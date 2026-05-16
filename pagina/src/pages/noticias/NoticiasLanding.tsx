import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EstiloNoticiasLanding.css";
import {
  DEFAULT_FILTER,
  PREMIER_TEAM_OPTIONS,
  NewsItem,
  fetchNews,
  formatRelative,
  getCachedNewsSnapshot,
  mergeNewsItems,
  setCachedNewsSnapshot,
  truncateText,
} from "./noticiasShared";

const INITIAL_NEWS_LIMIT = 7;
const LOAD_MORE_NEWS_LIMIT = 6;
const SEARCH_DEBOUNCE_MS = 300;

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
  return (
    <span className="noticias-team-badge">{team || "Premier League"}</span>
  );
}

function NewsCard({
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
          <span className="noticias-card__time">
            {formatRelative(item.publishedAt)}
          </span>
        </div>

        <p className="noticias-card__source">{item.source}</p>
        <h3 className="noticias-card__title">{item.title}</h3>
        <p className="noticias-card__summary">
          {truncateText(item.summary, 210)}
        </p>

        <div className="noticias-card__footer">
          <span>{item.readTime} min de lectura</span>
          <span className="noticias-card__cta">Leer nota</span>
        </div>
      </div>
    </button>
  );
}

export default function NoticiasLanding() {
  const navigate = useNavigate();
  const cachedNewsSnapshot = getCachedNewsSnapshot();
  const initialCachedSnapshotRef = useRef(cachedNewsSnapshot);
  const [news, setNews] = useState<NewsItem[]>(() => cachedNewsSnapshot?.news || []);
  const [loading, setLoading] = useState(() => !cachedNewsSnapshot);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(() => cachedNewsSnapshot?.error || null);
  const [search, setSearch] = useState(() => cachedNewsSnapshot?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => cachedNewsSnapshot?.search || "");
  const [teamFilter, setTeamFilter] = useState(
    () => cachedNewsSnapshot?.teamFilter || DEFAULT_FILTER,
  );
  const [hasMore, setHasMore] = useState(() => cachedNewsSnapshot?.hasMore ?? false);
  const skipInitialFetchRef = useRef(Boolean(cachedNewsSnapshot));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const shouldReuseCachedSnapshot =
      skipInitialFetchRef.current &&
      (initialCachedSnapshotRef.current?.teamFilter || DEFAULT_FILTER) === teamFilter &&
      (initialCachedSnapshotRef.current?.search || "") === debouncedSearch;

    if (shouldReuseCachedSnapshot) {
      skipInitialFetchRef.current = false;
      return () => {
        controller.abort();
      };
    }

    skipInitialFetchRef.current = false;

    const loadFirstPage = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchNews(
          {
            offset: 0,
            limit: INITIAL_NEWS_LIMIT,
            team: teamFilter === DEFAULT_FILTER ? null : teamFilter,
            search: debouncedSearch,
          },
          controller.signal,
        );

        setNews(result.news);
        setHasMore(result.hasMore);
        setError(result.error);
        setCachedNewsSnapshot({
          news: result.news,
          error: result.error,
          hasMore: result.hasMore,
          page: result.page,
          search: debouncedSearch,
          teamFilter,
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
        setHasMore(false);
        setError("Error conectando con API");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadFirstPage();

    return () => {
      controller.abort();
    };
  }, [debouncedSearch, teamFilter]);

  const teamOptions = useMemo(() => {
    const options: string[] = [...PREMIER_TEAM_OPTIONS];

    if (teamFilter !== DEFAULT_FILTER && !options.some((option) => option === teamFilter)) {
      options.push(teamFilter);
    }

    return [DEFAULT_FILTER, ...options];
  }, [teamFilter]);

  const openNews = (item: NewsItem) => {
    navigate(`/noticias/${item.id}`);
  };

  const handleLoadMore = async (): Promise<void> => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      setError(null);

      const result = await fetchNews({
        offset: news.length,
        limit: LOAD_MORE_NEWS_LIMIT,
        team: teamFilter === DEFAULT_FILTER ? null : teamFilter,
        search: debouncedSearch,
      });

      const mergedNews = mergeNewsItems(news, result.news);
      const nextHasMore = result.news.length > 0 ? result.hasMore : false;

      setNews(mergedNews);
      setHasMore(nextHasMore);
      setError(result.error);
      setCachedNewsSnapshot({
        news: mergedNews,
        error: result.error,
        hasMore: nextHasMore,
        page: result.page,
        search: debouncedSearch,
        teamFilter,
      });
    } catch (requestError) {
      console.error(requestError);
      setError("Error cargando mas noticias desde la API");
    } finally {
      setLoadingMore(false);
    }
  };

  const featuredNews = news[0] ?? null;
  const gridNews = news.slice(1);
  const completeGridCount =
    gridNews.length >= 3 ? gridNews.length - (gridNews.length % 3) : gridNews.length;
  const visibleGridNews = gridNews.slice(0, completeGridCount);

  if (loading) {
    return (
      <div className="noticias-page">
        <p className="noticias-status">
          Cargando noticias de la Premier League...
        </p>
      </div>
    );
  }

  return (
    <div className="noticias-page">
      <div className="noticias-page-header">
        <div>
          <p className="noticias-eyebrow">Noticias</p>
          <h2 className="noticias-page-title">
            Mantente al día con la Premier League
          </h2>
        </div>
      </div>

      <div className="noticias-toolbar">
        <label className="noticias-filter-field">
          <span className="noticias-filter-label">Filtrar por equipo</span>
          <select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="noticias-select"
          >
            {teamOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>

        <label className="noticias-filter-field noticias-filter-field--search">
          <span className="noticias-filter-label">Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por titular, equipo, o fuente"
            className="noticias-search"
          />
        </label>
      </div>

      {error && <div className="noticias-warning">{error}</div>}

      {featuredNews ? (
        <>
          <button
            type="button"
            className="noticias-featured-card"
            onClick={() => openNews(featuredNews)}
          >
            <NewsImage
              image={featuredNews.image}
              alt={featuredNews.title}
              className="noticias-featured-card__image"
              fallbackClassName="noticias-featured-card__fallback"
            />

            <div className="noticias-featured-card__content">
              <div className="noticias-featured-card__topline">
                <TeamBadge team={featuredNews.primaryTeam} />
                <span className="noticias-featured-card__time">
                  {formatRelative(featuredNews.publishedAt)}
                </span>
              </div>

              <p className="noticias-featured-card__source">
                {featuredNews.source}
              </p>
              <h3 className="noticias-featured-card__title">
                {featuredNews.title}
              </h3>
              <p className="noticias-featured-card__dek">
                {featuredNews.summary}
              </p>
              <p className="noticias-featured-card__summary">
                {truncateText(featuredNews.content, 320)}
              </p>

              <div className="noticias-featured-card__footer">
                <span>{featuredNews.readTime} min de lectura</span>
                <span className="noticias-featured-card__cta">Leer nota</span>
              </div>
            </div>
          </button>

          {visibleGridNews.length > 0 && (
            <div className="noticias-grid">
              {visibleGridNews.map((item) => (
                <NewsCard key={item.id} item={item} onOpen={openNews} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="noticias-load-more-wrap">
              <button
                type="button"
                className="noticias-load-more"
                onClick={() => void handleLoadMore()}
                disabled={loadingMore}
              >
                {loadingMore ? "Cargando..." : "Cargar mas"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="noticias-empty">
          No se encontraron noticias para ese equipo con los filtros actuales.
        </div>
      )}
    </div>
  );
}
