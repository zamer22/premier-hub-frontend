import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MissingXIPlayer, MissingXIMatch, AttemptRow } from "../../../types/missingXI";
import { fetchDailyMissingXI, resetMissingXIProgress, submitMissingXI } from "../../../services/missingXIApi";
import MatchHeader from "./MatchHeader";
import Pitch from "./Pitch";
import PlayerWordle from "./PlayerWordle";
import GameSummary from "./GameSummary";

const PUBLIC_LOAD_ERROR =
  "No pudimos cargar el reto diario en este momento. Intenta de nuevo en unos minutos.";

const CACHE_PREFIX = "premierhub_missing_xi_progress_v1";

type CachedMissingXIProgress = {
  challengeId: string;
  players: Array<{
    id: string;
    guessed: boolean;
    failed: boolean;
    usedHint: boolean;
    attempts: AttemptRow[];
  }>;
  totalPoints: number;
  submitted: boolean;
  savedAt: number;
};

type MissingXIProps = {
  onSaldoChange?: (dinero: number) => void;
};

function getCacheKey(challengeId: string) {
  return `${CACHE_PREFIX}:${challengeId}`;
}

function calculateTotalPoints(players: MissingXIPlayer[]) {
  return players.reduce((total, player) => {
    if (!player.guessed) return total;
    return total + (player.usedHint ? 50 : 100);
  }, 0);
}

