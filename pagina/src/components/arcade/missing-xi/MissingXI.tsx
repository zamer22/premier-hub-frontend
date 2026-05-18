import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MissingXIPlayer, MissingXIMatch, AttemptRow } from "../../../types/missingXI";
import { fetchDailyMissingXI, resetMissingXIProgress } from "../../../services/missingXIApi";
import MatchHeader from "./MatchHeader";
import Pitch from "./Pitch";
import PlayerWordle from "./PlayerWordle";
import GameSummary from "./GameSummary";

const PUBLIC_LOAD_ERROR =
  "No pudimos cargar el reto diario en este momento. Intenta de nuevo en unos minutos.";

export default function MissingXI() {
  const navigate = useNavigate();
  const [match, setMatch] = useState<MissingXIMatch | null>(null);
  const [initialMatch, setInitialMatch] = useState<MissingXIMatch | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadDailyChallenge(signal?: AbortSignal) {
    try {
      setLoading(true);
      setErrorMsg("");

      const dailyMatch = resetMissingXIProgress(await fetchDailyMissingXI(signal));

      setInitialMatch(dailyMatch);
      setMatch(dailyMatch);
      setTotalPoints(0);
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
      <main className="ph-page">
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
      <main className="ph-page">
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
      <main className="ph-page">
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
          onRestart={handleRestart}
          onBackToArcade={() => navigate("/arcade")}
        />
      </main>
    );
  }

  // ─── Pitch view ──────────────────────────────────────────────
  return (
    <main className="ph-page">

      {/* Back button + title */}
      <div className="mb-4 grid justify-items-start gap-2">
        <BackButton />
        <div>
          <p className="ph-eyebrow">Arcade</p>
          <h1 className="ph-title">Missing XI</h1>
          <p className="ph-subtitle">Adivina la alineación del equipo ganador</p>
        </div>
      </div>

      {/* Pitch + match info layout */}
      <div className="mx-auto grid w-full max-w-[1120px] gap-7 lg:grid-cols-[minmax(340px,410px)_minmax(460px,1fr)] lg:items-start xl:max-w-[1180px] xl:grid-cols-[minmax(360px,430px)_minmax(520px,1fr)]">

        {/* LEFT — pitch */}
        <div className="flex justify-center">
          <div className="w-full max-w-[360px] xl:max-w-[380px]">
            <Pitch players={players} onSelectPlayer={(id) => setSelectedId(id)} />
          </div>
        </div>

        {/* RIGHT — info */}
        <div className="flex min-w-0 flex-col gap-4 lg:pt-1">

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
              <div className="grid w-full grid-cols-2 gap-6">
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
