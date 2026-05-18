import type { MissingXIPlayer } from "../../../types/missingXI";
import JerseyPlayer from "./JerseyPlayer";

interface Props {
  players: MissingXIPlayer[];
  onSelectPlayer: (id: string) => void;
}

export default function Pitch({ players, onSelectPlayer }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-green-700 shadow-2xl aspect-[9/14]">
      {/* Grass stripes */}
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="pointer-events-none absolute left-0 right-0 bg-green-800/20"
          style={{ top: `${i * 14.28}%`, height: "7.14%" }}
        />
      ))}

      {/* Outer border */}
      <div className="pointer-events-none absolute inset-[8px] rounded border-2 border-white/40" />

      {/* Center line */}
      <div className="pointer-events-none absolute left-[8px] right-[8px] top-1/2 h-[2px] bg-white/40" />

      {/* Center circle */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />

      {/* Center dot */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />

      {/* Top penalty area */}
      <div className="pointer-events-none absolute left-1/2 top-[8px] h-[16%] w-[55%] -translate-x-1/2 rounded-b-sm border-2 border-t-0 border-white/40" />

      {/* Top goal area */}
      <div className="pointer-events-none absolute left-1/2 top-[8px] h-[8%] w-[28%] -translate-x-1/2 rounded-b-sm border-2 border-t-0 border-white/40" />

      {/* Bottom penalty area */}
      <div className="pointer-events-none absolute bottom-[8px] left-1/2 h-[16%] w-[55%] -translate-x-1/2 rounded-t-sm border-2 border-b-0 border-white/40" />

      {/* Bottom goal area */}
      <div className="pointer-events-none absolute bottom-[8px] left-1/2 h-[8%] w-[28%] -translate-x-1/2 rounded-t-sm border-2 border-b-0 border-white/40" />

      {/* Corner arcs */}
      {[
        "top-[8px] left-[8px] rounded-br-full border-r-2 border-b-2 border-t-0 border-l-0",
        "top-[8px] right-[8px] rounded-bl-full border-l-2 border-b-2 border-t-0 border-r-0",
        "bottom-[8px] left-[8px] rounded-tr-full border-r-2 border-t-2 border-b-0 border-l-0",
        "bottom-[8px] right-[8px] rounded-tl-full border-l-2 border-t-2 border-b-0 border-r-0",
      ].map((cls, i) => (
        <div
          key={i}
          className={`pointer-events-none absolute h-5 w-5 border-white/40 ${cls}`}
        />
      ))}

      {/* Players */}
      {players.map((player) => (
        <div
          key={player.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${player.xPercent}%`, top: `${player.yPercent}%` }}
        >
          <JerseyPlayer
            player={player}
            onClick={() => onSelectPlayer(player.id)}
          />
        </div>
      ))}
    </div>
  );
}
