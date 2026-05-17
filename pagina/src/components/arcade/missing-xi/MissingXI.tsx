import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MissingXIPlayer, MissingXIMatch, AttemptRow } from "../../../types/missingXI";
import { getInitialMatch } from "../../../data/mockMissingXI";
import MatchHeader from "./MatchHeader";
import Pitch from "./Pitch";
import PlayerWordle from "./PlayerWordle";
import GameSummary from "./GameSummary";

export default function MissingXI() {
  const navigate = useNavigate();
  const [match, setMatch] = useState<MissingXIMatch>(() => getInitialMatch());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  const { players } = match;
  const selectedPlayer =
    selectedId !== null ? (players.find((p) => p.id === selectedId) ?? null) : null;

  const guessedCount = players.filter((p) => p.guessed).length;
  const resolvedCount = players.filter((p) => p.guessed || p.failed).length;
  const gameOver = resolvedCount === 11;

  function updatePlayer(id: number, updates: Partial<MissingXIPlayer>) {
    setMatch((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
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
    setMatch(getInitialMatch());
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
      <div className="grid gap-6 lg:grid-cols-[minmax(340px,410px)_minmax(420px,1fr)] lg:items-start xl:grid-cols-[minmax(360px,440px)_minmax(460px,1fr)]">

        {/* LEFT — pitch */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[360px] xl:max-w-[380px]">
            <Pitch players={players} onSelectPlayer={(id) => setSelectedId(id)} />
          </div>
        </div>

        {/* RIGHT — info */}
        <div className="flex min-w-0 flex-col gap-4 lg:max-w-[640px] lg:pt-1">

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
              <div className="mx-auto grid w-full max-w-[520px] grid-cols-2 gap-4">
                <div className="flex min-h-[78px] flex-col justify-center rounded-xl bg-[#162b4d] px-4 py-3 text-white shadow-sm">
                  <p className="mb-1 text-[0.58rem] font-semibold uppercase tracking-widest opacity-55">
                    Puntos
                  </p>
                  <p className="text-[1.65rem] font-black leading-none">{totalPoints}</p>
                </div>
                <div className="flex min-h-[78px] flex-col justify-center rounded-xl border border-[#dde3ec] bg-white px-4 py-3 shadow-sm">
                  <p className="mb-1 text-[0.58rem] font-semibold uppercase tracking-widest text-[#9aa3b2]">
                    Progreso
                  </p>
                  <p className="text-[1.65rem] font-black leading-none text-[#162b4d]">
                    {guessedCount}
                    <span className="text-base font-semibold text-[#b0b8c6]">/11</span>
                  </p>
                </div>
              </div>

              {/* 3. Progress bar */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.72rem] font-semibold text-[#5f6c80]">Alineación</span>
                  <span className="text-[0.72rem] font-black text-[#162b4d]">
                    {resolvedCount}/11 jugadores
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#edf0f5]">
                  <div
                    className="h-full rounded-full bg-[#cf275f] transition-all duration-500"
                    style={{ width: `${(resolvedCount / 11) * 100}%` }}
                  />
                </div>
              </div>

              {/* 4. Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {[
                  { color: "bg-gradient-to-b from-red-700 to-[#871d54]", label: "Sin adivinar" },
                  { color: "bg-green-500", label: "Acertado" },
                  { color: "bg-red-500", label: "Fallado" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span className="text-[0.72rem] font-medium text-[#5f6c80]">{label}</span>
                  </div>
                ))}
              </div>

              {/* 5. Instruction — no emoji */}
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
