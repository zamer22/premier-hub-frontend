import { useEffect, useState, CSSProperties } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import Partido          from "./pages/Partido";
import Tienda           from "./pages/Tienda";
import Noticias         from "./pages/NoticiasLanding";
import ElegirNickname   from "./components/ElegirNickname";
import Noticia          from "./pages/Noticia";
import Landing          from "./pages/Landing";
import Historia         from "./pages/Historia";
import Perfil           from "./pages/Perfil";
import Wordle           from "./pages/Wordle";
import AdminEnvios      from "./pages/AdminEnvios";

type Section =
  | "tablero"
  | "partido"
  | "noticias"
  | "tienda"
  | "perfil"
  | "vr-arena"
  | "simulador"
  | "historia"
  | "arcade";

const ROUTES: Record<Section, string> = {
  partido: "/partido",
  tablero: "/tablero",
  simulador: "/simulador",
  "vr-arena": "/vr-arena",
  tienda: "/tienda",
  noticias: "/noticias",
  historia: "/historia",
  arcade: "/arcade",
  perfil: "/perfil",
};

const DEFAULT_ROUTE = ROUTES.partido;

const TABS: { key: Section; label: string; path: string }[] = [
  { key: "partido", label: "Partido", path: ROUTES.partido },
  { key: "tablero", label: "Tablero", path: ROUTES.tablero },
  { key: "simulador", label: "Simulador", path: ROUTES.simulador },
  { key: "vr-arena", label: "VR Arena", path: ROUTES["vr-arena"] },
  { key: "tienda", label: "Tienda", path: ROUTES.tienda },
  { key: "noticias", label: "Noticias", path: ROUTES.noticias },
  { key: "historia", label: "Historia", path: ROUTES.historia },
  { key: "arcade", label: "Arcade", path: ROUTES.arcade },
];

const PROXIMAMENTE: Section[] = ["tablero", "simulador", "vr-arena"];

const VALID_TABS: Section[] = [...TABS.map((t) => t.key), "perfil"];
const API_URL = import.meta.env.VITE_API_URL;

type InventoryItem = {
  id_inventario: number;
  tipo: string;
  imagen?: string | null;
  css?: string | null;
  metadata?: Record<string, any> | null;
};

function normalizeSection(value: string | null): Section | null {
  if (!value) return null;
  const normalized = value === "Arcade" ? "arcade" : value;
  return VALID_TABS.includes(normalized as Section)
    ? (normalized as Section)
    : null;
}

function getRouteForSection(section: Section | null): string | null {
  return section ? ROUTES[section] : null;
}

function getInitialRoute(search: string): string {
  const tabFromQuery = normalizeSection(new URLSearchParams(search).get("tab"));
  const savedTab = normalizeSection(localStorage.getItem("premier_tab"));

  return getRouteForSection(tabFromQuery) || getRouteForSection(savedTab) || DEFAULT_ROUTE;
}

function getSectionFromPath(pathname: string): Section {
  const route = [...TABS, { key: "perfil" as Section, path: ROUTES.perfil }]
    .find((tabRoute) =>
      pathname === tabRoute.path || pathname.startsWith(`${tabRoute.path}/`),
    );

  return route?.key || "partido";
}

function getInitials(user: any) {
  const source = user?.nickname || user?.nombre_usuario || user?.correo || "PH";
  return (
    source
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join("") || "PH"
  );
}

function getUserImage(user: any) {
  if (!user?.id_usuario) return "";
  return (
    user?.foto_perfil_url ||
    user?.foto_perfil ||
    user?.avatar_url ||
    user?.avatar ||
    user?.imagen_perfil ||
    ""
  );
}

function getInventoryProfileImage(items: InventoryItem[]) {
  const preferred = items.find(
    (item) => item.tipo === "foto_perfil" && item.imagen,
  );
  const fallback = items.find(
    (item) =>
      ["foto_perfil", "marco", "banner"].includes(item.tipo) && item.imagen,
  );
  return preferred?.imagen || fallback?.imagen || "";
}

