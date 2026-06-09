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
  const accuracy = players.length > 0 ? Math.round((guessed.length / players.length) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-[980px] px-3 pb-4">
      <div className="overflow-hidden rounded-2xl border border-[#dde3ec] bg-white shadow-[0_18px_46px_rgba(27,34,61,0.09)]">
        <div className="grid gap-4 bg-[#f7f8fb] p-4 sm:p-5 lg:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.25fr)]">
          <section className="flex flex-col justify-between rounded-2xl bg-[#162b4d] p-4 text-white shadow-sm">
            <div>
              <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/58">
                Resultado final
              </p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-[3.1rem] font-black leading-none">{totalPoints}</span>
                <span className="pb-1 text-[0.78rem] font-bold text-white/62">puntos</span>
              </div>
              {saveMessage ? (
                <p className="m-0 mt-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-[0.72rem] font-bold text-white">
                  {saveMessage}
                </p>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 px-2 py-2 text-center">
                <span className="block text-xl font-black text-[#7ee2a8]">{guessed.length}</span>
                <span className="text-[0.62rem] font-bold uppercase tracking-wide text-white/58">Ok</span>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-2 text-center">
                <span className="block text-xl font-black text-[#ff9ba6]">{failed.length}</span>
                <span className="text-[0.62rem] font-bold uppercase tracking-wide text-white/58">Fallos</span>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-2 text-center">
                <span className="block text-xl font-black text-white">{accuracy}%</span>
                <span className="text-[0.62rem] font-bold uppercase tracking-wide text-white/58">Acierto</span>
              </div>
            </div>
          </section>

          <section className="flex min-w-0 flex-col gap-3">
            <div className="rounded-2xl border border-[#dde3ec] bg-white px-4 py-3 shadow-sm">
              <p className="m-0 text-[0.68rem] font-bold uppercase tracking-wide text-[#5f6c80]">
                {match.league} · {match.season} · {match.date}
              </p>
              <p className="m-0 mt-1 text-[1rem] font-black leading-tight text-[#162b4d]">
                {match.homeTeam} {match.homeScore} – {match.awayScore} {match.awayTeam}
              </p>
              <p className="m-0 mt-1 text-[0.72rem] font-bold text-[#cf275f]">
                Ganador: {match.winner}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onRestart}
                className="rounded-xl bg-[#cf275f] px-3 py-2.5 text-[0.82rem] font-black text-white shadow-md transition-colors hover:bg-[#b02050] active:scale-95"
              >
                Jugar otra vez
              </button>
              <button
                type="button"
                onClick={onBackToArcade}
                className="rounded-xl border border-[#dde3ec] bg-white px-3 py-2.5 text-[0.82rem] font-black text-[#162b4d] transition-colors hover:bg-[#f6f8fb] active:scale-95"
              >
                Volver a Arcade
              </button>
            </div>
          </section>
        </div>

        <section className="p-4 pt-3 sm:p-5 sm:pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="m-0 text-[0.7rem] font-black uppercase tracking-[0.16em] text-[#5f6c80]">
              Desglose del XI
            </p>
            <p className="m-0 text-[0.7rem] font-bold text-[#98a2b3]">
              {players.length} jugadores
            </p>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[0.72rem] ${
                  p.guessed
                    ? "border-green-100 bg-green-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <span className="min-w-0 truncate font-bold text-[#162b4d]">
                  #{p.number ?? "?"} {p.position} · {p.firstName} {p.lastName}
                </span>
                <span className={`shrink-0 font-black ${p.guessed ? "text-green-600" : "text-red-500"}`}>
                  {p.guessed ? (p.usedHint ? "+50" : "+100") : "0"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
