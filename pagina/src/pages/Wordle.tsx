import { useEffect, useRef, useState } from "react";
import "../estilos/Wordle.css";

interface Player {
  id: string;
  name: string;
  initials: string;
  image?: string | null;
  stat: number;
  correctRank: number;
}

interface Attempt {
  score: number;
  dinero_ganado: number;
  submitted_order?: string[];
  created_at?: string;
}

interface DailyResponse {
  success: boolean;
  error?: string;
  data?: {
    challenge_id: string;
    scheduled_date: string;
    theme: string;
    metric_label: string;
    players: Player[];
    played: boolean;
    attempt: Attempt | null;
  };
}

interface SubmitResponse {
  success: boolean;
  error?: string;
  data?: Attempt;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const BOARD_ROWS = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
];

function calculateCorrectCount(players: Player[]): number {
  return players.reduce((total, player, index) => {
    return total + (index + 1 === player.correctRank ? 1 : 0);
  }, 0);
}

interface CardProps {
  player: Player;
  posIndex: number;
  submitted: boolean;
  isDragging: boolean;
  isDragTarget: boolean;
  metricLabel: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function PlayerCard({
  player,
  posIndex,
  submitted,
  isDragging,
  isDragTarget,
  metricLabel,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CardProps) {
  const [imgError, setImgError] = useState(false);
  const isCorrect = submitted && posIndex + 1 === player.correctRank;

  const cardClasses = [
    "wordle-card",
    !submitted ? "wordle-card--default" : isCorrect ? "wordle-card--correct" : "wordle-card--wrong",
    submitted ? "wordle-card--submitted" : "",
    isDragging ? "wordle-card--dragging" : "",
    isDragTarget ? "wordle-card--drag-target" : "",
  ].filter(Boolean).join(" ");

  const imgWrapClasses = `wordle-img-wrap${submitted ? " wordle-img-wrap--submitted" : ""}`;
  const resultBarClasses = `wordle-result-bar ${isCorrect ? "wordle-result-bar--correct" : "wordle-result-bar--wrong"}`;

  return (
    <div
      draggable={!submitted}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cardClasses}
    >
      <span className="wordle-card-rank">{posIndex + 1}</span>

      <div className={imgWrapClasses}>
        {player.image && !imgError ? (
          <img
            src={player.image}
            alt={player.name}
            onError={() => setImgError(true)}
            className="wordle-card-img"
          />
        ) : (
          <span className="wordle-card-initials">{player.initials}</span>
        )}
      </div>

      <div className="wordle-card-bottom">
        {submitted && (
          <div className={resultBarClasses}>
            <span className="wordle-result-icon">{isCorrect ? "✓" : "✗"}</span>
            <span className="wordle-result-stat">{player.stat}</span>
            <span className="wordle-result-label">{metricLabel}</span>
          </div>
        )}
        <div className="wordle-card-name-bar">
          <span className="wordle-card-name">{player.name}</span>
        </div>
      </div>
    </div>
  );
}

export default function Wordle() {
  const [order, setOrder] = useState<Player[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [draggingPos, setDraggingPos] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<number | null>(null);
  const [theme, setTheme] = useState("");
  const [metricLabel, setMetricLabel] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const dragPosRef = useRef<number | null>(null);

  useEffect(() => {
    const loadDaily = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await fetch(`${API_URL}/api/wordle/daily`, {
          credentials: "include",
        });

        const json: DailyResponse = await res.json();

        if (!res.ok || !json.success || !json.data) {
          setErrorMsg(json.error || "No se pudo cargar el desafio");
          return;
        }

        setChallengeId(json.data.challenge_id);
        setTheme(json.data.theme);
        setMetricLabel(json.data.metric_label);
        setSubmitted(json.data.played);

        if (json.data.played && json.data.attempt?.submitted_order?.length) {
          const byId = new Map(json.data.players.map((p) => [p.id, p]));
          const restored = json.data.attempt.submitted_order
            .map((id) => byId.get(id))
            .filter(Boolean) as Player[];

          const restoredOrder = restored.length === json.data.players.length ? restored : json.data.players;
          const visibleScore = calculateCorrectCount(restoredOrder);
          const apiScore = json.data.attempt?.score ?? visibleScore;

          if (apiScore !== visibleScore) {
            console.warn("Wordle score mismatch", { apiScore, visibleScore });
          }

          setOrder(restoredOrder);
          setScore(visibleScore);
        } else {
          setOrder(json.data.players);
          setScore(0);
        }
      } catch {
        setErrorMsg("Error al conectar con la API");
      } finally {
        setLoading(false);
      }
    };

    loadDaily();
  }, []);