function getFrameStyle(frame?: InventoryItem | null): CSSProperties {
  const metadata = frame?.metadata || {};
  const cssBackground =
    frame?.css || metadata.background || metadata.css_background;

  if (cssBackground) return { background: String(cssBackground) };
  if (frame?.imagen)
    return { background: `#fff url(${frame.imagen}) center/cover no-repeat` };
  return { background: "#d6dbe3" };
}

function ComingSoon({ section }: { section: Section }) {
  return (
    <div className="flex flex-col items-center justify-center mt-24 gap-3">
      <span className="text-[2rem] font-extrabold text-navy/20 tracking-tight">
        {TABS.find((tabRoute) => tabRoute.key === section)?.label.toUpperCase()}
      </span>
      <span className="text-muted text-sm">Proximamente</span>
    </div>
  );
}

function ProfileAvatar({
  profileFrame,
  profileImage,
  user,
}: {
  profileFrame: InventoryItem | null;
  profileImage: string;
  user: any;
}) {
  return (
    <span className="app-profile__frame" style={getFrameStyle(profileFrame)}>
      <span
        className={`app-profile__avatar ${
          profileImage ? "has-image" : "is-empty"
        }`}
      >
        {profileImage ? (
          <img src={profileImage} alt="" className="app-profile__img" />
        ) : (
          getInitials(user)
        )}
      </span>
    </span>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection = getSectionFromPath(location.pathname);
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState("");
  const [profileFrame, setProfileFrame] = useState<InventoryItem | null>(null);
  const [oauthNuevo, setOauthNuevo] = useState<{
    correo: string;
    nombre: string;
    fotoPerfilUrl?: string;
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    if (!user?.id_usuario) {
      setProfileImage("");
      return;
    }

    let active = true;
    const userImage = getUserImage(user);
    if (userImage) setProfileImage(userImage);

    Promise.all([
      fetch(`${API_URL}/api/tienda/mis-items/${user.id_usuario}`).then((r) =>
        r.json(),
      ),
      fetch(`${API_URL}/api/auth/profile/customization`, {
        credentials: "include",
      }).then((r) => r.json()),
    ])
      .then(([itemsData, customizationData]) => {
        if (!active || !itemsData.success) return;
        const items: InventoryItem[] = itemsData.data || [];
        const customization = customizationData.success
          ? customizationData.data
          : {};
        const frame =
          items.find(
            (item) =>
              Number(item.id_inventario) ===
              Number(customization?.marco_inventario_id),
          ) || null;
        setProfileFrame(frame);
        setProfileImage(userImage || getInventoryProfileImage(items));
      })
      .catch(() => {
        if (active) setProfileImage(userImage);
      });

    return () => {
      active = false;
    };
  }, [user?.id_usuario, user?.dinero]);

  useEffect(() => {
    const { hash, pathname, search } = window.location;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get("access_token");
      if (!accessToken) { setSessionLoading(false); return; }
      navigate(
        { pathname, search },
        { replace: true },
      );
      fetch(`${API_URL}/api/auth/google-sync`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.success) {
            alert("Error con Google login: " + data.error);
            return;
          }
          if (data.isNew)
            setOauthNuevo({
              correo: data.correo,
              nombre: data.nombre,
              fotoPerfilUrl: data.foto_perfil_url,
            });
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
  }, [navigate]);

  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    localStorage.removeItem("premier_tab");
    sessionStorage.setItem("google_select_account", "1");
    setProfileImage("");
    setProfileFrame(null);
    setUser(null);
    navigate("/", { replace: true });
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
        fotoPerfilUrl={oauthNuevo.fotoPerfilUrl}
        onComplete={(u) => {
          if (u.avatar_url) {
            setProfileImage(u.avatar_url);
          }
          setOauthNuevo(null);
          setUser(u);
        }}
      />
    );
  }

  if (!user) {
    return (
      <Landing
        onLoginSuccess={async (u) => {
          localStorage.removeItem("premier_tab");
          const full = await fetch(`${API_URL}/api/auth/me`, {
            credentials: "include",
          })
            .then((r) => r.json())
            .catch(() => ({ success: false }));
          setUser(full.success ? full.user : u);
          navigate(DEFAULT_ROUTE, { replace: true });
        }}
      />
    );
  }

  if (user.es_admin) return <AdminEnvios user={user} onLogout={logout} />;

  return (
    <div className="min-h-screen bg-surface app-shell">
      <nav
        className="flex items-center h-[66px] px-8 bg-navy gap-0.5 app-nav"
      >
        <NavLink
          to={DEFAULT_ROUTE}
          onClick={() => localStorage.setItem("premier_tab", "partido")}
          className="font-extrabold text-[1.25rem] tracking-tight select-none mr-10 app-logo"
        >
          <span className="text-crimson">PREMIER</span>
          <span className="text-white">HUB</span>
        </NavLink>

        {TABS.map((t) => (
          <NavLink
            to={t.path}
            key={t.key}
            onClick={() => localStorage.setItem("premier_tab", t.key)}
            className={({ isActive }) =>
              `relative px-4 py-2 text-[0.82rem] whitespace-nowrap transition-all duration-200 cursor-pointer border-0 bg-transparent outline-none app-tab ${
                isActive ? "is-active" : ""
              }`
            }
          >
            {t.label}
            {activeSection === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full app-tab__underline" />
            )}
            <span className="absolute inset-0 rounded opacity-0 hover:opacity-100 transition-opacity duration-150 app-tab__hover" />
          </NavLink>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <NavLink
            to={ROUTES.perfil}
            onClick={() => localStorage.setItem("premier_tab", "perfil")}
            aria-label="Abrir perfil"
            title="Abrir perfil"
            className={({ isActive }) =>
              `app-profile ${isActive ? "is-active" : ""}`
            }
          >
            <ProfileAvatar
              profileFrame={profileFrame}
              profileImage={profileImage}
              user={user}
            />
            <span>{user.nickname}</span>
          </NavLink>
        </div>
      </nav>

      <div
        className={
          activeSection === "perfil"
            ? "px-8 py-6 w-full"
            : "px-8 py-6 max-w-[1400px] mx-auto animate-fade-in"
        }
      >
        <Routes>
          <Route
            index
            element={<Navigate to={getInitialRoute(location.search)} replace />}
          />
          <Route path="partido" element={<Partido />} />
          <Route path="historia" element={<Historia />} />
          <Route
            path="tienda"
            element={
              <Tienda
                user={user}
                onSaldoChange={(s: number) => setUser({ ...user, dinero: s })}
              />
            }
          />
          <Route
            path="perfil"
            element={
              <Perfil
                user={user}
                profileImage={profileImage}
                onLogout={logout}
                onUserUpdated={(nextUser) => setUser(nextUser)}
                onProfileImageChanged={(nextImage) => setProfileImage(nextImage)}
                onCustomizationChanged={(nextCustomization) =>
                  setProfileFrame(nextCustomization.marcoItem || null)
                }
                onAccountDeleted={() => {
                  localStorage.removeItem("premier_tab");
                  setProfileImage("");
                  setProfileFrame(null);
                  setUser(null);
                  navigate("/", { replace: true });
                }}
              />
            }
          />
          <Route path="noticias" element={<Noticias />} />
          <Route path="noticias/:newsId" element={<Noticia />} />
          <Route path="arcade" element={<Wordle />} />
          <Route path="Arcade" element={<Navigate to={ROUTES.arcade} replace />} />
          {PROXIMAMENTE.map((section) => (
            <Route
              key={section}
              path={ROUTES[section].replace(/^\//, "")}
              element={<ComingSoon section={section} />}
            />
          ))}
          <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
        </Routes>
      </div>
    </div>
  );
}
