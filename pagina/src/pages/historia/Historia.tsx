import { useEffect, useState, useRef } from "react";
import styles from "./historia.module.css";
import { PageHeader } from "../../components/ui";

const API_URL = import.meta.env.VITE_API_URL;

interface ApiTeam {
  id: number;
  name: string;
  logo: string;
  code: string;
  country: string;
  founded: number;
  venue: string;
}

interface TimelineEvent {
  id: string;
  team_id: number;
  year: number;
  title: string;
  description: string | null;
  image_url: string | null;
  order: number;
}

// ── Wrapper con línea calculada via JS ──────────────────────────────────────
function TimelineList({ events }: { events: TimelineEvent[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const firstDotRef = useRef<HTMLDivElement>(null);
  const lastDotRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateLine() {
      const wrapper = wrapperRef.current;
      const firstDot = firstDotRef.current;
      const lastDot = lastDotRef.current;
      const line = lineRef.current;
      if (!wrapper || !firstDot || !lastDot || !line) return;

      const wrapperRect = wrapper.getBoundingClientRect();
      const firstRect = firstDot.getBoundingClientRect();
      const lastRect = lastDot.getBoundingClientRect();

      const top = firstRect.top + firstRect.height / 2 - wrapperRect.top;
      const bottom = lastRect.top + lastRect.height / 2 - wrapperRect.top;

      line.style.top = `${top}px`;
      line.style.height = `${bottom - top}px`;
    }

    const timer = setTimeout(updateLine, 50);
    window.addEventListener("resize", updateLine);

    const imgs = wrapperRef.current?.querySelectorAll("img") ?? [];
    imgs.forEach((img) => img.addEventListener("load", updateLine));

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateLine);
      imgs.forEach((img) => img.removeEventListener("load", updateLine));
    };
  }, [events]);

  return (
    <div ref={wrapperRef} className={styles.timelineWrapper}>
      <div ref={lineRef} className={styles.timelineLine} />

      {events.map((event, index) => (
        <TimelineRow
          key={event.id}
          event={event}
          isLeft={index % 2 === 0}
          dotRef={
            index === 0
              ? firstDotRef
              : index === events.length - 1
              ? lastDotRef
              : undefined
          }
        />
      ))}
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function Historia() {
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ApiTeam | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const teamHeaderRef = useRef<HTMLElement>(null);

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [teamsError, setTeamsError] = useState("");
  const [eventsError, setEventsError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/historia/equipos`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTeams(data.data);
        else setTeamsError("No se pudieron cargar los equipos.");
      })
      .catch(() => setTeamsError("Error de conexión."))
      .finally(() => setLoadingTeams(false));
  }, []);

  const handleSelectTeam = async (team: ApiTeam) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
      setEvents([]);
      return;
    }

    setSelectedTeam(team);
    setLoadingEvents(true);
    setEventsError("");
    setEvents([]);

    setTimeout(() => {
      teamHeaderRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);

    fetch(`${API_URL}/api/historia/timeline/${team.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEvents(data.data);
        else setEventsError("No se pudo cargar el timeline.");
      })
      .catch(() => setEventsError("Error de conexión."))
      .finally(() => setLoadingEvents(false));
  };

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Archivo histórico"
        title="Historia"
        subtitle="Explora equipos, escudos y momentos clave con una línea de tiempo visual."
      />

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Selecciona un equipo</span>
        </div>

        {loadingTeams ? (
          <p className={styles.loading}>Cargando equipos...</p>
        ) : teamsError ? (
          <p className={styles.error}>{teamsError}</p>
        ) : (
          <div className={styles.logosRow}>
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => handleSelectTeam(team)}
                  className={`${styles.logoCard} ${
                    isSelected ? styles.selected : ""
                  }`}
                >
                  <img
                    src={team.logo}
                    alt={team.name}
                    className={styles.logoImg}
                  />

                  <span
                    className={`${styles.logoName} ${
                      isSelected ? styles.selected : ""
                    }`}
                  >
                    {team.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedTeam && (
        <>
          <section ref={teamHeaderRef} className={styles.teamHeader}>
            <div className={styles.teamMainInfo}>
              <img
                src={selectedTeam.logo}
                alt={selectedTeam.name}
                className={styles.teamHeaderLogo}
              />

              <h2 className={styles.teamHeaderName}>{selectedTeam.name}</h2>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Historia del club</span>
            </div>

            {loadingEvents ? (
              <p className={styles.loading}>Cargando historia...</p>
            ) : eventsError ? (
              <p className={styles.error}>{eventsError}</p>
            ) : events.length === 0 ? (
              <p className={styles.empty}>
                Aún no hay eventos registrados para este equipo.
              </p>
            ) : (
              <TimelineList events={events} />
            )}
          </section>
        </>
      )}

{/* Botón volver arriba */}
<button
  type="button"
  onClick={() => {
    const start = window.scrollY;
    const duration = 900;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      window.scrollTo(0, start * (1 - easedProgress));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }}
  className={styles.scrollTopButton}
>
  Regresar
</button>
    </div>
  );
}

// ── Row individual ──────────────────────────────────────────────────────────
function TimelineRow({
  event,
  isLeft,
  dotRef,
}: {
  event: TimelineEvent;
  isLeft: boolean;
  dotRef?: React.RefObject<HTMLDivElement>;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const textBlock = (
    <div className={styles.textBlock} data-year={event.year}>
      <h3 className={styles.eventTitle}>{event.title}</h3>

      {event.description && (
        <p className={styles.eventDesc}>{event.description}</p>
      )}
    </div>
  );

  const imgBlock = (
    <div className={styles.imgBlock}>
      {event.image_url ? (
        <img src={event.image_url} alt={event.title} className={styles.imgEl} />
      ) : (
        <div className={styles.imgPlaceholder}>
          <span>{event.year}</span>
        </div>
      )}
    </div>
  );

  return (
    <article
      ref={ref}
      className={`
        ${styles.timelineRow}
        ${isLeft ? styles.rowLeft : styles.rowRight}
        ${visible ? styles.visible : styles.hidden}
      `}
    >
      <div className={styles.cardHalf}>{isLeft ? imgBlock : textBlock}</div>

      <div className={styles.timelineDot}>
        <div ref={dotRef} className={styles.dotCircle}>
          <span className={styles.dotYear}>{String(event.year).slice(2)}</span>
        </div>
      </div>

      <div className={styles.cardHalf}>{isLeft ? textBlock : imgBlock}</div>
    </article>
  );
}
