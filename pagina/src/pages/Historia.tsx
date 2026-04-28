<<<<<<< Updated upstream
import { useEffect, useState } from "react";
import styles from "./Historia.module.css";

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================
// Types
// ============================================================
=======
import { useEffect, useState, useRef } from "react";
import styles from "../estilos/historia.module.css";

const API_URL = import.meta.env.VITE_API_URL;

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
// ============================================================
// Historia
// ============================================================
=======
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

    // Recalcular cuando cualquier imagen del wrapper termine de cargar
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
>>>>>>> Stashed changes
export default function Historia() {
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ApiTeam | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
<<<<<<< Updated upstream

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [teamsError, setTeamsError] = useState("");
  const [eventsError, setEventsError] = useState("");

  // Carga equipos desde el backend (API-Football)
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        setTeamsError("");
        const res = await fetch(`${API_URL}/api/historia/equipos`);
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTeams(json.data);
        } else {
          setTeamsError("No se pudieron cargar los equipos.");
        }
      } catch (e: any) {
        setTeamsError(e.message || "Error al cargar equipos.");
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  // Al seleccionar un equipo, carga su timeline desde el backend
=======
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

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    try {
      const res = await fetch(`${API_URL}/api/historia/timeline/${team.id}`);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEvents(json.data);
      } else {
        setEventsError("No se pudo cargar el timeline.");
      }
    } catch (e: any) {
      setEventsError(e.message || "Error al cargar el timeline.");
    } finally {
      setLoadingEvents(false);
    }
=======
    // Scroll suave hacia el header del equipo
    setTimeout(() => {
      teamHeaderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    fetch(`${API_URL}/api/historia/timeline/${team.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEvents(data.data);
        else setEventsError("No se pudo cargar el timeline.");
      })
      .catch(() => setEventsError("Error de conexión."))
      .finally(() => setLoadingEvents(false));
>>>>>>> Stashed changes
  };

  return (
    <div className={styles.root}>

<<<<<<< Updated upstream
      {/* HERO */}
      <div className={styles.hero}>
        <p className={styles.heroAccent}>Premier League</p>
        <h1 className={styles.heroTitle}>Historia</h1>
        <p className={styles.heroSub}>
          Descubre más sobre tus clubes favoritos, explora su historia con nosotros.
        </p>
      </div>

      {/* SELECTOR DE LOGOS */}
      <div className={styles.panel}>
        <p className={styles.sectionLabel}>Selecciona un equipo</p>
        {loadingTeams ? (
          <p className={styles.empty}>Cargando equipos...</p>
=======
      <section className={styles.pageHeading}>
        <h1 className={styles.pageTitle}>Historia</h1>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Selecciona un equipo</span>
        </div>

        {loadingTeams ? (
          <p className={styles.loading}>Cargando equipos...</p>
>>>>>>> Stashed changes
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
                  className={`${styles.logoCard} ${isSelected ? styles.selected : ""}`}
                >
                  <img src={team.logo} alt={team.name} className={styles.logoImg} />
                  <span className={`${styles.logoName} ${isSelected ? styles.selected : ""}`}>
                    {team.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
<<<<<<< Updated upstream
      </div>

      {/* DETALLE EQUIPO SELECCIONADO */}
      {selectedTeam && (
        <>
          {/* Header */}
          <div className={styles.teamHeader}>
            <img
              src={selectedTeam.logo}
              alt={selectedTeam.name}
              className={styles.teamHeaderLogo}
            />
            <div>
              <h2 className={styles.teamHeaderName}>{selectedTeam.name}</h2>
              <div className={styles.teamHeaderMeta}>
                {selectedTeam.founded && (
                  <span className={styles.metaChip}>Fundado en {selectedTeam.founded}</span>
                )}
                {selectedTeam.venue && (
                  <span className={styles.metaChip}>{selectedTeam.venue}</span>
                )}
                {selectedTeam.country && (
                  <span className={styles.metaChip}>{selectedTeam.country}</span>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className={styles.panel}>
            <p className={styles.sectionLabel}>Historia del club</p>

            {loadingEvents ? (
              <p className={styles.empty}>Cargando timeline...</p>
=======
      </section>

      {selectedTeam && (
        <>
          <section ref={teamHeaderRef} className={styles.teamHeader}>
            <div className={styles.teamMainInfo}>
              <img src={selectedTeam.logo} alt={selectedTeam.name} className={styles.teamHeaderLogo} />
              <h2 className={styles.teamHeaderName}>{selectedTeam.name}</h2>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Historia del club</span>
            </div>

            {loadingEvents ? (
              <p className={styles.loading}>Cargando historia...</p>
>>>>>>> Stashed changes
            ) : eventsError ? (
              <p className={styles.error}>{eventsError}</p>
            ) : events.length === 0 ? (
              <p className={styles.empty}>
                Aún no hay eventos registrados para este equipo.
              </p>
            ) : (
<<<<<<< Updated upstream
              <div className={styles.timelineWrapper}>
                <div className={styles.timelineLine} />
                {events.map((event, index) => (
                  <TimelineRow
                    key={event.id}
                    event={event}
                    isLeft={index % 2 === 0}
                  />
                ))}
              </div>
            )}
          </div>
=======
              <TimelineList events={events} />
            )}
          </section>
>>>>>>> Stashed changes
        </>
      )}
    </div>
  );
}

<<<<<<< Updated upstream
// ============================================================
// TimelineRow
// ============================================================
function TimelineRow({
  event,
  isLeft,
}: {
  event: TimelineEvent;
  isLeft: boolean;
}) {
  const textBlock = (
    <div className={isLeft ? styles.textLeft : styles.textRight}>
      <span className={styles.eventYear}>{event.year}</span>
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <span className={styles.imgPlaceholder}>{event.year}</span>
=======
        <div className={styles.imgPlaceholder}>
          <span>{event.year}</span>
        </div>
>>>>>>> Stashed changes
      )}
    </div>
  );

  return (
<<<<<<< Updated upstream
    <div className={styles.timelineRow}>
      <div>{isLeft ? textBlock : imgBlock}</div>

      <div className={styles.timelineDot}>
        <div className={styles.dotCircle}>
=======
    <article
      ref={ref}
      className={`
        ${styles.timelineRow}
        ${isLeft ? styles.rowLeft : styles.rowRight}
        ${visible ? styles.visible : styles.hidden}
      `}
    >
      <div className={styles.cardHalf}>
        {isLeft ? imgBlock : textBlock}
      </div>

      <div className={styles.timelineDot}>
        <div ref={dotRef} className={styles.dotCircle}>
>>>>>>> Stashed changes
          <span className={styles.dotYear}>{String(event.year).slice(2)}</span>
        </div>
      </div>

<<<<<<< Updated upstream
      <div>{isLeft ? imgBlock : textBlock}</div>
    </div>
  );
}
=======
      <div className={styles.cardHalf}>
        {isLeft ? textBlock : imgBlock}
      </div>
    </article>
  );
}
>>>>>>> Stashed changes
