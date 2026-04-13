import { useState, useEffect } from "react";
import "../estilos/Partido.css";

export interface LiveMatch {
  id: number;
  league: string;
  minute: string;
  stadium: string;
  status: string;
  homeTeam: {
    name: string;
    logo: string;
    score: number;
  };
  awayTeam: {
    name: string;
    logo: string;
    score: number;
  };
}

interface PartidosVivoProps {
  match: LiveMatch;
  onBack: () => void;
}

export default function PartidosVivo({ match, onBack }: PartidosVivoProps) {
  return (
    <div className="partido-vivo">
      <button type="button" className="partido-vivo_back" onClick={onBack}>
        ← Volver
      </button>

      <div className="partido-vivo_card">
        <div className="partido-vivo_top">
          <span className="partido-vivo_badge">EN VIVO</span>
          <span className="partido-vivo_minute">{match.minute}</span>
        </div>

        <p className="partido-vivo_league">{match.league}</p>

        <div className="partido-vivo_scoreboard">
          <div className="partido-vivo_team">
            <img
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              className="partido-vivo_logo"
            />
            <span className="partido-vivo_team-name">{match.homeTeam.name}</span>
          </div>

          <div className="partido-vivo_score">
            <span>{match.homeTeam.score}</span>
            <span className="partido-vivo_score-separator">-</span>
            <span>{match.awayTeam.score}</span>
          </div>

          <div className="partido-vivo_team">
            <img
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              className="partido-vivo_logo"
            />
            <span className="partido-vivo_team-name">{match.awayTeam.name}</span>
          </div>
        </div>

        <div className="partido-vivo_info">
          <p>
            <strong>Estadio:</strong> {match.stadium}
          </p>
          <p>
            <strong>Estado:</strong> {match.status}
          </p>
        </div>
      </div>
    </div>
  );
}