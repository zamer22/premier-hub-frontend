import type { MissingXIMatch } from "../../../types/missingXI";

interface Props {
  match: MissingXIMatch;
}

export default function MatchHeader({ match }: Props) {
  return (
    <div className="rounded-xl border border-[#dde3ec] bg-white p-4 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-[#5f6c80]">
          {match.league} · {match.season}
        </span>
        <span className="text-[0.68rem] font-medium text-[#9aa3b2]">{match.date}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex-1 text-right text-[0.82rem] font-black leading-tight ${
            match.winner === match.homeTeam ? "text-[#162b4d]" : "text-[#9aa3b2]"
          }`}
        >
          {match.homeTeam}
        </span>

        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[#162b4d] px-3 py-1.5 text-white">
          <span className="text-[1rem] font-black">{match.homeScore}</span>
          <span className="text-[0.65rem] opacity-40">–</span>
          <span className="text-[1rem] font-black">{match.awayScore}</span>
        </div>

        <span
          className={`flex-1 text-left text-[0.82rem] font-black leading-tight ${
            match.winner === match.awayTeam ? "text-[#162b4d]" : "text-[#9aa3b2]"
          }`}
        >
          {match.awayTeam}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cf275f]" />
        <span className="text-[0.68rem] font-semibold text-[#cf275f]">
          Ganador: {match.winner}
        </span>
        <span className="text-[0.68rem] text-[#dde3ec]">·</span>
        <span className="text-[0.68rem] font-medium text-[#9aa3b2]">
          {match.formation}
        </span>
      </div>
    </div>
  );
}
