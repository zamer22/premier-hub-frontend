import { useEffect, useState } from "react";
import Tablero from "./pages/Tablero";
import Partido from "./pages/Partido";
import Simulador from "./pages/Simulador";
import Tienda from "./pages/Tienda";
import Noticias from "./pages/NoticiasLanding";
import Noticia from "./pages/Noticia";

type Section =
  | "tablero"
  | "partido"
  | "noticias"
  | "tienda"
  | "vr-arena"
  | "simulador";

const TABS: { key: Section; label: string }[] = [
  { key: "tablero", label: "Tablero" },
  { key: "partido", label: "Partido" },
  { key: "tienda", label: "Tienda" },
  { key: "simulador", label: "Simulador" },
  { key: "noticias", label: "Noticias" },
  { key: "vr-arena", label: "VR Arena" },
];

function getSectionFromPath(pathname: string): Section {
  const section = pathname.replace(/^\/+/, "").split("/")[0];
  const match = TABS.find((tab) => tab.key === section);

  return match?.key || "tablero";
}

function getPathForSection(section: Section): string {
  return section === "tablero" ? "/" : `/${section}`;
}

function CrownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="app-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="app-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [tab, setTab] = useState<Section>(() =>
    getSectionFromPath(window.location.pathname),
  );

  const handleTabChange = (nextTab: Section) => {
    const nextPath = getPathForSection(nextTab);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      setPathname(nextPath);
      setTab(nextTab);
    }
  };

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
      setTab(getSectionFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const isNewsRoute = pathname.startsWith("/noticias");
  const isNewsDetailRoute = /^\/noticias\/\d+\/?$/.test(pathname);
  const contentClassName = isNewsRoute
    ? "app-content app-content--news"
    : "app-content app-content--standard";

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <nav className="app-topbar__nav" aria-label="Navegacion principal">
          <div className="app-topbar__left">
            <span className="app-topbar__brand">
              PREMIER<span>HUB</span>
            </span>
            <div className="app-topbar__menu">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTabChange(t.key)}
                  className={`app-topbar__tab${tab === t.key ? " is-active" : ""}`}
                  aria-current={tab === t.key ? "page" : undefined}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="app-topbar__actions">
            <button
              type="button"
              className="app-topbar__status"
              aria-label="Acceso premium"
            >
              <CrownIcon />
            </button>
            <button type="button" className="app-topbar__profile">
              <span className="app-topbar__profile-avatar">
                <UserIcon />
              </span>
              <span>Usuario</span>
            </button>
          </div>
        </nav>
      </header>
      <main className={contentClassName}>
        {tab === "tablero" && <Tablero />}
        {tab === "partido" && <Partido />}
        {tab === "simulador" && <Simulador />}
        {tab === "tienda" && <Tienda />}
        {tab === "noticias" && !isNewsDetailRoute && <Noticias />}
        {tab === "noticias" && isNewsDetailRoute && <Noticia />}
        {tab === "vr-arena" && <div>VR Arena - Proximamente</div>}
      </main>
    </div>
  );
}
