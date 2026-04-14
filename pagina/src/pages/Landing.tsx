import { useState } from "react";
import Login from "./Login";

/* Reemplaza este ID con el de cualquier video de YouTube de highlights PL */
const YT_VIDEO_ID = "pQpSuHjHCZo";

interface LandingProps {
  onLoginSuccess: (user: any) => void;
}

export default function Landing({ onLoginSuccess }: LandingProps) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <style>{`
        @keyframes landingFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(28px,-18px) scale(1.05); }
          66%      { transform: translate(-16px,14px) scale(0.97); }
        }
        @keyframes landingFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(-22px,16px) scale(1.04); }
          75%     { transform: translate(18px,-12px) scale(0.97); }
        }
        @keyframes landingFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollBounce {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%     { transform: translateX(-50%) translateY(7px); }
        }
        .lnd-1 { animation: landingFadeUp 0.7s 0.05s ease both; }
        .lnd-2 { animation: landingFadeUp 0.7s 0.2s  ease both; }
        .lnd-3 { animation: landingFadeUp 0.7s 0.35s ease both; }
        .lnd-4 { animation: landingFadeUp 0.7s 0.5s  ease both; }
        .feat-card {
          background: #fff;
          border: 1px solid #e9ecef;
          border-radius: 16px;
          padding: 1.75rem;
          transition: border-color 0.2s, box-shadow 0.25s, transform 0.25s;
        }
        .feat-card:hover {
          border-color: #263a55;
          box-shadow: 0 8px 28px rgba(38,58,85,0.1);
          transform: translateY(-4px);
        }
        .stat-card {
          background: #fff;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.25rem;
        }
        .cta-outline {
          display: inline-block;
          padding: 0.75rem 2rem;
          background: transparent;
          color: #E90052;
          border: 1.5px solid #E90052;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
        }
        .cta-outline:hover { background: #E90052; color: #fff; }
        @media (max-width: 700px) {
          .pl-two-col { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .stat-grid  { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════
          Hero — navy (deportivo)
      ══════════════════════════════════════ */}
      <section style={{
        position: "relative", minHeight: "100vh", background: "#263a55",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", overflow: "hidden", textAlign: "center", padding: "2rem",
      }}>
        {/* Orbs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
          <div style={{
            position: "absolute", width: "600px", height: "600px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(233,0,82,0.15) 0%, transparent 68%)",
            top: "-100px", left: "-100px",
            animation: "landingFloat1 14s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", width: "480px", height: "480px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(135,29,84,0.2) 0%, transparent 70%)",
            bottom: "-80px", right: "-80px",
            animation: "landingFloat2 17s ease-in-out infinite",
          }} />
          {/* Grid sutil */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
          {/* Badge */}
          <div className="lnd-1" style={{
            display: "inline-flex", alignItems: "center", gap: "0.55rem",
            background: "rgba(233,0,82,0.15)", border: "1px solid rgba(233,0,82,0.35)",
            borderRadius: "999px", padding: "0.38rem 1.1rem", marginBottom: "2rem",
          }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(233,0,82,0.95)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Premier League · Temporada 24/25
            </span>
          </div>

          <h1 className="lnd-2" style={{
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)", fontWeight: 900,
            lineHeight: 1.05, marginBottom: "1.5rem", letterSpacing: "-0.03em", color: "#fff",
          }}>
            Tu hub de{" "}
            <span style={{ color: "#E90052" }}>Premier</span>
            <br />
            <span style={{ color: "rgba(255,255,255,0.55)" }}>League</span>
          </h1>

          <p className="lnd-3" style={{
            fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)", color: "rgba(255,255,255,0.55)",
            lineHeight: 1.75, maxWidth: "520px", margin: "0 auto 2.75rem",
          }}>
            Sigue los partidos en vivo, compite en el leaderboard, consigue objetos exclusivos
            y demuestra que sabes de fútbol.
          </p>

          <div className="lnd-4" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowLogin(true)}
              style={{
                padding: "0.95rem 2.75rem",
                background: "linear-gradient(135deg, #E90052, #871d54)",
                color: "#fff", border: "none", borderRadius: "12px", fontSize: "1rem",
                fontWeight: 800, cursor: "pointer",
                transition: "transform 0.2s, opacity 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "1"; }}
            >
              Entrar a Premier Hub
            </button>
            <a
              href="#features"
              style={{
                padding: "0.95rem 2rem",
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px", fontSize: "1rem", fontWeight: 600,
                textDecoration: "none", transition: "background 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.14)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)"; }}
            >
              Conocer más ↓
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: "2rem", left: "50%",
          animation: "scrollBounce 2.2s ease-in-out infinite",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
        }}>
          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Stats bar — blanca sobre gris claro
      ══════════════════════════════════════ */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "1.5rem 2rem", boxShadow: "0 2px 8px rgba(38,58,85,0.06)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1.25rem" }}>
          {[
            { num: "20",   label: "Equipos"               },
            { num: "380",  label: "Partidos / temporada"  },
            { num: "1992", label: "Año de fundación"      },
            { num: "200+", label: "Países con transmisión"},
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.7rem", fontWeight: 900, color: "#E90052", letterSpacing: "-0.025em", marginBottom: "0.1rem" }}>{s.num}</p>
              <p style={{ fontSize: "0.7rem", color: "#84878F", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          Features — fondo app #f5f6f8
      ══════════════════════════════════════ */}
      <section id="features" style={{ background: "#f5f6f8", padding: "5.5rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontSize: "0.7rem", color: "#E90052", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.75rem" }}>
              ¿Qué es Premier Hub?
            </p>
            <h2 style={{ fontSize: "clamp(1.9rem, 5vw, 3rem)", fontWeight: 900, color: "#263a55", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              Todo sobre la Premier,{" "}
              <span style={{ color: "#84878F" }}>en un solo lugar.</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {[
              {
                accent: "#f59e0b", title: "Leaderboard",
                desc: "Compite con otros fans. Acumula puntos prediciendo resultados y sube en el ranking global.",
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
              },
              {
                accent: "#E90052", title: "Partidos en vivo",
                desc: "Sigue todos los partidos de la temporada con stats en tiempo real y análisis detallados.",
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/><path d="M4.93 4.93 2 2"/><path d="m21.07 4.93 2-2"/></svg>,
              },
              {
                accent: "#263a55", title: "Tienda Premier",
                desc: "Canjea tus puntos por jerseys, balones y accesorios exclusivos de tus equipos favoritos.",
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
              },
              {
                accent: "#871d54", title: "Marketplace",
                desc: "Intercambia objetos con otros fans. Compra, vende y colecciona items únicos de temporada.",
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
              },
            ].map(f => (
              <div key={f.title} className="feat-card">
                <p style={{ fontSize: "0.65rem", color: f.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.55rem" }}>{f.title}</p>
                <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Premier League info — blanco
      ══════════════════════════════════════ */}
      <section style={{ background: "#fff", padding: "5.5rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="pl-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            {/* Texto */}
            <div>
              <p style={{ fontSize: "0.7rem", color: "#E90052", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.75rem" }}>
                La liga más seguida del mundo
              </p>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#263a55", letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "1.25rem" }}>
                ¿Qué es la<br />Premier League?
              </h2>
              <p style={{ color: "#84878F", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "1rem" }}>
                La Premier League es la máxima división del fútbol inglés, fundada en 1992.
                Participan 20 equipos en un formato de todos contra todos, jugando 38 partidos por temporada.
              </p>
              <p style={{ color: "#84878F", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "2rem" }}>
                Con clubes como Manchester City, Arsenal, Liverpool y Chelsea,
                es considerada la liga más competitiva y emocionante del planeta.
              </p>
              <button className="cta-outline" onClick={() => setShowLogin(true)}>
                Únete gratis →
              </button>
            </div>

            {/* Stats grid */}
            <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                { num: "33",    label: "Temporadas PL",  sub: "desde 1992"     },
                { num: "#1",    label: "Liga mundial",   sub: "por audiencia"  },
                { num: "3.2B",  label: "Fans globales",  sub: "en 200+ países" },
                { num: "€2.5B", label: "Derechos TV",    sub: "por temporada"  },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#263a55", letterSpacing: "-0.025em", marginBottom: "0.1rem" }}>{s.num}</p>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#263a55", marginBottom: "0.1rem" }}>{s.label}</p>
                  <p style={{ fontSize: "0.68rem", color: "#84878F" }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Video — fondo gris app
      ══════════════════════════════════════ */}
      <section style={{ background: "#f5f6f8", padding: "5.5rem 2rem" }}>
        <div style={{ maxWidth: "920px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "0.7rem", color: "#E90052", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.75rem" }}>
            La Premier en acción
          </p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#263a55", letterSpacing: "-0.025em", marginBottom: "2.5rem" }}>
            Los mejores momentos
          </h2>
          <div style={{
            borderRadius: "18px", overflow: "hidden",
            boxShadow: "0 12px 48px rgba(38,58,85,0.15), 0 0 0 1px #e9ecef",
            aspectRatio: "16/9", background: "#263a55", position: "relative",
          }}>
            <iframe
              width="100%" height="100%"
              src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?rel=0&modestbranding=1`}
              title="Premier League Highlights"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: "none", display: "block", width: "100%", height: "100%", position: "absolute", inset: 0 }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA final — navy (consistente con hero)
      ══════════════════════════════════════ */}
      <section style={{ background: "#263a55", padding: "6rem 2rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "580px", margin: "0 auto" }}>
          <div style={{ width: "40px", height: "3px", background: "#E90052", borderRadius: "2px", margin: "0 auto 2rem" }} />
          <h2 style={{ fontSize: "clamp(2rem, 5.5vw, 3.2rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: "1rem", lineHeight: 1.1 }}>
            ¿Listo para<br /><span style={{ color: "#E90052" }}>competir?</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", lineHeight: 1.75, marginBottom: "2.5rem" }}>
            Únete gratis a Premier Hub y empieza a acumular puntos desde hoy.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            style={{
              padding: "1.05rem 3.5rem",
              background: "linear-gradient(135deg, #E90052, #871d54)",
              color: "#fff", border: "none", borderRadius: "14px", fontSize: "1.05rem",
              fontWeight: 800, cursor: "pointer",
              boxShadow: "0 10px 36px rgba(233,0,82,0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(233,0,82,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(233,0,82,0.4)"; }}
          >
            Comenzar ahora →
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Footer
      ══════════════════════════════════════ */}
      <footer style={{ background: "#1a2a3f", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
        <span style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
          <span style={{ color: "#E90052" }}>PREMIER</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>HUB</span>
        </span>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", marginTop: "0.5rem" }}>
          Fan project · No afiliado con la Premier League Official
        </p>
      </footer>

      {/* ══════════════════════════════════════
          Login overlay
      ══════════════════════════════════════ */}
      {showLogin && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(26,42,63,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowLogin(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <Login onLoginSuccess={onLoginSuccess} />
          </div>
        </div>
      )}
    </>
  );
}
