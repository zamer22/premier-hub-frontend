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
        subtitle="Juegos rápidos basados en datos, rankings y preguntas diarias de la Premier League."
      />

      <section
        className="mx-auto mt-6 grid w-full max-w-[1500px] grid-cols-1 items-start gap-x-10 gap-y-12 pb-6 md:grid-cols-2 2xl:grid-cols-4"
        aria-label="Juegos disponibles"
      >
        {/* ── Reto Diario ─────────────────────────── */}
        <Link
          to="/arcade/wordle"
          className="group flex min-h-[620px] flex-col text-inherit no-underline"
        >
          <article className="flex h-[490px] flex-col overflow-hidden rounded-xl border border-[#ddd8e6] bg-white shadow-[0_18px_38px_rgba(27,34,61,0.07)] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#cf275f]/50 group-hover:shadow-[0_24px_46px_rgba(207,39,95,0.16)]">
            <div className="flex flex-1 flex-col bg-[#f7f8fb] px-8 pb-8 pt-7">
              <div className="mb-5 text-center">
                <h3 className="m-0 text-[1.05rem] font-black leading-tight text-[#162b4d]">
                  Más ----- en Premier League
                </h3>
                <span className="mx-auto mt-2 block h-1 w-[54px] rounded-full bg-[#cf275f]" />
                <p className="m-0 mt-3 text-[0.76rem] font-medium text-[#7b8494]">
                  Ordena de mayor a menor
                </p>
              </div>

              {/* Preview grid — grows to fill */}
              <div className="flex flex-1 flex-col justify-center rounded-xl border border-[#ddd8e6] bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <div className="grid grid-cols-4 gap-4">
                  {PREVIEW_PLAYERS.map((player) => (
                    <div
                      key={player.rank}
                      className="relative h-[104px] overflow-hidden rounded-lg border border-[#e5e7ee] bg-[#eef1f5]"
                    >
                      <span className="absolute left-1.5 top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#162b4d]/85 px-1 text-[0.64rem] font-extrabold text-white">
                        {player.rank}
                      </span>
                      <div className="flex h-[76px] items-center justify-center bg-gradient-to-br from-[#263a55] to-[#314762] text-[1.15rem] font-black text-white">
                        {player.initials}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 truncate bg-[#871d54] px-1.5 py-1 text-center text-[0.55rem] font-extrabold text-white">
                        {player.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <div className="mt-5 flex min-h-[110px] flex-col items-center text-center">
            <p className="m-0 text-[1.15rem] font-black text-[#162b4d]">Reto Diario</p>
            <p className="m-0 mt-2 max-w-[420px] text-[0.92rem] leading-relaxed text-[#5f6c80]">
              Ordena jugadores de mayor a menor según la pregunta diaria.
            </p>
            <span className="mt-3 text-[0.82rem] font-bold text-[#cf275f] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Jugar →
            </span>
          </div>
        </Link>

        {/* ── Missing XI ──────────────────────────── */}
        <Link
          to="/arcade/missing-xi"
          className="group flex min-h-[620px] flex-col text-inherit no-underline"
        >
          <article className="flex h-[490px] flex-col overflow-hidden rounded-xl border border-[#ddd8e6] bg-white shadow-[0_18px_38px_rgba(27,34,61,0.07)] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#cf275f]/50 group-hover:shadow-[0_24px_46px_rgba(207,39,95,0.16)]">
            <div className="relative flex flex-1 flex-col bg-[#f7f8fb] px-8 pb-8 pt-7">
              <div className="mb-4 text-center">
                <h3 className="m-0 text-[1.05rem] font-black leading-tight text-[#162b4d]">
                  Adivina la Alineación
                </h3>
                <span className="mx-auto mt-2 block h-1 w-[54px] rounded-full bg-[#cf275f]" />
                <p className="m-0 mt-3 text-[0.76rem] font-medium text-[#7b8494]">
                  Partido histórico de Premier League
                </p>
              </div>

              {/* Mini pitch — grows to match sibling card */}
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-green-700 shadow-inner">
                <div className="pointer-events-none absolute inset-[5px] rounded border border-white/30" />
                <div className="pointer-events-none absolute left-[5px] right-[5px] top-1/2 h-px bg-white/25" />

                <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-3 py-4">
                  {/* Attack */}
                  <div className="flex gap-10">
                    {(["LW", "ST", "RW"] as const).map((pos) => (
                      <div key={pos} className="flex flex-col items-center gap-0.5">
                        <div className="flex h-11 w-10 items-center justify-center rounded bg-gradient-to-b from-[#6f7b8d] to-[#374151] shadow-sm">
                          <span className="text-[0.6rem] font-black text-white">?</span>
                        </div>
                        <span className="text-[0.45rem] font-bold text-white/60">{pos}</span>
                      </div>
                    ))}
                  </div>
                  {/* Midfield */}
                  <div className="flex gap-10">
                    {(["CM", "CDM", "CM"] as const).map((pos, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div className="flex h-11 w-10 items-center justify-center rounded bg-gradient-to-b from-[#6f7b8d] to-[#374151] shadow-sm">
                          <span className="text-[0.6rem] font-black text-white">?</span>
                        </div>
                        <span className="text-[0.45rem] font-bold text-white/60">{pos}</span>
                      </div>
                    ))}
                  </div>
                  {/* Defense */}
                  <div className="flex gap-7">
                    {(["LB", "CB", "CB", "RB"] as const).map((pos, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div className="flex h-11 w-10 items-center justify-center rounded bg-gradient-to-b from-[#6f7b8d] to-[#374151] shadow-sm">
                          <span className="text-[0.6rem] font-black text-white">?</span>
                        </div>
                        <span className="text-[0.45rem] font-bold text-white/60">{pos}</span>
                      </div>
                    ))}
                  </div>
                  {/* GK */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex h-11 w-10 items-center justify-center rounded bg-gradient-to-b from-[#6f7b8d] to-[#374151] shadow-sm">
                      <span className="text-[0.6rem] font-black text-white">?</span>
                    </div>
                    <span className="text-[0.45rem] font-bold text-white/60">GK</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="mt-5 flex min-h-[110px] flex-col items-center text-center">
            <p className="m-0 text-[1.15rem] font-black text-[#162b4d]">Missing XI</p>
            <p className="m-0 mt-2 max-w-[420px] text-[0.92rem] leading-relaxed text-[#5f6c80]">
              Adivina la alineación titular del equipo ganador de un partido histórico.
            </p>
            <span className="mt-3 text-[0.82rem] font-bold text-[#cf275f] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Jugar →
            </span>
          </div>
        </Link>
      </section>
    </main>
  );
}
