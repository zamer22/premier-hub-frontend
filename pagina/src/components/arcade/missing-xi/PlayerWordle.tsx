import { useState, useEffect, useCallback } from "react";
import type { MissingXIPlayer, AttemptRow, LetterResult } from "../../../types/missingXI";
import WordleKeyboard from "./WordleKeyboard";
import { evaluateAttempt, getKeyboardStates } from "./wordleUtils";

const MAX_ATTEMPTS = 6;
const POINTS_NO_HINT = 100;
const POINTS_WITH_HINT = 50;

interface Props {
  player: MissingXIPlayer;
  onClose: () => void;
  onGuessed: (attempts: AttemptRow[], usedHint: boolean, points: number) => void;
  onFailed: (attempts: AttemptRow[]) => void;
  onAttemptsUpdate: (attempts: AttemptRow[]) => void;
  onHintUsed: () => void;
  compact?: boolean;
}

function cellSizeClass(answerLen: number, compact: boolean): string {
  if (compact) {
    if (answerLen <= 6) return "h-10 w-10 text-base";
    if (answerLen === 7) return "h-9 w-8 text-sm";
    return "h-9 w-7 text-xs";
  }

  if (answerLen <= 5) return "h-14 w-14 text-xl";
  if (answerLen === 6) return "h-[52px] w-[52px] text-lg";
  if (answerLen === 7) return "h-12 w-10 text-base";
  return "h-12 w-9 text-sm";
}

interface LetterCellProps {
  letter?: string;
  result?: LetterResult;
  isActive?: boolean;
  sizeClass: string;
}

function LetterCell({ letter, result, isActive, sizeClass }: LetterCellProps) {
  const color =
    result === "correct"
      ? "bg-green-500 border-green-500 text-white"
      : result === "present"
        ? "bg-yellow-400 border-yellow-400 text-white"
        : result === "absent"
          ? "bg-[#3a4152] border-[#3a4152] text-white"
          : letter
            ? "border-[#162b4d] bg-white text-[#162b4d]"
            : "border-[#dde3ec] bg-[#f8fafc]";

  return (
    <div
      className={`flex items-center justify-center rounded-xl border-2 font-black uppercase transition-all duration-150 ${sizeClass} ${color} ${
        isActive && !result ? "ring-2 ring-[#cf275f] ring-offset-1" : ""
      }`}
    >
      {letter ?? ""}
    </div>
  );
}

