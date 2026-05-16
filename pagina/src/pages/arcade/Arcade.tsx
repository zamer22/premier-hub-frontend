import { Link } from "react-router-dom";

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

const GAMES = [
  {
    name: "Reto Diario",
    path: "/arcade/wordle",
    question: "Más ----- en Premier League",
    description: "Ordena jugadores de mayor a menor según la pregunta diaria.",
  },
] as const;

export default function Arcade() {
  return (
    <main className="w-full">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 mb-[0.45rem] text-[1.5rem] font-extrabold uppercase text-[#7b8494]">
            ARCADE
          </p>
          <h2 className="m-0 text-[clamp(2rem,2.8vw,3.2rem)] font-black leading-tight tracking-[-0.03em] text-[#162b4d]">
            Elige un reto de Premier Hub
          </h2>
        </div>
      </header>

      <section
        className="grid max-w-[1040px] grid-cols-[repeat(auto-fill,minmax(280px,360px))] gap-7"
        aria-label="Juegos disponibles"
      >
        {GAMES.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className="group block text-inherit no-underline"
          >
            <article className="overflow-hidden rounded-lg border border-[#ddd8e6] bg-white shadow-[0_20px_40px_rgba(27,34,61,0.08)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_24px_46px_rgba(27,34,61,0.13)]">
              <div className="bg-[#f7f8fb] px-5 pb-5 pt-4">
                <div className="mb-4 text-center">
                  <h3 className="m-0 text-[1.05rem] font-black leading-tight text-[#162b4d]">
                    {game.question}
                  </h3>
                  <span className="mx-auto mt-2 block h-1 w-[54px] rounded-full bg-[#cf275f]" />
                  <p className="m-0 mt-3 text-[0.76rem] font-medium text-[#7b8494]">
                    Ordena de mayor a menor
                  </p>
                </div>

                <div className="rounded-lg border border-[#ddd8e6] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <div className="grid grid-cols-4 gap-2">
                    {PREVIEW_PLAYERS.map((player) => (
                      <div
                        key={player.rank}
                        className="relative h-[78px] overflow-hidden rounded-md border border-[#e5e7ee] bg-[#eef1f5]"
                      >
                        <span className="absolute left-1.5 top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#162b4d]/85 px-1 text-[0.64rem] font-extrabold text-white">
                          {player.rank}
                        </span>
                        <div className="flex h-[56px] items-center justify-center bg-gradient-to-br from-[#263a55] to-[#314762] text-[0.95rem] font-black text-white">
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

            <div className="mt-3 flex flex-col items-center text-center">
              <p className="m-0 text-[1rem] font-black text-[#162b4d]">
                {game.name}
              </p>
              <p className="m-0 mt-1 max-w-[285px] text-[0.8rem] leading-snug text-[#5f6c80]">
                {game.description}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
