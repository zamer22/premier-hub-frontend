import { useEffect, useMemo, useState } from "react";
import "../estilos/EstiloNoticiasLanding.css";
import {
  DEFAULT_FILTER,
  NewsItem,
  fetchNews,
  formatRelative,
  navigateTo,
  truncateText,
} from "./noticiasShared";

const GRID_BATCH_SIZE = 3;


// Componente para mostrar la imagen de la noticia, con un fallback si no hay imagen disponible
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


// Componente para mostrar el badge del equipo asociado a la noticia, o un valor por defecto si no hay equipo asociado
function TeamBadge({ team }: { team: string | null }) {
  return (
    <span className="noticias-team-badge">{team || "Premier League"}</span>
  );
}


// Componente de noticia, con su imagen, título, fuente y tiempo de lectura
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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState(DEFAULT_FILTER);
  const [visibleGridCount, setVisibleGridCount] = useState(GRID_BATCH_SIZE);

  useEffect(() => {
    const controller = new AbortController();

    const loadNews = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchNews(controller.signal);
        setNews(result.news);
        setError(result.error);
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

  const teamOptions = useMemo(() => {
    const uniqueTeams = Array.from(
      new Set(news.flatMap((item) => item.teams)),
    ).sort((left, right) => left.localeCompare(right, "es-MX"));

    return [DEFAULT_FILTER, ...uniqueTeams];
  }, [news]);

  useEffect(() => {
    if (teamFilter !== DEFAULT_FILTER && !teamOptions.includes(teamFilter)) {
      setTeamFilter(DEFAULT_FILTER);
    }
  }, [teamFilter, teamOptions]);

  useEffect(() => {
    setVisibleGridCount(GRID_BATCH_SIZE);
  }, [search, teamFilter]);

  const filteredNews = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return news.filter((item) => {
      const matchesTeam =
        teamFilter === DEFAULT_FILTER || item.teams.includes(teamFilter);
      const haystack = [
        item.title,
        item.headline,
        item.summary,
        item.content,
        item.source,
        item.teams.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchTerm.length === 0 || haystack.includes(searchTerm);

      return matchesTeam && matchesSearch;
    });
  }, [news, search, teamFilter]);

  const featuredNews = filteredNews[0] ?? null;
  const gridNews = filteredNews.slice(1);
  const visibleGridNews = gridNews.slice(0, visibleGridCount);
  const hasMoreGridNews = visibleGridNews.length < gridNews.length;

  const openNews = (item: NewsItem) => {
    navigateTo(`/noticias/${item.id}`);
  };

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

          {gridNews.length > 0 && (
            <>
              <div className="noticias-grid">
                {visibleGridNews.map((item) => (
                  <NewsCard key={item.id} item={item} onOpen={openNews} />
                ))}
              </div>

              {hasMoreGridNews && (
                <div className="noticias-load-more-wrap">
                  <button
                    type="button"
                    className="noticias-load-more"
                    onClick={() =>
                      setVisibleGridCount((current) => current + GRID_BATCH_SIZE)
                    }
                  >
                    Cargar mas
                  </button>
                </div>
              )}
            </>
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
