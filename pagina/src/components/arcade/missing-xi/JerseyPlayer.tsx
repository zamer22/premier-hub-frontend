import type { MissingXIPlayer } from "../../../types/missingXI";

interface Props {
  player: MissingXIPlayer;
  onClick: () => void;
}

export default function JerseyPlayer({ player, onClick }: Props) {
  const isClickable = !player.guessed && !player.failed;

  const jerseyGradient = player.guessed
    ? "from-[#b6f000] to-[#16a34a]"
    : player.failed
      ? "from-[#ff334e] to-[#a30f2d]"
      : "from-[#6f7b8d] to-[#374151]";

  const label = player.guessed
    ? player.lastName.toUpperCase()
    : player.failed
      ? player.answer
      : player.position;

  const labelColor = player.guessed
    ? "text-lime-200"
    : player.failed
      ? "text-red-200"
      : "text-white/85";

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`group flex flex-col items-center gap-[3px] ${
        isClickable ? "cursor-pointer" : "cursor-default"
      }`}
      aria-label={
        isClickable
          ? `Adivinar #${player.number} ${player.position}`
          : `${player.firstName} ${player.lastName}`
      }
    >
      {/* Jersey */}
      <div
        className={`relative flex h-12 w-11 items-center justify-center transition-transform ${
          isClickable ? "group-hover:scale-110 group-active:scale-95" : ""
        }`}
      >
        {/* Body */}
        <div
          className={`absolute inset-0 rounded-[6px] bg-gradient-to-b ${jerseyGradient} shadow-lg`}
        >
          {/* Collar */}
          <div className="absolute left-1/2 top-0 h-2.5 w-4 -translate-x-1/2 rounded-b-full bg-white/25" />
        </div>
        {/* Left sleeve */}
        <div
          className={`absolute -left-2.5 top-1 h-5 w-3 rounded-l-[5px] bg-gradient-to-b ${jerseyGradient} shadow-md`}
        />
        {/* Right sleeve */}
        <div
          className={`absolute -right-2.5 top-1 h-5 w-3 rounded-r-[5px] bg-gradient-to-b ${jerseyGradient} shadow-md`}
        />
        {/* Number */}
        <span className="relative z-10 text-[0.82rem] font-black leading-none text-white drop-shadow-sm">
          {player.number}
        </span>

        {/* Clickable ring pulse */}
        {isClickable && (
          <span className="absolute -inset-0.5 animate-ping rounded-[7px] bg-white/15" />
        )}
      </div>

      {/* Label */}
      <span
        className={`max-w-[58px] truncate text-center text-[0.55rem] font-bold leading-tight drop-shadow ${labelColor}`}
      >
        {label}
      </span>
    </button>
  );
}
