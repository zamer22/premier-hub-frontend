import { useState, useEffect } from "react";
import "../estilos/Partido.css";
import PartidosVivo, { type LiveMatch } from "./PartidosVivo";

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
  form?: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  goalsDiff: number;
}

const LIVE_MATCHES_MOCK: LiveMatch[] = [
  {
    id: 1,
    league: "Premier League",
    minute: "67'",
    stadium: "Anfield",
    status: "Segundo tiempo",
    homeTeam: {
      name: "Liverpool",
      logo: "https://media.api-sports.io/football/teams/40.png",
      score: 2,
    },
    awayTeam: {
      name: "Chelsea",
      logo: "https://media.api-sports.io/football/teams/49.png",
      score: 1,
    },
  },
  {
    id: 2,
    league: "Premier League",
    minute: "34'",
    stadium: "Emirates Stadium",
    status: "Primer tiempo",
    homeTeam: {
      name: "Arsenal",
      logo: "https://media.api-sports.io/football/teams/42.png",
      score: 1,
    },
    awayTeam: {
      name: "Tottenham",
      logo: "https://media.api-sports.io/football/teams/47.png",
      score: 0,
    },
  },
];

export default function Partido() {
  const [proximos, setProximos] = useState<ApiMatch[]>([]);
  const [resultados, setResultados] = useState<ApiMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLiveMatch, setSelectedLiveMatch] = useState<LiveMatch | null>(null);
  const enVivo = LIVE_MATCHES_MOCK;

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

  const renderLastFive = (form?: string) => {
    if (!form) return <span className="partido_form-empty">-</span>;

    const results = form.slice(-5).split("");

    return (
      <div className="partido_form">
        {results.map((result, index) => {
          let className = "partido_form-badge partido_form-badge--neutral";
          let symbol = "•";
          let label = "Sin dato";

          if (result === "W") {
            className = "partido_form-badge partido_form-badge--win";
            symbol = "✓";
            label = "Victoria";
          } else if (result === "D") {
            className = "partido_form-badge partido_form-badge--draw";
            symbol = "–";
            label = "Empate";
          } else if (result === "L") {
            className = "partido_form-badge partido_form-badge--loss";
            symbol = "✕";
            label = "Derrota";
          }

          return (
            <span key={`${result}-${index}`} className={className} title={label}>
              {symbol}
            </span>
          );
        })}
      </div>
    );
  };

  const MatchCard = ({ m }: { m: ApiMatch }) => (
    <div className="partido_match-card">
      <div className="partido_match-side">
        <img src={m.teams.home.logo} alt={m.teams.home.name} className="partido_team-logo" />
        <span className="partido_match-team">{m.teams.home.name}</span>
      </div>

      <div className="partido_match-score">
        {m.goals.home !== null ? `${m.goals.home} - ${m.goals.away}` : "vs"}
      </div>

      <div className="partido_match-side partido_match-side--away">
        <span className="partido_match-team">{m.teams.away.name}</span>
        <img src={m.teams.away.logo} alt={m.teams.away.name} className="partido_team-logo" />
      </div>
    </div>
  );

  if (selectedLiveMatch) {
    return (
      <PartidosVivo
        match={selectedLiveMatch}
        onBack={() => setSelectedLiveMatch(null)}
      />
    );
  }

  if (loading) return <p className="partido_loading">Cargando datos...</p>;
  if (error) return <p className="partido_error">{error}</p>;

  return (
    <div className="partido">
      <div className="partido_standings">
        <div className="partido_section-header">
          <div className="partido_accent" />
          <h2 className="partido_title">Tabla de Posiciones</h2>
        </div>

        {standings.length > 0 ? (
          <div className="partido_table-wrapper">
            <table className="partido_table">
              <thead>
                <tr className="partido_table-head-row">
                  {["#", "Equipo", "PJ", "G", "E", "P", "GF", "GC", "DG", "Últimos 5", "Pts"].map(
                    (h) => (
                      <th
                        key={h}
                        className={h === "Últimos 5" ? "partido_th partido_th--form" : "partido_th"}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr
                    key={s.rank}
                    className={i % 2 === 0 ? "partido_tr--even" : "partido_tr--odd"}
                  >
                    <td className="partido_td partido_td--rank">{s.rank}</td>

                    <td className="partido_td">
                      <div className="partido_team-cell">
                        <img
                          src={s.team.logo}
                          alt={s.team.name}
                          className="partido_team-logo--small"
                        />
                        <span className="partido_team-name">{s.team.name}</span>
                      </div>
                    </td>

                    <td className="partido_td">{s.all.played}</td>
                    <td className="partido_td">{s.all.win}</td>
                    <td className="partido_td">{s.all.draw}</td>
                    <td className="partido_td">{s.all.lose}</td>
                    <td className="partido_td">{s.all.goals.for}</td>
                    <td className="partido_td">{s.all.goals.against}</td>

                    <td
                      className={`partido_td ${s.goalsDiff > 0
                          ? "partido_goal-diff--positive"
                          : s.goalsDiff < 0
                            ? "partido_goal-diff--negative"
                            : "partido_goal-diff--neutral"
                        }`}
                    >
                      {s.goalsDiff > 0 ? "+" : ""}
                      {s.goalsDiff}
                    </td>

                    <td className="partido_td partido_td--form">
                      {renderLastFive(s.form)}
                    </td>

                    <td className="partido_td partido_points">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="partido_empty partido_empty--center">Sin datos de posiciones</p>
        )}
      </div>

      <div className="partido_live-section">
        <div className="partido_section-header partido_section-header--small">
          <div className="partido_accent" />
          <h3 className="partido_subtitle">Partidos en Vivo</h3>
        </div>

        {enVivo.length === 0 && (
          <p className="partido_empty">No hay partidos en vivo</p>
        )}

        <div className="partido_live-list">
          {enVivo.map((m) => (
            <button
              key={m.id}
              type="button"
              className="partido_live-card"
              onClick={() => setSelectedLiveMatch(m)}
            >
              <div className="partido_live-card-top">
                <span className="partido_live-badge">EN VIVO</span>
                <span className="partido_live-minute">{m.minute}</span>
              </div>

              <p className="partido_live-league">{m.league}</p>

              <div className="partido_live-card-match">
                <div className="partido_live-team">
                  <img
                    src={m.homeTeam.logo}
                    alt={m.homeTeam.name}
                    className="partido_live-team-logo"
                  />
                  <span>{m.homeTeam.name}</span>
                </div>

                <div className="partido_live-score">
                  {m.homeTeam.score} - {m.awayTeam.score}
                </div>

                <div className="partido_live-team">
                  <img
                    src={m.awayTeam.logo}
                    alt={m.awayTeam.name}
                    className="partido_live-team-logo"
                  />
                  <span>{m.awayTeam.name}</span>
                </div>
              </div>

              <p className="partido_live-stadium">{m.stadium}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="partido_section-header partido_section-header--small">
          <div className="partido_accent" />
          <h3 className="partido_subtitle">Proximos Partidos</h3>
        </div>

        {proximos.length === 0 && <p className="partido_empty">Sin proximos partidos</p>}

        {proximos.map((m) => (
          <div key={m.fixture.id}>
            <p className="partido_match-date">{formatDate(m.fixture.date)}</p>
            <MatchCard m={m} />
          </div>
        ))}
      </div>

      <div>
        <div className="partido_section-header partido_section-header--small">
          <div className="partido_accent" />
          <h3 className="partido_subtitle">Resultados Recientes</h3>
        </div>

        {resultados.length === 0 && <p className="partido_empty">Sin resultados recientes</p>}

        {resultados.map((m) => (
          <div key={m.fixture.id}>
            <p className="partido_match-date">{formatDate(m.fixture.date)}</p>
            <MatchCard m={m} />
          </div>
        ))}
      </div>
    </div>
  );
}