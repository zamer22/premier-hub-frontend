import { useEffect, useState } from "react";
import Partido    from "./pages/Partido";
import Tienda     from "./pages/Tienda";
import Noticias   from "./pages/NoticiasLanding";
import ElegirNickname from "./pages/ElegirNickname";
<<<<<<< HEAD
import Noticia    from "./pages/Noticia";
import Landing    from "./pages/Landing";
import Historia from "./pages/Historia";
=======
import Noticia from "./pages/Noticia";
import Landing from "./pages/Landing";
import Perfil from "./pages/Perfil";
import Wordle from "./pages/Wordle";
>>>>>>> origin/Wordle

type Section =
  | "tablero"
  | "partido"
  | "noticias"
  | "tienda"
  | "perfil"
  | "vr-arena"
  | "simulador"
<<<<<<< HEAD
  | "historia";              
=======
  | "Arcade";
>>>>>>> origin/Wordle

const TABS: { key: Section; label: string }[] = [
  { key: "partido",   label: "Partido"   },
  { key: "tablero",   label: "Tablero"   },
  { key: "simulador", label: "Simulador" },
  { key: "vr-arena",  label: "VR Arena"  },
  { key: "tienda",    label: "Tienda"    },
  { key: "noticias",  label: "Noticias"  },
<<<<<<< HEAD
  { key: "historia",  label: "Historia"  }, 
=======
  { key: "Arcade",    label: "Arcade"    },
>>>>>>> origin/Wordle
];

const PROXIMAMENTE: Section[] = ["tablero", "simulador", "vr-arena"];

const VALID_TABS: Section[] = [...TABS.map((t) => t.key), "perfil"];
const API_URL = import.meta.env.VITE_API_URL;

function getTabFromUrl(): Section {
  const p = new URLSearchParams(window.location.search).get("tab") as Section;
  return VALID_TABS.includes(p) ? p : "partido";
}

function getSectionFromPath(pathname: string): Section {
  const section = pathname.replace(/^\/+/, "").split("/")[0];
  return VALID_TABS.includes(section as Section) ? (section as Section) : "partido";
}

function getInitialTab(): Section {
  const pathname = window.location.pathname;
  const search = window.location.search;

  if (pathname !== "/" || search.includes("tab=")) {
    if (pathname === "/") return getTabFromUrl();
    return getSectionFromPath(pathname);
  }

  const saved = localStorage.getItem("premier_tab") as Section;
  if (saved && VALID_TABS.includes(saved)) return saved;

  return "partido";
}

<<<<<<< HEAD
=======
function getPathForSection(section: Section): string {
  return section === "tablero" ? "/" : `/${section}`;
}

function getInitials(user: any) {
  const source = user?.nickname || user?.nombre_usuario || user?.correo || "PH";
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("") || "PH";
}

function getUserImage(user: any) {
  return user?.foto_perfil_url || user?.foto_perfil || user?.avatar_url || user?.avatar || user?.imagen_perfil || "";
}

function getInventoryProfileImage(items: any[]) {
  const preferred = items.find((item) =>
    ["foto_perfil", "avatar"].includes(item.tipo) && item.imagen
  );
  const fallback = items.find((item) =>
    ["foto_perfil", "avatar", "marco", "banner"].includes(item.tipo) && item.imagen
  );
  return preferred?.imagen || fallback?.imagen || "";
}

