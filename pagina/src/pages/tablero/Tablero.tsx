import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui";
import {
  fetchArcadeLeaderboard,
  type LeaderboardGame,
  type LeaderboardItem,
  type LeaderboardPeriod,
} from "../../services/leaderboardApi";

const GAME_FILTERS: Array<{ key: LeaderboardGame; label: string }> = [
  { key: "all", label: "General" },
  { key: "wordle", label: "Reto Diario" },
  { key: "missing_xi", label: "Missing XI" },
];

const PERIOD_FILTERS: Array<{ key: LeaderboardPeriod; label: string }> = [
  { key: "all", label: "Histórico" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
];

const MEDAL_STYLES: Record<number, { ring: string; chip: string; label: string }> = {
  1: {
    ring: "ring-2 ring-[#d4af37]",
    chip: "bg-[#d4af37] text-[#3a2a05]",
    label: "Oro",
  },
  2: {
    ring: "ring-2 ring-[#9ca3af]",
    chip: "bg-[#9ca3af] text-[#1f2937]",
    label: "Plata",
  },
  3: {
    ring: "ring-2 ring-[#b45309]",
    chip: "bg-[#b45309] text-white",
    label: "Bronce",
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "Sin partidas";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getGameLabel(game: string | null) {
  if (game === "wordle") return "Reto Diario";
  if (game === "missing_xi") return "Missing XI";
  if (game === "all") return "General";
  return "Arcade";
}

function getInitials(name: string) {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PH"
  );
}

function isCurrentUser(row: LeaderboardItem, me: LeaderboardItem | null) {
  return Boolean(me && row.id_usuario === me.id_usuario);
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm ${
        accent
          ? "border-[#162b4d] bg-[#162b4d] text-white"
          : "border-[#dde3ec] bg-white text-[#162b4d]"
      }`}
    >
      <p
        className={`m-0 text-[0.62rem] font-black uppercase tracking-widest ${
          accent ? "text-white/55" : "text-[#9aa3b2]"
        }`}
      >
        {label}
      </p>
      <p className="m-0 mt-1 text-[1.45rem] font-black leading-none">{value}</p>
    </div>
  );
}

function GameSegmented({
  value,
  onChange,
}: {
  value: LeaderboardGame;
  onChange: (next: LeaderboardGame) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-xl border border-[#dde3ec] bg-white p-1 shadow-sm md:w-auto">
      {GAME_FILTERS.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-[0.82rem] font-black transition-colors md:flex-none ${
              active
                ? "bg-[#162b4d] text-white shadow-sm"
                : "text-[#5f6c80] hover:bg-[#f4f6fa] hover:text-[#162b4d]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function PeriodChips({
  value,
  onChange,
}: {
  value: LeaderboardPeriod;
  onChange: (next: LeaderboardPeriod) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIOD_FILTERS.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`rounded-full px-4 py-2 text-[0.76rem] font-black transition-colors ${
              active
                ? "bg-[#cf275f] text-white shadow-sm"
                : "border border-[#dde3ec] bg-white text-[#5f6c80] hover:border-[#cf275f]/45 hover:text-[#cf275f]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function MyPositionBanner({ me }: { me: LeaderboardItem | null }) {
  if (!me) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-[#cbd5e1] bg-white px-4 py-3 shadow-sm">
        <p className="m-0 text-sm font-semibold text-[#7a8494]">
          Juega un reto para entrar a la tabla.
        </p>
        <Link
          to="/arcade"
          className="rounded-lg bg-[#162b4d] px-3 py-1.5 text-[0.76rem] font-black text-white"
        >
          Jugar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#cf275f]/30 bg-[#fff7fa] px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#cf275f] text-[0.78rem] font-black text-white">
          #{me.rank}
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[0.62rem] font-black uppercase tracking-widest text-[#cf275f]">
            Tu posición
          </p>
          <p className="m-0 mt-0.5 truncate text-sm font-black text-[#162b4d]">{me.username}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-right">
        <div>
          <p className="m-0 text-[0.6rem] font-black uppercase tracking-widest text-[#9aa3b2]">
            Puntos
          </p>
          <p className="m-0 mt-0.5 text-sm font-black text-[#162b4d]">
            {formatNumber(me.total_points)}
          </p>
        </div>
        <div className="hidden sm:block">
          <p className="m-0 text-[0.6rem] font-black uppercase tracking-widest text-[#9aa3b2]">
            Acierto
          </p>
          <p className="m-0 mt-0.5 text-sm font-black text-[#cf275f]">
            {formatPercent(me.accuracy)}
          </p>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ player }: { player: LeaderboardItem }) {
  const medal = MEDAL_STYLES[player.rank];
  const isWinner = player.rank === 1;

  return (
    <article
      className={`relative flex flex-col items-center overflow-hidden rounded-xl border bg-white px-5 pb-5 pt-6 text-center shadow-sm ${
        isWinner ? "border-[#162b4d] md:-translate-y-4 md:shadow-md" : "border-[#dde3ec]"
      }`}
    >
      {medal ? (
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-widest ${medal.chip}`}
        >
          {medal.label} · #{player.rank}
        </span>
      ) : null}

      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#263a55] to-[#162b4d] text-base font-black text-white ${
          medal?.ring ?? ""
        }`}
      >
        {getInitials(player.username)}
      </div>

      <h3 className="m-0 mt-3 max-w-[14rem] truncate text-[1rem] font-black text-[#162b4d]">
        {player.username}
      </h3>
      <p className="m-0 mt-1 text-[0.72rem] font-semibold text-[#7a8494]">
        {getGameLabel(player.favorite_game)}
      </p>

      <p className="m-0 mt-4 text-[2rem] font-black leading-none text-[#162b4d]">
        {formatNumber(player.total_points)}
      </p>
      <p className="m-0 mt-1 text-[0.62rem] font-black uppercase tracking-widest text-[#9aa3b2]">
        Puntos
      </p>

      <div className="mt-4 flex w-full items-center justify-center gap-4 border-t border-[#edf0f5] pt-3 text-[0.74rem]">
        <span className="font-semibold text-[#5f6c80]">
          {player.games_played} partidas
        </span>
        <span className="text-[#dde3ec]">·</span>
        <span className="font-black text-[#cf275f]">{formatPercent(player.accuracy)}</span>
      </div>
    </article>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal = MEDAL_STYLES[rank];
  if (medal) {
    return (
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[0.72rem] font-black ${medal.chip}`}
      >
        {rank}
      </span>
    );
  }
  return <span className="text-sm font-black text-[#162b4d]">#{rank}</span>;
}

function LeaderboardRow({ row, me }: { row: LeaderboardItem; me: LeaderboardItem | null }) {
  const current = isCurrentUser(row, me);

  return (
    <tr
      className={`transition-colors ${
        current
          ? "bg-[#fff4f8]"
          : "odd:bg-white even:bg-[#fafbfd] hover:bg-[#f4f6fa]"
      }`}
    >
      <td
        className={`px-4 py-3 ${
          current ? "border-l-4 border-[#cf275f]" : "border-l-4 border-transparent"
        }`}
      >
        <RankBadge rank={row.rank} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#263a55] to-[#162b4d] text-[0.72rem] font-black text-white">
            {getInitials(row.username)}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-sm font-black text-[#162b4d]">{row.username}</p>
            {current ? (
              <p className="m-0 text-[0.66rem] font-black uppercase tracking-widest text-[#cf275f]">
                Tú
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right text-sm font-black text-[#162b4d]">
        {formatNumber(row.total_points)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-[#5f6c80]">
        {row.games_played}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-[#5f6c80]">
        {formatPercent(row.accuracy)}
      </td>
      <td className="hidden px-4 py-3 text-right text-sm font-semibold text-[#5f6c80] lg:table-cell">
        {getGameLabel(row.favorite_game)}
      </td>
      <td className="hidden px-4 py-3 text-right text-sm font-semibold text-[#7a8494] lg:table-cell">
        {formatDate(row.last_played_at)}
      </td>
    </tr>
  );
}

function MobileRow({ row, me }: { row: LeaderboardItem; me: LeaderboardItem | null }) {
  const current = isCurrentUser(row, me);

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm ${
        current ? "border-[#cf275f]/45 bg-[#fff4f8]" : "border-[#dde3ec] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <RankBadge rank={row.rank} />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#263a55] to-[#162b4d] text-[0.76rem] font-black text-white">
            {getInitials(row.username)}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-sm font-black text-[#162b4d]">{row.username}</p>
            <p className="m-0 mt-0.5 text-[0.7rem] font-semibold text-[#7a8494]">
              {getGameLabel(row.favorite_game)} · {row.games_played} partidas
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="m-0 text-[1.05rem] font-black text-[#162b4d]">
            {formatNumber(row.total_points)}
          </p>
          <p className="m-0 text-[0.62rem] font-black uppercase tracking-widest text-[#9aa3b2]">
            Puntos
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#edf0f5] pt-3 text-[0.74rem]">
        <span className="font-semibold text-[#7a8494]">{formatDate(row.last_played_at)}</span>
        <span className="font-black text-[#cf275f]">{formatPercent(row.accuracy)}</span>
      </div>
    </article>
  );
}

export default function Tablero() {
  const [game, setGame] = useState<LeaderboardGame>("all");
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [rows, setRows] = useState<LeaderboardItem[]>([]);
  const [me, setMe] = useState<LeaderboardItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError("");

        const result = await fetchArcadeLeaderboard({
          game,
          period,
          limit: 50,
          signal: controller.signal,
        });

        setRows(result.data);
        setMe(result.me);
      } catch (err) {
        if (controller.signal.aborted) return;
        setRows([]);
        setMe(null);
        setError(err instanceof Error ? err.message : "No se pudo cargar la tabla de clasificación");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadLeaderboard();
    return () => controller.abort();
  }, [game, period]);

  const topThree = rows.slice(0, 3);
  const topPlayer = topThree.find((row) => row.rank === 1) || topThree[0];
  const second = topThree.find((row) => row.rank === 2);
  const third = topThree.find((row) => row.rank === 3);

  const stats = useMemo(() => {
    const totalPlayers = rows.length;
    const topPoints = rows[0]?.total_points || 0;
    const totalGames = rows.reduce((total, row) => total + row.games_played, 0);
    const avgAccuracy =
      rows.length > 0
        ? rows.reduce((total, row) => total + row.accuracy, 0) / rows.length
        : 0;

    return {
      totalPlayers,
      topPoints,
      totalGames,
      avgAccuracy,
    };
  }, [rows]);

  const periodLabel = PERIOD_FILTERS.find((item) => item.key === period)?.label;

  return (
    <main className="ph-page min-w-0">
      <PageHeader
        eyebrow="Tablero"
        title="Tabla de clasificación"
        subtitle="Compara puntos, partidas y aciertos en los juegos de Premier Hub."
        actions={
          <Link
            to="/arcade"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#dde3ec] bg-white px-4 text-sm font-black text-[#162b4d] shadow-sm transition-colors hover:border-[#cf275f]/45 hover:bg-[#fff7fa]"
          >
            Ir a juegos
          </Link>
        }
      />

      <section
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        aria-label="Filtros"
      >
        <GameSegmented value={game} onChange={setGame} />
        <PeriodChips value={period} onChange={setPeriod} />
      </section>

      <MyPositionBanner me={me} />

      {error ? (
        <section className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 shadow-sm">
          <p className="m-0 text-sm font-bold text-red-600">{error}</p>
          <p className="m-0 mt-1 text-[0.78rem] font-semibold text-red-500/75">
            Revisa que las vistas de Supabase ya existan y que el backend esté corriendo.
          </p>
        </section>
      ) : null}

      {loading ? (
        <section className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-xl bg-[#e8edf5]" />
          ))}
        </section>
      ) : null}

      {!loading && !error && topPlayer ? (
        <section
          className="grid gap-4 md:grid-cols-3 md:items-end"
          aria-label="Primeros lugares"
        >
          {second ? (
            <div className="order-2 md:order-1">
              <PodiumCard player={second} />
            </div>
          ) : (
            <div className="hidden md:order-1 md:block" />
          )}
          <div className="order-1 md:order-2">
            <PodiumCard player={topPlayer} />
          </div>
          {third ? (
            <div className="order-3">
              <PodiumCard player={third} />
            </div>
          ) : (
            <div className="hidden md:order-3 md:block" />
          )}
        </section>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <section
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          aria-label="Métricas generales"
        >
          <StatTile label="Jugadores" value={formatNumber(stats.totalPlayers)} />
          <StatTile label="Líder" value={formatNumber(stats.topPoints)} accent />
          <StatTile label="Partidas" value={formatNumber(stats.totalGames)} />
          <StatTile label="Acierto medio" value={formatPercent(stats.avgAccuracy)} />
        </section>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <section className="rounded-xl border border-dashed border-[#cbd5e1] bg-white px-6 py-10 text-center shadow-sm">
          <p className="m-0 text-[1rem] font-black text-[#162b4d]">Aún no hay partidas</p>
          <p className="m-0 mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#7a8494]">
            Cuando los usuarios completen Reto Diario o Missing XI, la clasificación se llenará automáticamente.
          </p>
        </section>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-[#dde3ec] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4">
            <div>
              <p className="m-0 text-[0.7rem] font-black uppercase tracking-widest text-[#cf275f]">
                Clasificación
              </p>
              <h2 className="m-0 mt-1 text-[1.05rem] font-black text-[#162b4d]">
                {getGameLabel(game)} · {periodLabel}
              </h2>
            </div>
            <span className="rounded-full bg-[#f0f2f5] px-3 py-1.5 text-[0.7rem] font-black text-[#5f6c80]">
              Top {rows.length}
            </span>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f8fafc]">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[0.66rem] font-black uppercase tracking-widest text-[#7a8494]">
                    Puesto
                  </th>
                  <th className="px-4 py-3 text-[0.66rem] font-black uppercase tracking-widest text-[#7a8494]">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-right text-[0.66rem] font-black uppercase tracking-widest text-[#7a8494]">
                    Puntos
                  </th>
                  <th className="px-4 py-3 text-right text-[0.66rem] font-black uppercase tracking-widest text-[#7a8494]">
                    Partidas
                  </th>
                  <th className="px-4 py-3 text-right text-[0.66rem] font-black uppercase tracking-widest text-[#7a8494]">
                    Acierto
                  </th>
                  <th className="hidden px-4 py-3 text-right text-[0.66rem] font-black uppercase tracking-widest text-[#7a8494] lg:table-cell">
                    Juego
                  </th>
                  <th className="hidden px-4 py-3 text-right text-[0.66rem] font-black uppercase tracking-widest text-[#7a8494] lg:table-cell">
                    Última
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <LeaderboardRow key={`${row.rank}-${row.id_usuario}`} row={row} me={me} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {rows.map((row) => (
              <MobileRow key={`${row.rank}-${row.id_usuario}`} row={row} me={me} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
