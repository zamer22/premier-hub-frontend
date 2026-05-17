import { useEffect, useState } from "react";
import Login from "../login/Login";
import "./Landing.css";

const YT_VIDEO_ID = "Fi5OWvIii-8";

interface LandingProps {
  onLoginSuccess: (user: any) => void;
}

export default function Landing({ onLoginSuccess }: LandingProps) {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!showLogin) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowLogin(false);
    };

    document.documentElement.classList.add("ph-modal-open");
    document.body.classList.add("ph-modal-open");
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.documentElement.classList.remove("ph-modal-open");
      document.body.classList.remove("ph-modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showLogin]);

  return (
    <>
      <section className="landing-hero">
        <div className="landing-hero__bg">
          <div className="landing-hero__orb landing-hero__orb--one" />
          <div className="landing-hero__orb landing-hero__orb--two" />
          <div className="landing-hero__grid" />
        </div>

        <div className="landing-hero__content">
          <div className="lnd-1 landing-hero__badge">
            <span className="landing-hero__badge-text">
              Premier League · Temporada 24/25
            </span>
          </div>

          <h1 className="lnd-2 landing-hero__title">
            Tu hub de{" "}
            <span className="landing-hero__title-accent">Premier</span>
            <br />
            <span className="landing-hero__title-muted">League</span>
          </h1>

          <p className="lnd-3 landing-hero__lead">
            Sigue los partidos en vivo, compite en el leaderboard, consigue objetos exclusivos
            y demuestra que sabes de fútbol.
          </p>

          <div className="lnd-4 landing-hero__actions">
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="landing-hero__cta-primary"
            >
              Entrar a Premier Hub
            </button>
            <a href="#features" className="landing-hero__cta-secondary">
              Conocer más ↓
            </a>
          </div>
        </div>

        <div className="landing-hero__scroll">
          <span className="landing-hero__scroll-text">Scroll</span>
          <svg
            className="landing-hero__scroll-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      <div className="landing-stats">
        <div className="landing-stats__inner">
          {[
            { num: "20", label: "Equipos" },
            { num: "380", label: "Partidos / temporada" },
            { num: "1992", label: "Año de fundación" },
            { num: "200+", label: "Países con transmisión" },
          ].map((stat) => (
            <div key={stat.label} className="landing-stats__item">
              <p className="landing-stats__num">{stat.num}</p>
              <p className="landing-stats__label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section id="features" className="landing-features">
        <div className="landing-container">
          <div className="landing-section__header">
            <p className="landing-section__kicker">¿Qué es Premier Hub?</p>
            <h2 className="landing-section__title">
              Todo sobre la Premier,{" "}
              <span className="landing-section__title-muted">en un solo lugar.</span>
            </h2>
          </div>

          <div className="landing-features__grid">
            {[
              {
                accentClass: "landing-feature__title--gold",
                title: "Leaderboard",
                desc: "Compite con otros fans. Acumula puntos prediciendo resultados y sube en el ranking global.",
              },
              {
                accentClass: "landing-feature__title--crimson",
                title: "Partidos en vivo",
                desc: "Sigue todos los partidos de la temporada con stats en tiempo real y análisis detallados.",
              },
              {
                accentClass: "landing-feature__title--navy",
                title: "Tienda Premier",
                desc: "Canjea tus puntos por jerseys, balones y accesorios exclusivos de tus equipos favoritos.",
              },
              {
                accentClass: "landing-feature__title--bordeaux",
                title: "Marketplace",
                desc: "Intercambia objetos con otros fans. Compra, vende y colecciona items únicos de temporada.",
              },
            ].map((feature) => (
              <div key={feature.title} className="feat-card landing-feature">
                <p className={`landing-feature__title ${feature.accentClass}`}>
                  {feature.title}
                </p>
                <p className="landing-feature__desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-info">
        <div className="landing-container">
          <div className="pl-two-col landing-info__grid">
            <div>
              <p className="landing-section__kicker">La liga más seguida del mundo</p>
              <h2 className="landing-section__title">
                ¿Qué es la
                <br />
                Premier League?
              </h2>
              <p className="landing-info__text">
                La Premier League es la máxima división del fútbol inglés, fundada en 1992.
                Participan 20 equipos en un formato de todos contra todos, jugando 38 partidos por temporada.
              </p>
              <p className="landing-info__text landing-info__text--spaced">
                Con clubes como Manchester City, Arsenal, Liverpool y Chelsea,
                es considerada la liga más competitiva y emocionante del planeta.
              </p>
              <button
                type="button"
                className="cta-outline"
                onClick={() => setShowLogin(true)}
              >
                Únete gratis →
              </button>
            </div>

            <div className="stat-grid landing-info__stats">
              {[
                { num: "33", label: "Temporadas PL", sub: "desde 1992" },
                { num: "#1", label: "Liga mundial", sub: "por audiencia" },
                { num: "3.2B", label: "Fans globales", sub: "en 200+ países" },
                { num: "€2.5B", label: "Derechos TV", sub: "por temporada" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card landing-info__stat-card">
                  <p className="landing-info__stat-num">{stat.num}</p>
                  <p className="landing-info__stat-label">{stat.label}</p>
                  <p className="landing-info__stat-sub">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-video">
        <div className="landing-video__inner">
          <p className="landing-section__kicker">La Premier en acción</p>
          <h2 className="landing-section__title landing-section__title--center">
            Los mejores momentos
          </h2>
          <div className="landing-video__frame">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?rel=0&modestbranding=1`}
              title="Premier League Highlights"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="landing-video__iframe"
            />
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta__grid" />
        <div className="landing-cta__inner">
          <div className="landing-cta__line" />
          <h2 className="landing-cta__title">
            ¿Listo para
            <br />
            <span className="landing-cta__accent">competir?</span>
          </h2>
          <p className="landing-cta__text">
            Únete gratis a Premier Hub y empieza a acumular puntos desde hoy.
          </p>
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="landing-cta__button"
          >
            Comenzar ahora →
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-footer__brand">
          <span className="landing-footer__brand-accent">PREMIER</span>
          <span className="landing-footer__brand-muted">HUB</span>
        </span>
        <p className="landing-footer__text">Una página de fans para fans</p>
      </footer>

      {showLogin && (
        <div className="landing-overlay" onClick={() => setShowLogin(false)}>
          <div className="landing-overlay__card" onClick={(event) => event.stopPropagation()}>
            <Login onLoginSuccess={onLoginSuccess} />
          </div>
        </div>
      )}
    </>
  );
}
