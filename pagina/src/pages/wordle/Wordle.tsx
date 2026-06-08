import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameInstructions, { type InstructionStep } from "../../components/arcade/GameInstructions";
import "./Wordle.css";

// Instrucciones del juego "Reto Diario".
const RETO_DIARIO_TITLE = "Cómo jugar Reto Diario";
const RETO_DIARIO_STEPS: InstructionStep[] = [
  { titulo: "Pregunta del día", detalle: "Observa la pregunta o categoría diaria." },
  { titulo: "Ordena las tarjetas", detalle: "Arrastra las 10 tarjetas para ordenar a los jugadores de mayor a menor." },
  { titulo: "Mayor primero", detalle: "La posición número 1 corresponde al jugador con el valor más alto." },
  { titulo: "Confirma tu orden", detalle: "Presiona “Confirmar” cuando estés seguro del orden." },
  { titulo: "Revisa el resultado", detalle: "Tras confirmar, las posiciones correctas aparecen en verde y las incorrectas en rojo." },
  { titulo: "Puntuación", detalle: "Tu puntuación depende de cuántos jugadores queden exactamente en la posición correcta." },
  { titulo: "Un reto por día", detalle: "Solo hay un reto disponible cada día." },
];

// Tipos de datos que usa el juego.
interface Player {
  id: string;
  name: string;
  initials: string;
  image?: string | null;
  stat: number;
  correctRank?: number | null;
  correct_rank?: number | null;
  correct?: boolean;
  is_correct?: boolean;
  submitted_rank?: number | null;
}

interface AttemptResult {
  player_id: string;
  submitted_rank: number;
  correct_rank: number | null;
  correct: boolean;
  metric_value?: number | null;
}

interface Attempt {
  score: number;
  dinero_ganado: number;
  submitted_order?: string[];
  created_at?: string;
  results?: AttemptResult[];
  correct_order?: string[];
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

// Configuracion basica de la API y filas del tablero.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const BOARD_ROWS = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
];

function WordleHeader() {
  const navigate = useNavigate();

  return (
    <div className="wordle-header">
      <button
        type="button"
        onClick={() => navigate("/arcade")}
        className="wordle-back"
      >
        ← Volver
      </button>
      <GameInstructions
        title={RETO_DIARIO_TITLE}
        steps={RETO_DIARIO_STEPS}
        buttonClassName="ml-auto"
      />
    </div>
  );
}

// Cuenta cuantas posiciones estan correctas.

function calculateCorrectCount(players: Player[]): number {
  return players.reduce((total, player, index) => {
    const correctRank = player.correctRank ?? player.correct_rank;
    return total + (index + 1 === correctRank ? 1 : 0);
  }, 0);
}

// Agrega el resultado del intento a cada jugador.
function applyAttemptResults(players: Player[], results?: AttemptResult[]): Player[] {
  if (!results?.length) return players;

  const resultByPlayerId = new Map(results.map((result) => [result.player_id, result]));

  return players.map((player, index) => {
    const result = resultByPlayerId.get(player.id);
    if (!result) return player;

    return {
      ...player,
      correctRank: result.correct_rank,
      correct_rank: result.correct_rank,
      correct: result.correct,
      is_correct: result.correct,
      submitted_rank: result.submitted_rank ?? index + 1,
    };
  });
}

// Props que recibe la tarjeta de cada jugador.
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

// Tarjeta visual para mostrar un jugador.
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
  // Estado y clases visuales de la tarjeta.
  const [imgError, setImgError] = useState(false);
  const correctRank = player.correctRank ?? player.correct_rank;
  const isCorrect = submitted && (player.correct ?? player.is_correct ?? posIndex + 1 === correctRank);

  const cardClasses = [
    "wordle-card",
    !submitted ? "wordle-card--default" : isCorrect ? "wordle-card--correct" : "wordle-card--wrong",
    submitted ? "wordle-card--submitted" : "",
    isDragging ? "wordle-card--dragging" : "",
    isDragTarget ? "wordle-card--drag-target" : "",
  ].filter(Boolean).join(" ");

  const imgWrapClasses = `wordle-img-wrap${submitted ? " wordle-img-wrap--submitted" : ""}`;
  const resultBarClasses = `wordle-result-bar ${isCorrect ? "wordle-result-bar--correct" : "wordle-result-bar--wrong"}`;

  // Estructura HTML de la tarjeta.
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

// Pantalla principal del Wordle.
export default function Wordle() {
  // Estados principales del juego.
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

  // Carga el desafio diario al abrir la pagina.
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
          setErrorMsg(json.error || "No se pudo cargar el desafío");
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
          const orderWithResults = applyAttemptResults(restoredOrder, json.data.attempt.results);
          const visibleScore = calculateCorrectCount(orderWithResults);
          const apiScore = json.data.attempt.score ?? visibleScore;

          if (apiScore !== visibleScore) {
            console.warn("Wordle score mismatch", { apiScore, visibleScore });
          }

          setOrder(orderWithResults);
          setScore(apiScore);
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

  // Empieza a arrastrar una tarjeta.
  const handleDragStart = (e: React.DragEvent, posIndex: number) => {
    dragPosRef.current = posIndex;
    setDraggingPos(posIndex);
    e.dataTransfer.effectAllowed = "move";
  };

  // Marca la posicion sobre la que se esta arrastrando.
  const handleDragOver = (e: React.DragEvent, posIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverPos(posIndex);
  };

  // Intercambia dos tarjetas cuando se suelta una.
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

  // Limpia el estado del arrastre.
  const handleDragEnd = () => {
    dragPosRef.current = null;
    setDraggingPos(null);
    setDragOverPos(null);
  };

  // Envia el orden elegido a la API.
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

      const orderWithResults = applyAttemptResults(order, json.data?.results);
      const visibleScore = calculateCorrectCount(orderWithResults);
      const apiScore = json.data?.score ?? visibleScore;

      if (apiScore !== visibleScore) {
        console.warn("Wordle score mismatch", { apiScore, visibleScore });
      }

      setOrder(orderWithResults);
      setScore(apiScore);
      setSubmitted(true);
    } catch {
      setErrorMsg("Error al enviar el intento");
    }
  };

  const scoreBadgeClass = `wordle-score-badge wordle-score-badge--${
    score >= 8 ? "high" : score >= 5 ? "mid" : "low"
  }`;

  // Pantalla mientras se carga el desafio.
  if (loading) {
    return (
      <div className="wordle-container">
        <WordleHeader />
        <p className="wordle-instructions">Cargando desafío...</p>
      </div>
    );
  }

  // Pantalla si ocurre un error.
  if (errorMsg) {
    return (
      <div className="wordle-container">
        <WordleHeader />
        <p className="wordle-instructions">{errorMsg}</p>
      </div>
    );
  }

  // Vista principal del tablero y el boton.
  return (
    <div className="wordle-container">
      <WordleHeader />
      <header className="wordle-page-header">
        <p className="ph-eyebrow">Arcade</p>
        <h1 className="wordle-theme">{theme}</h1>
        {!submitted ? (
          <p className="wordle-instructions">Ordena de mayor a menor y confirma tu respuesta</p>
        ) : null}
      </header>

      {submitted ? (
        <span className={scoreBadgeClass}>{score}/10 correctas</span>
      ) : null}

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
          <p className="wordle-next-msg">Vuelve mañana para el próximo desafío</p>
        )}
      </div>
    </div>
  );
}