  const handleDragStart = (e: React.DragEvent, posIndex: number) => {
    dragPosRef.current = posIndex;
    setDraggingPos(posIndex);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, posIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverPos(posIndex);
  };

  const handleDrop = (e: React.DragEvent, targetPos: number) => {
    e.preventDefault();
    const fromPos = dragPosRef.current;
    if (fromPos === null || fromPos === targetPos) return;

    setOrder((prev) => {
      const next = [...prev];
      [next[fromPos], next[targetPos]] = [next[targetPos], next[fromPos]];
      return next;
    });

    dragPosRef.current = null;
    setDraggingPos(null);
    setDragOverPos(null);
  };

  const handleDragEnd = () => {
    dragPosRef.current = null;
    setDraggingPos(null);
    setDragOverPos(null);
  };

  const handleSubmit = async () => {
    if (!challengeId) return;

    try {
      const res = await fetch(`${API_URL}/api/wordle/submit`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          submitted_order: order.map((p) => p.id),
        }),
      });

      const json: SubmitResponse = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error || "No se pudo guardar el intento");
        return;
      }

      const visibleScore = calculateCorrectCount(order);
      const apiScore = json.data?.score ?? visibleScore;

      if (apiScore !== visibleScore) {
        console.warn("Wordle score mismatch", { apiScore, visibleScore });
      }

      setScore(visibleScore);
      setSubmitted(true);
    } catch {
      setErrorMsg("Error al enviar el intento");
    }
  };

  const scoreBadgeClass = `wordle-score-badge wordle-score-badge--${
    score >= 8 ? "high" : score >= 5 ? "mid" : "low"
  }`;

  if (loading) {
    return (
      <div className="wordle-container">
        <p className="wordle-instructions">Cargando desafio...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="wordle-container">
        <p className="wordle-instructions">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="wordle-container">
      <span className="wordle-theme">{theme}</span>

      {!submitted ? (
        <p className="wordle-instructions">Ordena de mayor a menor y confirma tu respuesta</p>
      ) : (
        <span className={scoreBadgeClass}>{score}/10 correctas</span>
      )}

      <div className="wordle-board">
        {BOARD_ROWS.map((rowPositions, rowIdx) => (
          <div key={rowIdx} className="wordle-row">
            {rowPositions.map((posIndex) =>
              order[posIndex] ? (
                <PlayerCard
                  key={order[posIndex].id}
                  player={order[posIndex]}
                  posIndex={posIndex}
                  submitted={submitted}
                  metricLabel={metricLabel}
                  isDragging={draggingPos === posIndex}
                  isDragTarget={dragOverPos === posIndex && draggingPos !== posIndex}
                  onDragStart={(e) => handleDragStart(e, posIndex)}
                  onDragOver={(e) => handleDragOver(e, posIndex)}
                  onDrop={(e) => handleDrop(e, posIndex)}
                  onDragEnd={handleDragEnd}
                />
              ) : null
            )}
          </div>
        ))}
      </div>

      <div className="wordle-btn-wrap">
        {!submitted ? (
          <button className="wordle-btn-confirm" onClick={handleSubmit}>
            Confirmar
          </button>
        ) : (
          <p className="wordle-next-msg">Vuelve manana para el proximo desafio</p>
        )}
      </div>
    </div>
  );
}
