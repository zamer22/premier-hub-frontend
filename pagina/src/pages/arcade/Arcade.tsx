import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui";

const PREVIEW_PLAYERS = [
  { initials: "TS", name: "Teddy", rank: 1 },
  { initials: "MO", name: "Owen", rank: 2 },
  { initials: "JV", name: "Vardy", rank: 3 },
  { initials: "TH", name: "Henry", rank: 4 },
  { initials: "WR", name: "Rooney", rank: 5 },
  { initials: "LF", name: "Ferdinand", rank: 6 },
  { initials: "MS", name: "Salah", rank: 7 },
  { initials: "AC", name: "Cole", rank: 8 },
] as const;

export default function Arcade() {
  return (
    <main className="ph-page">
      <PageHeader
        eyebrow="Arcade"
        title="Elige un reto de Premier Hub"
        subtitle="Juegos rápidos basados en datos, clasificaciones y preguntas diarias de la Premier League."
      />

      <section
        className="mx-auto mt-4 grid w-full max-w-[1200px] grid-cols-1 items-stretch gap-x-5 gap-y-6 pb-3 sm:grid-cols-2"
        aria-label="Juegos disponibles"
      >
        {/* ── Reto Diario ─────────────────────────── */}
        <Link
          to="/arcade/wordle"
          className="group flex h-full flex-col text-inherit no-underline"
        >
          <article className="@container flex flex-1 flex-col overflow-hidden rounded-xl border border-[#ddd8e6] bg-white shadow-[0_14px_30px_rgba(27,34,61,0.07)] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#cf275f]/50 group-hover:shadow-[0_20px_38px_rgba(207,39,95,0.16)]">
            <div className="flex flex-1 flex-col bg-[#f7f8fb] px-5 pb-5 pt-4">
              <div className="mb-3 text-center">
                <h3 className="m-0 text-[1rem] font-black leading-tight text-[#162b4d] sm:text-[1.05rem]">
                  Más ----- en Premier League
                </h3>
                <span className="mx-auto mt-1.5 block h-1 w-14 rounded-full bg-[#cf275f]" />
                <p className="m-0 mt-1.5 text-[0.78rem] font-medium text-[#7b8494] sm:text-[0.82rem]">
                  Ordena de mayor a menor
                </p>
              </div>

              {/* Preview grid — grows to fill */}
              <div className="flex flex-1 flex-col justify-center rounded-xl border border-[#ddd8e6] bg-white p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <div className="grid grid-cols-4 gap-[3cqw]">
                  {PREVIEW_PLAYERS.map((player) => (
                    <div
                      key={player.rank}
                      className="relative flex aspect-[4/5] flex-col overflow-hidden rounded-lg border border-[#e5e7ee] bg-[#eef1f5]"
                    >
                      <span className="absolute left-1.5 top-1.5 z-10 flex h-[3.3cqw] min-w-[3.3cqw] items-center justify-center rounded-full bg-[#162b4d]/85 px-1 text-[1.65cqw] font-extrabold text-white">
                        {player.rank}
                      </span>
                      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-[#263a55] to-[#314762] text-[3.2cqw] font-black text-white">
                        {player.initials}
                      </div>
                      <div className="truncate bg-[#871d54] px-1.5 py-0.5 text-center text-[1.5cqw] font-extrabold text-white">
                        {player.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <div className="mt-3 flex min-h-[78px] flex-col items-center text-center">
            <p className="m-0 text-[0.98rem] font-black text-[#162b4d]">Reto Diario</p>
            <p className="m-0 mt-1 max-w-[430px] text-[0.8rem] leading-relaxed text-[#5f6c80]">
              Ordena jugadores de mayor a menor según la pregunta diaria.
            </p>
            <span className="mt-1.5 text-[0.76rem] font-bold text-[#cf275f] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Jugar →
            </span>
          </div>
        </Link>

        {/* ── Missing XI ──────────────────────────── */}
        <Link
          to="/arcade/missing-xi"
          className="group flex h-full flex-col text-inherit no-underline"
        >
          <article className="@container flex flex-1 flex-col overflow-hidden rounded-xl border border-[#ddd8e6] bg-white shadow-[0_14px_30px_rgba(27,34,61,0.07)] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#cf275f]/50 group-hover:shadow-[0_20px_38px_rgba(207,39,95,0.16)]">
            <div className="relative flex flex-1 flex-col bg-[#f7f8fb] px-5 pb-5 pt-4">
              <div className="mb-3 text-center">
                <h3 className="m-0 text-[1rem] font-black leading-tight text-[#162b4d] sm:text-[1.05rem]">
                  Adivina la alineación
                </h3>
                <span className="mx-auto mt-1.5 block h-1 w-14 rounded-full bg-[#cf275f]" />
                <p className="m-0 mt-1.5 text-[0.78rem] font-medium text-[#7b8494] sm:text-[0.82rem]">
                  Partido histórico de Premier League
                </p>
              </div>

              {/* Mini pitch — grows to match sibling card */}
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-green-700 shadow-inner">
                <div className="pointer-events-none absolute inset-[5px] rounded border border-white/30" />
                <div className="pointer-events-none absolute left-[5px] right-[5px] top-1/2 h-px bg-white/25" />

                <div className="flex flex-1 flex-col items-center justify-between px-[4.6cqw] py-[4.2cqw]">
                  {/* Attack */}
                  <div className="flex gap-[6.4cqw]">
                    {(["LW", "ST", "RW"] as const).map((pos) => (
                      <div key={pos} className="flex flex-col items-center gap-0.5">
                        <div className="flex aspect-[10/11] w-[6.6cqw] items-center justify-center rounded bg-gradient-to-b from-[#6f7b8d] to-[#374151] shadow-sm">
                          <span className="text-[1.75cqw] font-black text-white">?</span>
                        </div>
                        <span className="text-[1.28cqw] font-bold text-white/60">{pos}</span>
                      </div>
                    ))}
                  </div>
                  {/* Midfield */}
                  <div className="flex gap-[6.4cqw]">
                    {(["CM", "CDM", "CM"] as const).map((pos, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div className="flex aspect-[10/11] w-[6.6cqw] items-center justify-center rounded bg-gradient-to-b from-[#6f7b8d] to-[#374151] shadow-sm">
                          <span className="text-[1.75cqw] font-black text-white">?</span>
                        </div>
                        <span className="text-[1.28cqw] font-bold text-white/60">{pos}</span>
                      </div>
                    ))}
                  </div>
                  {/* Defense */}
                  <div className="flex gap-[3.6cqw]">
                    {(["LB", "CB", "CB", "RB"] as const).map((pos, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div className="flex aspect-[10/11] w-[6.6cqw] items-center justify-center rounded bg-gradient-to-b from-[#6f7b8d] to-[#374151] shadow-sm">
                          <span className="text-[1.75cqw] font-black text-white">?</span>
                        </div>
                        <span className="text-[1.28cqw] font-bold text-white/60">{pos}</span>
                      </div>
                    ))}
                  </div>
                  {/* GK */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex aspect-[10/11] w-[6.6cqw] items-center justify-center rounded bg-gradient-to-b from-[#6f7b8d] to-[#374151] shadow-sm">
                      <span className="text-[1.75cqw] font-black text-white">?</span>
                    </div>
                    <span className="text-[1.28cqw] font-bold text-white/60">GK</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="mt-3 flex min-h-[78px] flex-col items-center text-center">
            <p className="m-0 text-[0.98rem] font-black text-[#162b4d]">Missing XI</p>
            <p className="m-0 mt-1 max-w-[430px] text-[0.8rem] leading-relaxed text-[#5f6c80]">
              Adivina la alineación titular del equipo ganador de un partido histórico.
            </p>
            <span className="mt-1.5 text-[0.76rem] font-bold text-[#cf275f] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Jugar →
            </span>
          </div>
        </Link>

      </section>
    </main>
  );
}
