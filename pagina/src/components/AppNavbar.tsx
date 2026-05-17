import { CSSProperties } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { InventoryItem } from "../hooks/useProfileCustomization";
import { DEFAULT_ROUTE, ROUTES, TABS, getSectionFromPath } from "../router/routes";

type AppNavbarProps = {
  profileFrame: InventoryItem | null;
  profileImage: string;
  user: any;
};

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

function getFrameStyle(frame?: InventoryItem | null): CSSProperties {
  const metadata = frame?.metadata || {};
  const cssBackground =
    frame?.css || metadata.background || metadata.css_background;

  if (cssBackground) return { background: String(cssBackground) };
  if (frame?.imagen) {
    return { background: `#fff url(${frame.imagen}) center/cover no-repeat` };
  }

  return { background: "#d6dbe3" };
}

function ProfileAvatar({
  profileFrame,
  profileImage,
  user,
}: AppNavbarProps) {
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

export default function AppNavbar({
  profileFrame,
  profileImage,
  user,
}: AppNavbarProps) {
  const location = useLocation();
  const activeSection = getSectionFromPath(location.pathname);

  return (
    <nav className="flex items-center h-[66px] px-8 bg-navy gap-0.5 app-nav">
      <NavLink
        to={DEFAULT_ROUTE}
        onClick={() => localStorage.setItem("premier_tab", "partido")}
        className="font-extrabold text-[1.25rem] tracking-tight select-none mr-10 app-logo"
      >
        <span className="text-crimson">PREMIER</span>
        <span className="text-white">HUB</span>
      </NavLink>

      {TABS.map((tab) => (
        <NavLink
          to={tab.path}
          key={tab.key}
          onClick={() => localStorage.setItem("premier_tab", tab.key)}
          className={({ isActive }) =>
            `relative px-4 py-2 text-[0.82rem] whitespace-nowrap transition-all duration-200 cursor-pointer border-0 bg-transparent outline-none app-tab ${
              isActive ? "is-active" : ""
            }`
          }
        >
          {tab.label}
          {activeSection === tab.key && (
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
  );
}
