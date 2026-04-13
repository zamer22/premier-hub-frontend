<<<<<<< HEAD
import Tablero from "./pages/Tablero";
import Partido from "./pages/Partido";
import Simulador from "./pages/Simulador";
import Tienda from "./pages/Tienda";
import Noticias from "./pages/NoticiasLanding";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
=======
import { useState, useEffect } from "react";
import Tablero    from "./pages/Tablero";
import Partido    from "./pages/Partido";
import Simulador  from "./pages/Simulador";
import Tienda     from "./pages/Tienda";
import Noticias   from "./pages/NoticiasLanding";
import Login      from "./pages/Login";
import ElegirNickname from "./pages/ElegirNickname";
>>>>>>> origin/Tienda

type Section = "tablero" | "partido" | "noticias" | "tienda" | "vr-arena" | "simulador";

<<<<<<< HEAD
const TABS: { key: Section; label: string; path: string }[] = [
  { key: "tablero", label: "Tablero", path: "/tablero" },
  { key: "partido", label: "Partido", path: "/partido" },
  { key: "tienda", label: "Tienda", path: "/tienda" },
  { key: "simulador", label: "Simulador", path: "/simulador" },
  { key: "noticias", label: "Noticias", path: "/noticias" },
  { key: "vr-arena", label: "VR Arena", path: "/vr-arena" },
];

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f8" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          height: "60px",
          padding: "0 2rem",
          background: "#263a55",
          gap: "0.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <span
          style={{
            color: "#E90052",
            fontWeight: 800,
            fontSize: "1.3rem",
            marginRight: "2.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          PREMIER<span style={{ color: "#fff" }}>HUB</span>
=======
const TABS: { key: Section; label: string }[] = [
  { key: "tablero",   label: "Tablero"   },
  { key: "partido",   label: "Partido"   },
  { key: "tienda",    label: "Tienda"    },
  { key: "simulador", label: "Simulador" },
  { key: "noticias",  label: "Noticias"  },
  { key: "vr-arena",  label: "VR Arena"  },
];

const VALID_TABS = TABS.map((t) => t.key);
const API_URL = import.meta.env.DEV ? "" : "https://api.zamer-o.com";

function getTabFromUrl(): Section {
  const p = new URLSearchParams(window.location.search).get("tab") as Section;
  return VALID_TABS.includes(p) ? p : "tablero";
}

export default function App() {
  const [tab,            setTabState]      = useState<Section>(getTabFromUrl);
  const [user,           setUser]          = useState<any>(null);
  const [oauthNuevo,     setOauthNuevo]    = useState<{ correo: string; nombre: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const setTab = (next: Section) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
    setTabState(next);
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get("access_token");
      if (!accessToken) { setSessionLoading(false); return; }
      window.history.replaceState(null, "", window.location.pathname);
      fetch(`${API_URL}/api/auth/google-sync`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.success) { alert("Error con Google login: " + data.error); return; }
          if (data.isNew) setOauthNuevo({ correo: data.correo, nombre: data.nombre });
          else setUser(data.user);
        })
        .catch(() => alert("No se pudo conectar con el servidor"))
        .finally(() => setSessionLoading(false));
    } else {
      fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => { if (data.success) setUser(data.user); })
        .catch(() => {})
        .finally(() => setSessionLoading(false));
    }
  }, []);

  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
  };

  /* ── Loading ── */
  if (sessionLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-surface gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-crimson border-t-transparent animate-spin" />
        <span className="text-muted text-sm font-medium tracking-wide">Cargando PremierHub...</span>
      </div>
    );
  }

  if (oauthNuevo) {
    return (
      <ElegirNickname
        correo={oauthNuevo.correo}
        nombre={oauthNuevo.nombre}
        onComplete={(u) => { setOauthNuevo(null); setUser(u); }}
      />
    );
  }

  if (!user) return <Login onLoginSuccess={(u) => setUser(u)} />;

  /* ── App ── */
  return (
    <div className="min-h-screen bg-surface">

      {/* ── Navbar ── */}
      <nav className="flex items-center h-[60px] px-8 bg-navy gap-0.5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>

        {/* Logo */}
        <span className="font-extrabold text-[1.25rem] tracking-tight select-none mr-10"
          style={{ letterSpacing: "-0.02em" }}>
          <span className="text-crimson">PREMIER</span>
          <span className="text-white">HUB</span>
>>>>>>> origin/Tienda
        </span>

        {/* Tabs */}
        {TABS.map((t) => (
<<<<<<< HEAD
          <NavLink
            key={t.key}
            to={t.path}
            style={({ isActive }: { isActive: boolean }) => ({
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              background: isActive ? "rgba(233,0,82,0.15)" : "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              color: isActive ? "#fff" : "#84878F",
              fontWeight: isActive ? 700 : 500,
              borderBottom: isActive
                ? "2px solid #871d54"
                : "2px solid transparent",
              transition: "all 0.2s ease",
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: "2rem",
          maxWidth: "1100px",
          margin: "0 auto",
          animation: "fadeIn 0.3s ease",
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/tablero" replace />} />
          <Route path="/tablero" element={<Tablero />} />
          <Route path="/partido" element={<Partido />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/vr-arena" element={<div>VR Arena - Proximamente</div>} />
        </Routes>
=======
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative px-4 py-2 text-[0.82rem] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border-0 bg-transparent outline-none"
            style={{
              color: tab === t.key ? "#ffffff" : "#84878F",
              fontWeight: tab === t.key ? 700 : 500,
            }}
          >
            {t.label}
            {/* Active indicator */}
            {tab === t.key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                style={{ background: "linear-gradient(90deg, #E90052, #871d54)" }}
              />
            )}
            {/* Hover background */}
            <span className="absolute inset-0 rounded opacity-0 hover:opacity-100 transition-opacity duration-150"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          </button>
        ))}

        {/* User section */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-white/80 text-[0.82rem] font-medium">{user.nickname}</span>
          <span
            className="text-white text-[0.75rem] font-bold px-3 py-1 rounded"
            style={{ background: "linear-gradient(135deg, #E90052, #871d54)" }}
          >
            {Number(user.dinero).toLocaleString()} pts
          </span>
          <button
            onClick={logout}
            className="text-white/30 text-[0.72rem] font-medium hover:text-white/60 transition-colors duration-150 border-0 bg-transparent cursor-pointer"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* ── Contenido ── */}
      <div className="px-8 py-6 max-w-[1400px] mx-auto animate-fade-in">
        {tab === "tablero"   && <Tablero />}
        {tab === "partido"   && <Partido />}
        {tab === "simulador" && <Simulador />}
        {tab === "tienda"    && (
          <Tienda
            user={user}
            onSaldoChange={(s: number) => setUser({ ...user, dinero: s })}
          />
        )}
        {tab === "noticias"  && <Noticias />}
        {tab === "vr-arena"  && (
          <div className="flex flex-col items-center justify-center mt-24 gap-3">
            <span className="text-[2rem] font-extrabold text-navy/20 tracking-tight">VR ARENA</span>
            <span className="text-muted text-sm">Próximamente</span>
          </div>
        )}
>>>>>>> origin/Tienda
      </div>
    </div>
  );
}
