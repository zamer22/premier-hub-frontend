import type { LetterResult } from "../../../types/missingXI";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

interface Props {
  letterStates: Record<string, LetterResult | undefined>;
  onKey: (key: string) => void;
  compact?: boolean;
}

function keyBg(state: LetterResult | undefined): string {
  if (state === "correct") return "bg-green-500 text-white border-green-500";
  if (state === "present") return "bg-yellow-400 text-white border-yellow-400";
  if (state === "absent") return "bg-[#3a4152] text-white border-[#3a4152]";
  return "bg-[#edf0f5] text-[#162b4d] border-[#dde3ec] hover:bg-[#e2e6ec] active:bg-[#d5dae4]";
}

export default function WordleKeyboard({ letterStates, onKey, compact = false }: Props) {
  return (
    <div className={`mx-auto flex w-full max-w-[500px] flex-col items-center ${compact ? "gap-1 px-1 py-2" : "gap-1.5 px-2 py-3"}`}>
      {ROWS.map((row, ri) => (
        <div key={ri} className={`flex w-full ${compact ? "gap-1" : "gap-1.5"}`}>
          {row.map((key) => {
            const isSpecial = key === "ENTER" || key === "⌫";
            return (
              <button
                key={key}
                type="button"
                onClick={() => onKey(key)}
                className={`flex min-w-0 select-none items-center justify-center rounded-lg border font-black uppercase transition-colors active:scale-95 ${
                  compact
                    ? "h-[clamp(2.1rem,8vw,2.75rem)]"
                    : "h-[clamp(2.4rem,9vw,3.25rem)]"
                } ${
                  isSpecial ? "flex-[1.6] px-0.5 text-[0.6rem]" : "flex-1 text-[clamp(0.6rem,2.6vw,0.85rem)]"
                } ${keyBg(isSpecial ? undefined : letterStates[key])}`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
