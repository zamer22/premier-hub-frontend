import { useEffect, useState } from "react";
import { Badge, Button, Metric, Modal } from "../../components/ui";
import Login from "../login/Login";
import "./Landing.css";

const YT_VIDEO_ID = "Fi5OWvIii-8";

interface LandingProps {
  onLoginSuccess: (user: any) => void;
}

const features = [
  {
    title: "Partidos en vivo",
    text: "Marcadores, tablas, historial y analisis en una vista pensada para consultar rapido.",
    tone: "accent",
  },
  {
    title: "Progreso fan",
    text: "Puntos, ranking e inventario convierten la actividad en una experiencia medible.",
    tone: "navy",
  },
  {
    title: "Tienda y marketplace",
    text: "Items digitales y objetos reales con estados claros, pedidos y perfil personalizable.",
    tone: "info",
  },
] as const;

export default function Landing({ onLoginSuccess }: LandingProps) {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("ph-modal-open", showLogin);
    document.body.classList.toggle("ph-modal-open", showLogin);

    return () => {
      document.documentElement.classList.remove("ph-modal-open");
      document.body.classList.remove("ph-modal-open");
    };
  }, [showLogin]);

  return (
    <main className="min-h-screen bg-[var(--ph-surface)] text-[var(--ph-text)]">
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto grid min-h-[86vh] w-full max-w-[1180px] grid-cols-[1.05fr_0.95fr] items-center gap-10 px-6 py-10 max-[860px]:grid-cols-1 max-[860px]:pt-8">
          <div className="relative z-10">
            <Badge tone="accent">Sports SaaS para fans PL</Badge>
            <h1 className="mt-6 max-w-[760px] text-[clamp(2.5rem,7vw,5.6rem)] font-black leading-[0.98] text-[var(--ph-text-strong)]">
              PremierHub
            </h1>
            <p className="mt-5 max-w-[620px] text-lg leading-8 text-[var(--ph-muted)]">
              Un dashboard moderno para seguir partidos, competir por puntos, administrar tu perfil y vivir la Premier League con una capa ligera de juego.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => setShowLogin(true)}>Entrar a PremierHub</Button>
              <a className="ph-button ph-button--secondary" href="#features">Ver experiencia</a>
            </div>

            <div className="mt-10 grid max-w-[720px] grid-cols-4 gap-3 max-[680px]:grid-cols-2">
              <Metric value="20" label="Equipos" />
              <Metric value="380" label="Partidos" />
              <Metric value="Rank" label="Competencia" />
              <Metric value="Shop" label="Items" />
            </div>
          </div>

          <div className="relative">
            <div className="ph-panel relative overflow-hidden p-0 shadow-[var(--ph-shadow-md)]">
              <div className="border-b border-[var(--ph-border)] bg-[var(--ph-navy-800)] p-4 text-white">
                <div className="flex items-center justify-between">
                  <strong>Match Center</strong>
                  <span className="ph-badge ph-badge--accent">Live</span>
                </div>
              </div>
              <div className="grid gap-4 p-5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-[var(--ph-border)] bg-[var(--ph-surface)] p-4">
                  <Team name="Arsenal" score="2" />
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--ph-muted)]">68'</span>
                  <Team name="Chelsea" score="1" align="right" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Metric value="61%" label="Posesion" />
                  <Metric value="14" label="Tiros" />
                  <Metric value="+320" label="Puntos" />
                </div>
                <div className="rounded-xl border border-[var(--ph-border)] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <strong className="text-sm text-[var(--ph-text-strong)]">Leaderboard</strong>
                    <Badge tone="warning">Streak x4</Badge>
                  </div>
                  {["Migue", "PremierFan99", "NorthBank"].map((name, index) => (
                    <div key={name} className="flex items-center justify-between border-t border-[var(--ph-border)] py-2 first:border-t-0">
                      <span className="text-sm font-bold text-[var(--ph-text)]">#{index + 1} {name}</span>
                      <span className="text-sm font-black text-[var(--ph-red-600)]">{(9200 - index * 740).toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[var(--ph-border)] bg-[var(--ph-surface)] px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="ph-page-header mb-8">
            <div>
              <p className="ph-eyebrow">Experiencia</p>
              <h2 className="ph-title">Una app mas clara, viva y consistente.</h2>
              <p className="ph-subtitle">
                La interfaz prioriza lectura rapida y acciones obvias; los detalles gamificados aparecen en puntos, progreso, rankings y colecciones.
              </p>
            </div>
          </div>
          <div className="ph-grid">
            {features.map((feature) => (
              <article key={feature.title} className="ph-data-card p-5">
                <Badge tone={feature.tone}>{feature.title}</Badge>
                <p className="mt-4 text-sm leading-7 text-[var(--ph-muted)]">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-[1180px] grid-cols-[0.9fr_1.1fr] items-center gap-10 max-[860px]:grid-cols-1">
          <div>
            <p className="ph-eyebrow">Premier League</p>
            <h2 className="ph-title">Datos, comunidad y tienda en una misma superficie.</h2>
            <p className="ph-subtitle">
              PremierHub deja de sentirse como paginas separadas y pasa a funcionar como una sola app deportiva.
            </p>
            <Button className="mt-7" onClick={() => setShowLogin(true)}>Comenzar ahora</Button>
          </div>
          <div className="overflow-hidden rounded-[var(--ph-radius-lg)] border border-[var(--ph-border)] bg-[var(--ph-navy-800)] shadow-[var(--ph-shadow-md)]">
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?rel=0&modestbranding=1`}
                title="Premier League Highlights"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="block h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[var(--ph-navy-950)] px-6 py-8 text-center">
        <strong className="text-white"><span className="text-[var(--ph-red-600)]">Premier</span>Hub</strong>
        <p className="mt-2 text-xs font-semibold text-white/40">Una pagina de fans para fans</p>
      </footer>

      {showLogin && (
        <Modal onClose={() => setShowLogin(false)}>
          <Login onLoginSuccess={onLoginSuccess} />
        </Modal>
      )}
    </main>
  );
}

function Team({ name, score, align }: { name: string; score: string; align?: "right" }) {
  return (
    <div className={`grid gap-1 ${align === "right" ? "text-right" : ""}`}>
      <span className="text-xs font-black uppercase tracking-[0.06em] text-[var(--ph-muted)]">{name}</span>
      <span className="text-4xl font-black text-[var(--ph-text-strong)]">{score}</span>
    </div>
  );
}
