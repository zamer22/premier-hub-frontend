export type Section =
  | "tablero"
  | "partido"
  | "noticias"
  | "tienda"
  | "perfil"
  | "vr-arena"
  | "simulador"
  | "historia"
  | "arcade"
  | "offseason";

export const ROUTES: Record<Section, string> = {
  partido: "/partido",
  tablero: "/tablero",
  simulador: "/simulador",
  "vr-arena": "/vr-arena",
  tienda: "/tienda",
  noticias: "/noticias",
  historia: "/historia",
  arcade: "/arcade",
  perfil: "/perfil",
  offseason: "/offseason",
};

export const DEFAULT_ROUTE = ROUTES.partido;

export const TABS: { key: Section; label: string; path: string }[] = [
  { key: "partido", label: "Partido", path: ROUTES.partido },
  { key: "tablero", label: "Tablero", path: ROUTES.tablero },
  { key: "simulador", label: "Simulador", path: ROUTES.simulador },
  { key: "vr-arena", label: "VR Arena", path: ROUTES["vr-arena"] },
  { key: "tienda", label: "Tienda", path: ROUTES.tienda },
  { key: "noticias", label: "Noticias", path: ROUTES.noticias },
  { key: "historia", label: "Historia", path: ROUTES.historia },
  { key: "arcade", label: "Arcade", path: ROUTES.arcade },
  { key: "offseason", label: "Offseason Lab", path: ROUTES.offseason },
];

export const PROXIMAMENTE: Section[] = ["vr-arena"];

const VALID_SECTIONS: Section[] = [...TABS.map((tab) => tab.key), "perfil"];

function normalizeSection(value: string | null): Section | null {
  if (!value) return null;

  const normalized = value === "Arcade" ? "arcade" : value;
  return VALID_SECTIONS.includes(normalized as Section)
    ? (normalized as Section)
    : null;
}

function getRouteForSection(section: Section | null): string | null {
  return section ? ROUTES[section] : null;
}

export function getInitialRoute(search: string): string {
  const tabFromQuery = normalizeSection(new URLSearchParams(search).get("tab"));
  const savedTab = normalizeSection(localStorage.getItem("premier_tab"));

  return (
    getRouteForSection(tabFromQuery) ||
    getRouteForSection(savedTab) ||
    DEFAULT_ROUTE
  );
}

export function getSectionFromPath(pathname: string): Section {
  const route = [...TABS, { key: "perfil" as Section, path: ROUTES.perfil }]
    .find(
      (tabRoute) =>
        pathname === tabRoute.path || pathname.startsWith(`${tabRoute.path}/`),
    );

  return route?.key || "partido";
}