>>>>>>> origin/Wordle
function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18h16" />
      <path d="m5 18 1.7-8 5.3 4 5.3-4L19 18" />
      <path d="M8 7.2a1 1 0 1 1 0-.1" />
      <path d="M12 4.2a1 1 0 1 1 0-.1" />
      <path d="M16 7.2a1 1 0 1 1 0-.1" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export default function App() {
<<<<<<< HEAD
  const [pathname,       setPathname]       = useState(() => window.location.pathname);
  const [tab,            setTabState]       = useState<Section>(getInitialTab);
  const [user,           setUser]           = useState<any>(null);
  const [oauthNuevo,     setOauthNuevo]     = useState<{ correo: string; nombre: string } | null>(null);
=======
  const [pathname,       setPathname]      = useState(() => window.location.pathname);
  const [tab,            setTabState]      = useState<Section>(getInitialTab);
  const [user,           setUser]          = useState<any>(null);
  const [profileImage,   setProfileImage]  = useState("");
  const [oauthNuevo,     setOauthNuevo]    = useState<{ correo: string; nombre: string } | null>(null);
>>>>>>> origin/Wordle
  const [sessionLoading, setSessionLoading] = useState(true);

  const syncLocationState = () => {
    const nextPathname = window.location.pathname;
    setPathname(nextPathname);
    const next = nextPathname === "/"
      ? getTabFromUrl()
      : getSectionFromPath(nextPathname);
    setTabState(next);
  };

  const setTab = (next: Section) => {
    localStorage.setItem("premier_tab", next);
    const url = new URL(window.location.href);
    if (next === "noticias" || next === "historia") {
      url.pathname = `/${next}`;
      url.searchParams.delete("tab");
    } else {
      url.pathname = "/";
      url.searchParams.set("tab", next);
    }
    window.history.pushState({}, "", url.toString());
    syncLocationState();
  };

  useEffect(() => {
    window.addEventListener("popstate", syncLocationState);
    return () => window.removeEventListener("popstate", syncLocationState);
  }, []);

  useEffect(() => {
    if (!user?.id_usuario) {
      setProfileImage("");
      return;
    }

    let active = true;
    const userImage = getUserImage(user);
    if (userImage) setProfileImage(userImage);

    fetch(`${API_URL}/api/tienda/mis-items/${user.id_usuario}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active || !data.success) return;
        setProfileImage(getInventoryProfileImage(data.data || []) || userImage);
      })
      .catch(() => {
        if (active) setProfileImage(userImage);
      });

    return () => {
      active = false;
    };
  }, [user?.id_usuario, user?.dinero]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get("access_token");
      if (!accessToken) { setSessionLoading(false); return; }
      window.history.replaceState(null, "", window.location.pathname);
      fetch(`${API_URL}/api/auth/google-sync`, {
        method: "POST",
        credentials: "include",
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
    localStorage.removeItem("premier_tab");
    sessionStorage.setItem("google_select_account", "1");
    window.history.replaceState({}, "", "/");
    setProfileImage("");
    setUser(null);
  };

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

  if (!user) return <Landing onLoginSuccess={(u) => setUser(u)} />;

  const isNewsDetailRoute = /^\/noticias\/\d+\/?$/.test(pathname);

  return (
    <div className="min-h-screen bg-surface" style={{ paddingTop: "60px" }}>

      {/* Navbar */}
      <nav className="flex items-center h-[60px] px-8 bg-navy gap-0.5"
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>

        <span className="font-extrabold text-[1.25rem] tracking-tight select-none mr-10"
          style={{ letterSpacing: "-0.02em" }}>
          <span className="text-crimson">PREMIER</span>
          <span className="text-white">HUB</span>
        </span>

        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative px-4 py-2 text-[0.82rem] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border-0 bg-transparent outline-none"
            style={{ color: tab === t.key ? "#ffffff" : "#84878F", fontWeight: tab === t.key ? 700 : 500 }}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                style={{ background: "linear-gradient(90deg, #E90052, #871d54)" }} />
            )}
            <span className="absolute inset-0 rounded opacity-0 hover:opacity-100 transition-opacity duration-150"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setTab("perfil")}
            aria-label="Abrir perfil"
            title="Abrir perfil"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              minHeight: "34px",
              padding: "0.25rem 0.65rem 0.25rem 0.3rem",
              borderRadius: "8px",
              border: tab === "perfil" ? "1px solid rgba(233,0,82,0.65)" : "1px solid transparent",
              background: tab === "perfil" ? "rgba(233,0,82,0.12)" : "transparent",
              color: tab === "perfil" ? "#fff" : "rgba(255,255,255,0.7)",
              fontSize: "0.82rem",
              fontWeight: 700,
              transition: "background 0.15s, border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = tab === "perfil" ? "rgba(233,0,82,0.12)" : "transparent";
              e.currentTarget.style.color = tab === "perfil" ? "#fff" : "rgba(255,255,255,0.7)";
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                overflow: "hidden",
                background: profileImage ? "#fff" : "linear-gradient(135deg, #E90052, #871d54)",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 900,
                flex: "0 0 auto",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
              }}
            >
              {profileImage
                ? <img src={profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : getInitials(user)}
            </span>
            <span>{user.nickname}</span>
          </button>
          <button
            onClick={logout}
            style={{
              padding: "0.3rem 0.9rem", border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: "6px", background: "transparent",
              color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", fontWeight: 600,
              cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Contenido */}
      <div className="px-8 py-6 max-w-[1400px] mx-auto animate-fade-in">
<<<<<<< HEAD
        {tab === "partido"  && <Partido />}
        {tab === "historia" && <Historia />} 
        {tab === "tienda"   && (
=======
        {tab === "Arcade"    && <Wordle />}
        {tab === "partido"   && <Partido />}
        {tab === "tienda"    && (
>>>>>>> origin/Wordle
          <Tienda
            user={user}
            onSaldoChange={(s: number) => setUser({ ...user, dinero: s })}
          />
        )}
<<<<<<< HEAD
        {tab === "noticias" && !isNewsDetailRoute && <Noticias />}
        {tab === "noticias" && isNewsDetailRoute  && <Noticia />}
        
=======
        {tab === "perfil"    && (
          <Perfil
            user={user}
            profileImage={profileImage}
            onGoToStore={() => setTab("tienda")}
          />
        )}
        {tab === "noticias"  && !isNewsDetailRoute && <Noticias />}
        {tab === "noticias"  && isNewsDetailRoute  && <Noticia />}
>>>>>>> origin/Wordle
        {PROXIMAMENTE.includes(tab) && (
          <div className="flex flex-col items-center justify-center mt-24 gap-3">
            <span className="text-[2rem] font-extrabold text-navy/20 tracking-tight">
              {TABS.find(t => t.key === tab)?.label.toUpperCase()}
            </span>
            <span className="text-muted text-sm">Próximamente</span>
          </div>
        )}
      </div>
    </div>
  );
}