function readCachedProgress(challengeId: string): CachedMissingXIProgress | null {
  try {
    const raw = window.localStorage.getItem(getCacheKey(challengeId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedMissingXIProgress;
    if (!parsed || parsed.challengeId !== challengeId || !Array.isArray(parsed.players)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCachedProgress(match: MissingXIMatch, totalPoints: number) {
  try {
    const payload: CachedMissingXIProgress = {
      challengeId: match.id,
      players: match.players.map((player) => ({
        id: player.id,
        guessed: player.guessed,
        failed: player.failed,
        usedHint: player.usedHint,
        attempts: player.attempts,
      })),
      totalPoints,
      submitted: match.played === true,
      savedAt: Date.now(),
    };

    window.localStorage.setItem(getCacheKey(match.id), JSON.stringify(payload));
  } catch {
    // Cache local opcional: si el navegador lo bloquea, el juego sigue funcionando.
  }
}

function restoreCachedProgress(match: MissingXIMatch) {
  const cached = readCachedProgress(match.id);
  if (!cached) return { match, totalPoints: 0 };

  const cachedById = new Map(cached.players.map((player) => [player.id, player]));
  const hasSamePlayers =
    cached.players.length === match.players.length &&
    match.players.every((player) => cachedById.has(player.id));

  if (!hasSamePlayers) return { match, totalPoints: 0 };

  const restoredMatch = {
    ...match,
    players: match.players.map((player) => {
      const cachedPlayer = cachedById.get(player.id);
      if (!cachedPlayer) return player;

      return {
        ...player,
        guessed: cachedPlayer.guessed === true,
        failed: cachedPlayer.failed === true,
        usedHint: cachedPlayer.usedHint === true,
        attempts: Array.isArray(cachedPlayer.attempts) ? cachedPlayer.attempts : [],
      };
    }),
  };

  return {
    match: restoredMatch,
    totalPoints: calculateTotalPoints(restoredMatch.players),
  };
}

export default function MissingXI({ onSaldoChange }: MissingXIProps) {
  const navigate = useNavigate();
  const [match, setMatch] = useState<MissingXIMatch | null>(null);
  const [initialMatch, setInitialMatch] = useState<MissingXIMatch | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const submittedChallengeRef = useRef<string | null>(null);

  async function loadDailyChallenge(signal?: AbortSignal) {
    try {
      setLoading(true);
      setErrorMsg("");
      setSaveMsg("");

      const dailyMatch = await fetchDailyMissingXI(signal);
      const cleanMatch = resetMissingXIProgress(dailyMatch);
      const restoredProgress = dailyMatch.played
        ? { match: dailyMatch, totalPoints: Number(dailyMatch.attempt?.dinero_ganado ?? calculateTotalPoints(dailyMatch.players)) }
        : restoreCachedProgress(cleanMatch);

      submittedChallengeRef.current = dailyMatch.played ? dailyMatch.id : null;
      setInitialMatch(cleanMatch);
      setMatch(restoredProgress.match);
      setTotalPoints(restoredProgress.totalPoints);
      setSelectedId(null);
    } catch (error) {
      if (signal?.aborted) return;
      console.error("[MissingXI] Error al cargar el reto diario", error);
      setErrorMsg(PUBLIC_LOAD_ERROR);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadDailyChallenge(controller.signal);

    return () => controller.abort();
  }, []);

  const players = match?.players ?? [];
  const selectedPlayer =
    selectedId !== null ? (players.find((p) => p.id === selectedId) ?? null) : null;

  const guessedCount = players.filter((p) => p.guessed).length;
  const resolvedCount = players.filter((p) => p.guessed || p.failed).length;
  const totalPlayers = players.length || 11;
  const gameOver = players.length > 0 && resolvedCount === players.length;

  useEffect(() => {
    if (!match) return;
    writeCachedProgress(match, totalPoints);
  }, [match, totalPoints]);

  useEffect(() => {
    if (!match || !gameOver || match.played) return;
    if (submittedChallengeRef.current === match.id) return;

    submittedChallengeRef.current = match.id;
    setSaveMsg("Guardando puntos...");

    submitMissingXI(match.id, players)
      .then((result) => {
        setSaveMsg(`Puntos guardados: +${result.dinero_ganado}`);
        setTotalPoints(result.dinero_ganado);
        if (typeof result.nuevo_saldo === "number") {
          onSaldoChange?.(result.nuevo_saldo);
        }
        setMatch((prev) =>
          prev
            ? {
                ...prev,
                played: true,
                attempt: {
                  score: result.score,
                  dinero_ganado: result.dinero_ganado,
                  submitted_players: result.submitted_players,
                  created_at: new Date().toISOString(),
                },
              }
            : prev
        );
      })
      .catch((error: Error & { status?: number }) => {
        if (error.status === 409) {
          setSaveMsg("Este Missing XI ya habia sido guardado.");
          setMatch((prev) => (prev ? { ...prev, played: true } : prev));
          return;
        }

        console.error("[MissingXI] Error al guardar puntos", error);
        setSaveMsg("No se pudieron guardar los puntos. Tu avance quedo en cache.");
      });
  }, [gameOver, match, onSaldoChange, players]);

  function updatePlayer(id: string, updates: Partial<MissingXIPlayer>) {
    setMatch((prev) => prev ? ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }) : prev);
  }

  function handleGuessed(attempts: AttemptRow[], usedHint: boolean, points: number) {
    if (selectedId === null) return;
    updatePlayer(selectedId, { guessed: true, usedHint, attempts });
    setTotalPoints((prev) => prev + points);
  }

  function handleFailed(attempts: AttemptRow[]) {
    if (selectedId === null) return;
    updatePlayer(selectedId, { failed: true, attempts });
  }

  function handleAttemptsUpdate(attempts: AttemptRow[]) {
    if (selectedId === null) return;
    updatePlayer(selectedId, { attempts });
  }

  function handleHintUsed() {
    if (selectedId === null) return;
    updatePlayer(selectedId, { usedHint: true });
  }

  function handleRestart() {
    if (initialMatch) {
      setMatch(resetMissingXIProgress(initialMatch));
    }
    setTotalPoints(0);
    setSaveMsg("");
    setSelectedId(null);
  }

  const BackButton = () => (
    <button
      type="button"
      onClick={() => navigate("/arcade")}
      className="w-fit text-base font-bold text-[#263a55] transition-colors hover:text-[#e90052]"
    >
      ← Volver
    </button>
  );

  if (loading) {
    return (
      <main className="ph-page min-w-0 overflow-x-clip">
        <div className="mb-4 grid justify-items-start gap-2">
          <BackButton />
          <div>
            <p className="ph-eyebrow">Arcade</p>
            <h1 className="ph-title">Missing XI</h1>
            <p className="ph-subtitle">Cargando reto diario desde Premier Hub</p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#dde3ec] bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-[#cf275f]">
            Preparando partido
          </p>
          <p className="mt-3 text-base font-semibold text-[#5f6c80]">
            Estamos buscando la alineación guardada para hoy.
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg || !match) {
    return (
      <main className="ph-page min-w-0 overflow-x-clip">
        <div className="mb-4 grid justify-items-start gap-2">
          <BackButton />
          <div>
            <p className="ph-eyebrow">Arcade</p>
            <h1 className="ph-title">Missing XI</h1>
            <p className="ph-subtitle">No se pudo cargar el reto diario</p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#dde3ec] bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-base font-bold text-[#162b4d]">
            {errorMsg || "No hay datos disponibles para Missing XI."}
          </p>
          <button
            type="button"
            onClick={() => loadDailyChallenge()}
            className="mt-5 rounded-xl bg-[#cf275f] px-6 py-3 text-sm font-black text-white shadow-md transition-colors hover:bg-[#b02050]"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // ─── Game over ───────────────────────────────────────────────
  if (gameOver && selectedId === null) {
    return (
      <main className="ph-page min-w-0 overflow-x-clip">
        <div className="mb-5 grid justify-items-start gap-3">
          <BackButton />
          <div>
            <p className="ph-eyebrow">Arcade</p>
            <h1 className="ph-title">Missing XI</h1>
          </div>
        </div>
        <GameSummary
          match={match}
          players={players}
          totalPoints={totalPoints}
          saveMessage={saveMsg}
          onRestart={handleRestart}
          onBackToArcade={() => navigate("/arcade")}
        />
      </main>
    );
  }

  // ─── Pitch view ──────────────────────────────────────────────
  return (
    <main className="ph-page min-w-0 overflow-x-clip max-[520px]:gap-[0.85rem]">

      {/* Back button + title */}
      <div className="mb-[clamp(0.5rem,1.4vh,1rem)] grid justify-items-start gap-2 [@media_(min-width:841px)_and_(max-height:700px)]:mb-[0.35rem]">
        <BackButton />
        <div>
          <p className="ph-eyebrow">Arcade</p>
          <h1 className="ph-title [@media_(min-width:841px)_and_(max-height:780px)]:text-[clamp(1.35rem,2vw,1.8rem)]">
            Missing XI
          </h1>
          <p className="ph-subtitle [@media_(min-width:841px)_and_(max-height:780px)]:mt-1 [@media_(min-width:841px)_and_(max-height:780px)]:leading-[1.35]">
            Adivina la alineación del equipo ganador
          </p>
        </div>
      </div>

      {/* Pitch + match info layout */}
      <div className="mx-auto grid w-full max-w-[min(100%,520px)] grid-cols-[minmax(0,1fr)] gap-4 max-[520px]:gap-[0.85rem] min-[981px]:max-w-[min(100%,1120px)] min-[981px]:grid-cols-[minmax(260px,clamp(300px,32vw,380px))_minmax(0,1fr)] min-[981px]:items-start min-[981px]:gap-[clamp(1rem,2vw,1.75rem)]">

        {/* LEFT — pitch */}
        <div className="flex justify-center">
          <div className="w-full max-w-[min(100%,330px)] min-[521px]:max-w-[min(100%,360px)] min-[981px]:max-w-[min(100%,clamp(300px,31vw,380px))] [@media_(min-width:841px)_and_(max-height:780px)]:max-w-[min(100%,calc((100vh-210px)*0.642857))] [@media_(min-width:841px)_and_(max-height:700px)]:max-w-[min(100%,calc((100vh-180px)*0.642857))]">
            <Pitch players={players} onSelectPlayer={(id) => setSelectedId(id)} />
          </div>
        </div>

        {/* RIGHT — info */}
        <div className="flex min-w-0 flex-col gap-[clamp(0.75rem,1.4vh,1rem)] pt-[0.15rem]">

          {selectedPlayer ? (
            <PlayerWordle
              player={selectedPlayer}
              onClose={() => setSelectedId(null)}
              onGuessed={handleGuessed}
              onFailed={handleFailed}
              onAttemptsUpdate={handleAttemptsUpdate}
              onHintUsed={handleHintUsed}
              compact
            />
          ) : (
            <>
              {/* 1. Match info — título del partido primero */}
              <MatchHeader match={match} />

              {/* 2. Stats: puntos + progreso */}
              <div className="grid w-full grid-cols-2 gap-[clamp(0.75rem,1.5vw,1.5rem)] max-[520px]:gap-3">
                <div className="flex min-h-[70px] flex-col justify-center rounded-xl bg-[#162b4d] px-4 py-3 text-white shadow-sm">
                  <p className="mb-1 text-[0.58rem] font-semibold uppercase tracking-widest opacity-55">
                    Puntos
                  </p>
                  <p className="text-[1.65rem] font-black leading-none">{totalPoints}</p>
                </div>
                <div className="flex min-h-[70px] flex-col justify-center rounded-xl border border-[#dde3ec] bg-white px-4 py-3 shadow-sm">
                  <p className="mb-1 text-[0.58rem] font-semibold uppercase tracking-widest text-[#9aa3b2]">
                    Progreso
                  </p>
                  <p className="text-[1.65rem] font-black leading-none text-[#162b4d]">
                    {guessedCount}
                    <span className="text-base font-semibold text-[#b0b8c6]">/{totalPlayers}</span>
                  </p>
                </div>
              </div>

              {/* 3. Progress bar */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.72rem] font-semibold text-[#5f6c80]">Alineación</span>
                  <span className="text-[0.72rem] font-black text-[#162b4d]">
                    {resolvedCount}/{totalPlayers} jugadores
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#edf0f5]">
                  <div
                    className="h-full rounded-full bg-[#cf275f] transition-all duration-500"
                    style={{ width: `${(resolvedCount / totalPlayers) * 100}%` }}
                  />
                </div>
              </div>

              {/* 4. Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {[
                  { color: "bg-[#6f7b8d]", label: "Sin adivinar" },
                  { color: "bg-[#b6f000]", label: "Acertado" },
                  { color: "bg-[#ff2d55]", label: "Fallado" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 rounded-full ring-2 ring-white shadow-sm ${color}`} />
                    <span className="text-[0.72rem] font-medium text-[#5f6c80]">{label}</span>
                  </div>
                ))}
              </div>

              {/* 5. Instruction  */}
              <div className="mt-auto rounded-xl border border-[#dde3ec] bg-[#f7f8fb] px-4 py-3.5">
                <p className="text-[0.8rem] font-medium leading-relaxed text-[#5f6c80]">
                  Toca una camiseta en la cancha para adivinar al jugador
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
