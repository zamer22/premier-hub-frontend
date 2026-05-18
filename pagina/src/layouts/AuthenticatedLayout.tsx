import { Outlet, useLocation } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import type { InventoryItem } from "../hooks/useProfileCustomization";
import { getSectionFromPath } from "../router/routes";

type AuthenticatedLayoutProps = {
  profileFrame: InventoryItem | null;
  profileImage: string;
  user: any;
};

export default function AuthenticatedLayout({
  profileFrame,
  profileImage,
  user,
}: AuthenticatedLayoutProps) {
  const location = useLocation();
  const activeSection = getSectionFromPath(location.pathname);

  return (
    <div className="min-h-screen bg-surface app-shell">
      <AppNavbar
        profileFrame={profileFrame}
        profileImage={profileImage}
        user={user}
      />

      <div
        className={
          activeSection === "perfil"
            ? "px-8 py-6 w-full"
            : "px-8 py-6 max-w-[1400px] mx-auto animate-fade-in"
        }
      >
        <Outlet />
      </div>
    </div>
  );
}
