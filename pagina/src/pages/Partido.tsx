import { useState, useEffect } from "react";
import "../estilos/Partido.css";

const API_URL: string = "http://localhost:4000";

interface ApiMatch {
  fixture: { id: number; date: string; status: { short: string; long: string } };
  league: { round: string };
  teams: { home: { name: string; logo: string }; away: { name: string; logo: string } };
  goals: { home: number | null; away: number | null };
}

interface Standing {
  rank: number;
  team: { name: string; logo: string };
  points: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  goalsDiff: number;
}

export default function Partido() {
  const [proximos, setProximos] = useState<ApiMatch[]>([]);
  const [resultados, setResultados] = useState<ApiMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, r, s] = await Promise.all([
          fetch(`${API_URL}/api/partidos/proximos`).then((r) => r.json()),
          fetch(`${API_URL}/api/partidos/resultados`).then((r) => r.json()),
          fetch(`${API_URL}/api/partidos/standings`).then((r) => r.json()),
        ]);

        if (p.success) setProximos(p.data.slice(0, 5));
        if (r.success) setResultados(r.data.slice(0, 5));
        if (s.success && Array.isArray(s.data)) setStandings(s.data);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(`Error cargando datos: ${err instanceof Error ? err.message : String(err)}`);
      }
      setLoading(false);
    };

    load();
  }, []);

  const formatDate = (d: string): string => {
    const date = new Date(d);
    return date.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const MatchCard = ({ m }: { m: ApiMatch }) => (
    <div className="partido__match-card">
      <div className="partido__match-side">
        <img src={m.teams.home.logo} alt={m.teams.home.name} className="partido__team-logo" />
        <span className="partido__match-team">{m.teams.home.name}</span>
      </div>

      <div className="partido__match-score">
        {m.goals.home !== null ? `${m.goals.home} - ${m.goals.away}` : "vs"}
      </div>

      <div className="partido__match-side partido__match-side--away">
        <span className="partido__match-team">{m.teams.away.name}</span>
        <img src={m.teams.away.logo} alt={m.teams.away.name} className="partido__team-logo" />
      </div>
    </div>
  );

  if (loading) return <p className="partido__loading">Cargando datos de la Premier League...</p>;
  if (error) return <p className="partido__error">{error}</p>;

  return (
    <div className="partido">
      <div className="partido__standings">
        <div className="partido__section-header">
          <div className="partido__accent" />
          <h2 className="partido__title">Tabla de Posiciones</h2>
        </div>

        {standings.length > 0 ? (
          <div className="partido__table-wrapper">
            <table className="partido__table">
              <thead>
                <tr className="partido__table-head-row">
                  {["#", "Equipo", "PJ", "G", "E", "P", "GF", "GC", "DG", "Pts"].map((h) => (
                    <th key={h} className="partido__th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 10).map((s, i) => (
                  <tr
                    key={s.rank}
                    className={i % 2 === 0 ? "partido__tr--even" : "partido__tr--odd"}
                  >
                    <td className="partido__td partido__td--rank">{s.rank}</td>

                    <td className="partido__team-cell">
                      <img
                        src={s.team.logo}
                        alt={s.team.name}
                        className="partido__team-logo--small"
                      />
                      <span className="partido__team-name">{s.team.name}</span>
                    </td>

                    <td className="partido__td">{s.all.played}</td>
                    <td className="partido__td">{s.all.win}</td>
                    <td className="partido__td">{s.all.draw}</td>
                    <td className="partido__td">{s.all.lose}</td>
                    <td className="partido__td">{s.all.goals.for}</td>
                    <td className="partido__td">{s.all.goals.against}</td>

                    <td
                      className={`partido__td ${
                        s.goalsDiff > 0
                          ? "partido__goal-diff--positive"
                          : s.goalsDiff < 0
                          ? "partido__goal-diff--negative"
                          : "partido__goal-diff--neutral"
                      }`}
                    >
                      {s.goalsDiff > 0 ? "+" : ""}
                      {s.goalsDiff}
                    </td>

                    <td className="partido__td partido__points">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="partido__empty partido__empty--center">Sin datos de posiciones</p>
        )}
      </div>

      <div>
        <div className="partido__section-header partido__section-header--small">
          <div className="partido__accent" />
          <h3 className="partido__subtitle">Proximos Partidos</h3>
        </div>

        {proximos.length === 0 && <p className="partido__empty">Sin proximos partidos</p>}

        {proximos.map((m) => (
          <div key={m.fixture.id}>
            <p className="partido__match-date">{formatDate(m.fixture.date)}</p>
            <MatchCard m={m} />
          </div>
        ))}
      </div>

      <div>
        <div className="partido__section-header partido__section-header--small">
          <div className="partido__accent" />
          <h3 className="partido__subtitle">Resultados Recientes</h3>
        </div>

        {resultados.length === 0 && <p className="partido__empty">Sin resultados recientes</p>}

        {resultados.map((m) => (
          <div key={m.fixture.id}>
            <p className="partido__match-date">{formatDate(m.fixture.date)}</p>
            <MatchCard m={m} />
          </div>
        ))}
      </div>
    </div>
  );
}