export default function PlayerWordle({
  player,
  onClose,
  onGuessed,
  onFailed,
  onAttemptsUpdate,
  onHintUsed,
  compact = false,
}: Props) {
  const { answer } = player;
  const answerLen = answer.length;
  const sz = cellSizeClass(answerLen, compact);
  const jerseyNumber = player.number ?? "?";

  const [currentLetters, setCurrentLetters] = useState<string[]>([]);
  const [hintShown, setHintShown] = useState(player.usedHint);
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState("");

  const isFinished = player.guessed || player.failed;
  const attemptsLeft = MAX_ATTEMPTS - player.attempts.length;

  useEffect(() => {
    setCurrentLetters([]);
    setHintShown(player.usedHint);
    setImgError(false);
    setError("");
  }, [player.id, player.usedHint]);

  const handleKey = useCallback(
    (key: string) => {
      if (isFinished) return;

      if (key === "⌫" || key === "Backspace") {
        setCurrentLetters((prev) => prev.slice(0, -1));
        setError("");
        return;
      }

      if (key === "ENTER" || key === "Enter") {
        if (currentLetters.length === 0) {
          setError("Escribe algo primero");
          return;
        }
        if (currentLetters.length < answerLen) {
          setError(`Faltan ${answerLen - currentLetters.length} letras`);
          return;
        }

        const results = evaluateAttempt(currentLetters, answer);
        const newRow: AttemptRow = { letters: [...currentLetters], results };
        const newAttempts = [...player.attempts, newRow];
        const won = currentLetters.join("") === answer;

        setCurrentLetters([]);
        setError("");

        if (won) {
          onGuessed(newAttempts, hintShown, hintShown ? POINTS_WITH_HINT : POINTS_NO_HINT);
        } else if (newAttempts.length >= MAX_ATTEMPTS) {
          onFailed(newAttempts);
        } else {
          onAttemptsUpdate(newAttempts);
        }
        return;
      }

      if (/^[A-Za-z]$/.test(key) && currentLetters.length < answerLen) {
        setCurrentLetters((prev) => [...prev, key.toUpperCase()]);
        setError("");
      }
    },
    [currentLetters, player.attempts, answer, answerLen, isFinished, hintShown, onGuessed, onFailed, onAttemptsUpdate]
  );

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      handleKey(e.key);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleKey]);

  function handleHint() {
    if (hintShown) return;
    setHintShown(true);
    onHintUsed();
  }

  function handleGiveUp() {
    if (isFinished) return;
    setCurrentLetters([]);
    setError("");
    onFailed(player.attempts);
  }

  type DisplayRow = { letters: string[]; results?: LetterResult[]; isCurrent: boolean };
  const rows: DisplayRow[] = player.attempts.map((a) => ({
    letters: a.letters,
    results: a.results,
    isCurrent: false,
  }));
  if (!isFinished && rows.length < MAX_ATTEMPTS) {
    rows.push({ letters: currentLetters, isCurrent: true });
  }
  while (rows.length < MAX_ATTEMPTS) {
    rows.push({ letters: [], isCurrent: false });
  }

  const keyboardStates = getKeyboardStates(player.attempts);

  return (
    <div className={compact ? "flex max-h-[calc(100vh-280px)] min-h-0 flex-col overflow-y-auto rounded-xl border border-[#dde3ec] bg-white shadow-sm" : "flex flex-col"}>

      {/* ── Top bar ──────────────────────────────── */}
      <div className={`flex items-center justify-between border-b border-[#edf0f5] ${compact ? "px-4 py-3" : "px-5 py-3.5"}`}>
        <button
          type="button"
          onClick={onClose}
          className="text-base font-bold text-[#263a55] transition-colors hover:text-[#e90052]"
        >
          ← Volver
        </button>

        <div className="flex items-center gap-2">
          {!isFinished && (
            <button
              type="button"
              onClick={handleGiveUp}
              className="rounded-full border border-[#dde3ec] px-3 py-1 text-[0.68rem] font-bold text-[#7a8494] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              Rendirse
            </button>
          )}
          <span
            className={`rounded-full px-3.5 py-1 text-[0.75rem] font-bold ${
              isFinished
                ? player.guessed
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
                : "bg-[#f0f2f5] text-[#5f6c80]"
            }`}
          >
            {isFinished
              ? player.guessed
                ? "¡Correcto!"
                : "Fallado"
              : `${attemptsLeft} intentos`}
          </span>
        </div>
      </div>

      {/* ── Player info + hint ───────────────────── */}
      <div className={`flex items-start justify-between ${compact ? "px-4 pb-3 pt-4" : "px-5 pt-5 pb-4"}`}>
        <div>
          <h2 className={`${compact ? "text-[1.25rem]" : "text-[1.5rem]"} font-black leading-tight text-[#162b4d]`}>
            Jugador #{jerseyNumber}
          </h2>
          <p className="mt-1 text-[0.82rem] font-semibold text-[#5f6c80]">
            {player.position} · {answerLen} letras
          </p>
        </div>

        {/* Hint widget */}
        <div className="ml-4 shrink-0">
          {!hintShown && !isFinished && (
            <button
              type="button"
              onClick={handleHint}
              className={`${compact ? "px-3 py-2" : "px-4 py-2.5"} rounded-xl border-2 border-[#cf275f]/25 bg-white text-center shadow-sm transition-all hover:border-[#cf275f]/50 hover:bg-[#fef0f4] hover:shadow-md active:scale-95`}
            >
              <p className="text-[0.82rem] font-black text-[#cf275f]">Ver pista</p>
              <p className={`${compact ? "hidden sm:block" : ""} mt-0.5 text-[0.62rem] font-medium text-[#cf275f]/55`}>
                Penalización −50 pts
              </p>
            </button>
          )}
          {hintShown && (
            <div className="flex flex-col items-center gap-2">
              <div className={`${compact ? "h-24 w-24" : "h-32 w-32"} overflow-hidden rounded-2xl border-2 border-[#871d54] bg-[#f7f8fb] shadow-lg`}>
                {player.photoUrl && !imgError ? (
                  <img
                    src={player.photoUrl}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#871d54]/10 text-3xl font-black text-[#871d54]">
                    {player.firstName[0]}
                    {player.lastName[0] || player.displayName[0]}
                  </div>
                )}
              </div>
              <span className="text-[0.62rem] font-bold text-[#cf275f]">−50 pts</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────── */}
      <div className={`flex flex-col items-center gap-1 px-4 ${compact ? "pb-2" : "pb-3"}`}>
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {Array.from({ length: answerLen }).map((_, ci) => (
              <LetterCell
                key={ci}
                letter={row.letters[ci]}
                result={row.results?.[ci]}
                isActive={row.isCurrent && ci === row.letters.length}
                sizeClass={sz}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Error ────────────────────────────────── */}
      {error && (
        <p className="px-4 pb-1 text-center text-[0.75rem] font-semibold text-red-500">
          {error}
        </p>
      )}

      {/* ── Result banner ────────────────────────── */}
      {isFinished && (
        <div
          className={`mx-4 mt-1 rounded-2xl border ${compact ? "p-3" : "p-4"} text-center ${
            player.guessed
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p className={`text-[1rem] font-black ${player.guessed ? "text-green-700" : "text-red-700"}`}>
            {player.guessed
              ? `¡Correcto! ${player.firstName} ${player.lastName}`
              : `Era: ${player.firstName} ${player.lastName}`}
          </p>
          <p className={`mt-0.5 text-[0.73rem] font-semibold ${player.guessed ? "text-green-600" : "text-red-500"}`}>
            {player.guessed
              ? player.usedHint ? "+50 puntos (con pista)" : "+100 puntos"
              : "0 puntos"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 rounded-xl bg-[#162b4d] px-6 py-2 text-[0.84rem] font-bold text-white transition-colors hover:bg-[#223552]"
          >
            Volver a la cancha
          </button>
        </div>
      )}

      {/* ── Keyboard ─────────────────────────────── */}
      {!isFinished && (
        <div className="mt-1">
          <WordleKeyboard letterStates={keyboardStates} onKey={handleKey} compact={compact} />
        </div>
      )}
    </div>
  );
}
