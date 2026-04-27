import { useEffect, useState } from "react";
import styles from "./Historia.module.css";

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================
// Types
// ============================================================
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

// ============================================================
// Historia
// ============================================================
export default function Historia() {
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ApiTeam | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

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
  };

  return (
    <div className={styles.root}>

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
            ) : eventsError ? (
              <p className={styles.error}>{eventsError}</p>
            ) : events.length === 0 ? (
              <p className={styles.empty}>
                Aún no hay eventos registrados para este equipo.
              </p>
            ) : (
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
        </>
      )}
    </div>
  );
}

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
        <span className={styles.imgPlaceholder}>{event.year}</span>
      )}
    </div>
  );

  return (
    <div className={styles.timelineRow}>
      <div>{isLeft ? textBlock : imgBlock}</div>

      <div className={styles.timelineDot}>
        <div className={styles.dotCircle}>
          <span className={styles.dotYear}>{String(event.year).slice(2)}</span>
        </div>
      </div>

      <div>{isLeft ? imgBlock : textBlock}</div>
    </div>
  );
}