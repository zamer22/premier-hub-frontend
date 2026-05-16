import { useState } from "react";
import Login from "../login/Login";
import "./Landing.css";

/* Reemplaza este ID con el de cualquier video de YouTube de highlights PL */
const YT_VIDEO_ID = "Fi5OWvIii-8";

interface LandingProps {
  onLoginSuccess: (user: any) => void;
}

export default function Landing({ onLoginSuccess }: LandingProps) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>

      {/* ══════════════════════════════════════
          Hero — navy (deportivo)
      ══════════════════════════════════════ */}
      <section className="landing-hero">
        {/* Orbs */}
        <div className="landing-hero__bg">
          <div className="landing-hero__orb landing-hero__orb--one" />
          <div className="landing-hero__orb landing-hero__orb--two" />
          {/* Grid sutil */}
          <div className="landing-hero__grid" />
        </div>

        {/* Content */}
        <div className="landing-hero__content">
          {/* Badge */}
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
              onClick={() => setShowLogin(true)}
              className="landing-hero__cta-primary"
            >
              Entrar a Premier Hub
            </button>
            <a
              href="#features"
              className="landing-hero__cta-secondary"
            >
              Conocer más ↓
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="landing-hero__scroll">
          <span className="landing-hero__scroll-text">Scroll</span>
          <svg className="landing-hero__scroll-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Stats bar — blanca sobre gris claro
      ══════════════════════════════════════ */}
      <div className="landing-stats">
        <div className="landing-stats__inner">
          {[
            { num: "20",   label: "Equipos"               },
            { num: "380",  label: "Partidos / temporada"  },
            { num: "1992", label: "Año de fundación"      },
            { num: "200+", label: "Países con transmisión"},
          ].map(s => (
            <div key={s.label} className="landing-stats__item">
              <p className="landing-stats__num">{s.num}</p>
              <p className="landing-stats__label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          Features — fondo app #f5f6f8
      ══════════════════════════════════════ */}
      <section id="features" className="landing-features">
        <div className="landing-container">
          <div className="landing-section__header">
            <p className="landing-section__kicker">
              ¿Qué es Premier Hub?
            </p>
            <h2 className="landing-section__title">
              Todo sobre la Premier,{" "}
              <span className="landing-section__title-muted">en un solo lugar.</span>
            </h2>
          </div>

          <div className="landing-features__grid">
            {[
              {
                accentClass: "landing-feature__title--gold", title: "Leaderboard",
                desc: "Compite con otros fans. Acumula puntos prediciendo resultados y sube en el ranking global.",
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
              },
              {
                accentClass: "landing-feature__title--crimson", title: "Partidos en vivo",
                desc: "Sigue todos los partidos de la temporada con stats en tiempo real y análisis detallados.",
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/><path d="M4.93 4.93 2 2"/><path d="m21.07 4.93 2-2"/></svg>,
              },
              {
                accentClass: "landing-feature__title--navy", title: "Tienda Premier",
                desc: "Canjea tus puntos por jerseys, balones y accesorios exclusivos de tus equipos favoritos.",
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
              },
              {
                accentClass: "landing-feature__title--bordeaux", title: "Marketplace",
                desc: "Intercambia objetos con otros fans. Compra, vende y colecciona items únicos de temporada.",
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
              },
            ].map(f => (
              <div key={f.title} className="feat-card landing-feature">
                <p className={`landing-feature__title ${f.accentClass}`}>{f.title}</p>
                <p className="landing-feature__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Premier League info — blanco
      ══════════════════════════════════════ */}
      <section className="landing-info">
        <div className="landing-container">
          <div className="pl-two-col landing-info__grid">
            {/* Texto */}
            <div>
              <p className="landing-section__kicker">
                La liga más seguida del mundo
              </p>
              <h2 className="landing-section__title">
                ¿Qué es la<br />Premier League?
              </h2>
              <p className="landing-info__text">
                La Premier League es la máxima división del fútbol inglés, fundada en 1992.
                Participan 20 equipos en un formato de todos contra todos, jugando 38 partidos por temporada.
              </p>
              <p className="landing-info__text landing-info__text--spaced">
                Con clubes como Manchester City, Arsenal, Liverpool y Chelsea,
                es considerada la liga más competitiva y emocionante del planeta.
              </p>
              <button className="cta-outline" onClick={() => setShowLogin(true)}>
                Únete gratis →
              </button>
            </div>

            {/* Stats grid */}
            <div className="stat-grid landing-info__stats">
              {[
                { num: "33",    label: "Temporadas PL",  sub: "desde 1992"     },
                { num: "#1",    label: "Liga mundial",   sub: "por audiencia"  },
                { num: "3.2B",  label: "Fans globales",  sub: "en 200+ países" },
                { num: "€2.5B", label: "Derechos TV",    sub: "por temporada"  },
              ].map(s => (
                <div key={s.label} className="stat-card landing-info__stat-card">
                  <p className="landing-info__stat-num">{s.num}</p>
                  <p className="landing-info__stat-label">{s.label}</p>
                  <p className="landing-info__stat-sub">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Video — fondo gris app
      ══════════════════════════════════════ */}
      <section className="landing-video">
        <div className="landing-video__inner">
          <p className="landing-section__kicker">
            La Premier en acción
          </p>
          <h2 className="landing-section__title landing-section__title--center">
            Los mejores momentos
          </h2>
          <div className="landing-video__frame">
            <iframe
              width="100%" height="100%"
              src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?rel=0&modestbranding=1`}
              title="Premier League Highlights"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="landing-video__iframe"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA final — navy (consistente con hero)
      ══════════════════════════════════════ */}
      <section className="landing-cta">
        <div className="landing-cta__grid" />
        <div className="landing-cta__inner">
          <div className="landing-cta__line" />
          <h2 className="landing-cta__title">
            ¿Listo para<br /><span className="landing-cta__accent">competir?</span>
          </h2>
          <p className="landing-cta__text">
            Únete gratis a Premier Hub y empieza a acumular puntos desde hoy.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="landing-cta__button"
          >
            Comenzar ahora →
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Footer
      ══════════════════════════════════════ */}
      <footer className="landing-footer">
        <span className="landing-footer__brand">
          <span className="landing-footer__brand-accent">PREMIER</span>
          <span className="landing-footer__brand-muted">HUB</span>
        </span>
        <p className="landing-footer__text">
          Una página de fans para fans
        </p>
      </footer>

      {/* ══════════════════════════════════════
          Login overlay
      ══════════════════════════════════════ */}
      {showLogin && (
        <div
          className="landing-overlay"
          onClick={() => setShowLogin(false)}
        >
          <div className="landing-overlay__card" onClick={e => e.stopPropagation()}>
            <Login onLoginSuccess={onLoginSuccess} />
          </div>
        </div>
      )}
    </>
  );
}
