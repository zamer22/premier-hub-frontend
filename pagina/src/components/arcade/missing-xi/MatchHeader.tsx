import type { MissingXIMatch } from "../../../types/missingXI";

interface Props {
  match: MissingXIMatch;
}

export default function MatchHeader({ match }: Props) {
  return (
    <div className="rounded-2xl border border-[#dde3ec] bg-white px-6 py-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[0.78rem] font-bold uppercase tracking-wide text-[#5f6c80]">
          {match.league} · {match.season}
        </span>
        <span className="text-[0.78rem] font-semibold text-[#9aa3b2]">{match.date}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex-1 text-right text-[1rem] font-black leading-tight ${
            match.winner === match.homeTeam ? "text-[#162b4d]" : "text-[#9aa3b2]"
          }`}
        >
          {match.homeTeam}
        </span>

        <div className="flex shrink-0 items-center gap-2.5 rounded-xl bg-[#162b4d] px-4 py-2 text-white shadow-sm">
          <span className="text-[1.35rem] font-black">{match.homeScore}</span>
          <span className="text-[0.85rem] opacity-40">–</span>
          <span className="text-[1.35rem] font-black">{match.awayScore}</span>
        </div>

        <span
          className={`flex-1 text-left text-[1rem] font-black leading-tight ${
            match.winner === match.awayTeam ? "text-[#162b4d]" : "text-[#9aa3b2]"
          }`}
        >
          {match.awayTeam}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-[#cf275f]" />
        <span className="text-[0.78rem] font-bold text-[#cf275f]">
          Ganador: {match.winner}
        </span>
        <span className="text-[0.78rem] text-[#dde3ec]">·</span>
        <span className="text-[0.78rem] font-semibold text-[#9aa3b2]">
          {match.formation}
        </span>
      </div>
    </div>
  );
}
