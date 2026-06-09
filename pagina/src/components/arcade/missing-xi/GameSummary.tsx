import type { MissingXIPlayer, MissingXIMatch } from "../../../types/missingXI";

interface Props {
  match: MissingXIMatch;
  players: MissingXIPlayer[];
  totalPoints: number;
  saveMessage?: string;
  onRestart: () => void;
  onBackToArcade: () => void;
}

export default function GameSummary({
  match,
  players,
  totalPoints,
  saveMessage,
  onRestart,
  onBackToArcade,
}: Props) {
  const guessed = players.filter((p) => p.guessed);
  const failed = players.filter((p) => p.failed);

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      {/* Score */}
      <div className="text-center">
        <p className="mb-1 text-[0.75rem] font-semibold uppercase tracking-wide text-[#5f6c80]">
          Resultado final
        </p>
        <div className="text-6xl font-black text-[#162b4d]">{totalPoints}</div>
        <p className="mt-1 text-[0.82rem] text-[#5f6c80]">puntos</p>
        {saveMessage ? (
          <p className="mt-2 text-[0.76rem] font-bold text-[#cf275f]">{saveMessage}</p>
        ) : null}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-green-600">{guessed.length}</span>
          <span className="text-[0.7rem] font-semibold text-[#5f6c80]">Acertados</span>
        </div>
        <div className="h-8 w-px bg-[#dde3ec]" />
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-red-500">{failed.length}</span>
          <span className="text-[0.7rem] font-semibold text-[#5f6c80]">Fallados</span>
        </div>
        <div className="h-8 w-px bg-[#dde3ec]" />
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-[#162b4d]">{players.length}</span>
          <span className="text-[0.7rem] font-semibold text-[#5f6c80]">Total</span>
        </div>
      </div>

      {/* Match info */}
      <div className="w-full max-w-xs rounded-xl border border-[#dde3ec] bg-white px-5 py-3 text-center shadow-sm">
        <p className="text-[0.72rem] font-semibold text-[#5f6c80]">
          {match.league} · {match.season} · {match.date}
        </p>
        <p className="mt-0.5 text-[0.9rem] font-black text-[#162b4d]">
          {match.homeTeam} {match.homeScore} – {match.awayScore} {match.awayTeam}
        </p>
        <p className="mt-0.5 text-[0.7rem] font-semibold text-[#cf275f]">
          Ganador: {match.winner}
        </p>
      </div>

      {/* Breakdown */}
      <div className="w-full max-w-sm">
        <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-wide text-[#5f6c80]">
          Desglose
        </p>
        <div className="flex flex-col gap-1.5">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-[0.78rem] ${
                p.guessed
                  ? "border border-green-100 bg-green-50"
                  : "border border-red-100 bg-red-50"
              }`}
            >
              <span className="font-semibold text-[#162b4d]">
                #{p.number ?? "?"} {p.position} — {p.firstName} {p.lastName}
              </span>
              <span
                className={`font-black ${p.guessed ? "text-green-600" : "text-red-500"}`}
              >
                {p.guessed ? (p.usedHint ? "+50" : "+100") : "0"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full max-w-sm gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-xl bg-[#cf275f] py-3 text-[0.88rem] font-black text-white shadow-md transition-colors hover:bg-[#b02050] active:scale-95"
        >
          Jugar otra vez
        </button>
        <button
          type="button"
          onClick={onBackToArcade}
          className="flex-1 rounded-xl border border-[#dde3ec] bg-white py-3 text-[0.88rem] font-black text-[#162b4d] transition-colors hover:bg-[#f6f8fb] active:scale-95"
        >
          Volver a Arcade
        </button>
      </div>
    </div>
  );
}
