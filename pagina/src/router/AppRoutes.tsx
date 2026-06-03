import { Dispatch, SetStateAction } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthenticatedLayout from "../layouts/AuthenticatedLayout";
import type { InventoryItem } from "../hooks/useProfileCustomization";
import Arcade from "../pages/arcade/Arcade";
import Historia from "../pages/historia/Historia";
import Noticia from "../pages/noticias/Noticia";
import Noticias from "../pages/noticias/NoticiasLanding";
import Partido from "../pages/partido/Partido";
import Perfil from "../pages/perfil/Perfil";
import Laboratorio from "../pages/offseason/OffseasonLab";
import Tablero from "../pages/tablero/Tablero";
import Tienda from "../pages/tienda/Tienda";
import VrArena from "../pages/vr-arena/VrArena";
import MissingXI from "../components/arcade/missing-xi/MissingXI";
import Wordle from "../pages/wordle/Wordle";
import {
  DEFAULT_ROUTE,
  PROXIMAMENTE,
  ROUTES,
  TABS,
  type Section,
  getInitialRoute,
} from "./routes";

type AppRoutesProps = {
  onAccountDeleted: () => void;
  onLogout: () => void;
  profileFrame: InventoryItem | null;
  profileImage: string;
  setProfileFrame: Dispatch<SetStateAction<InventoryItem | null>>;
  setProfileImage: Dispatch<SetStateAction<string>>;
  setUser: Dispatch<SetStateAction<any>>;
  user: any;
};

function ComingSoon({ section }: { section: Section }) {
  return (
    <div className="flex flex-col items-center justify-center mt-24 gap-3">
      <span className="text-[2rem] font-extrabold text-navy/20 tracking-tight">
        {TABS.find((tab) => tab.key === section)?.label.toUpperCase()}
      </span>
      <span className="text-muted text-sm">Proximamente</span>
    </div>
  );
}

export default function AppRoutes({
  onAccountDeleted,
  onLogout,
  profileFrame,
  profileImage,
  setProfileFrame,
  setProfileImage,
  setUser,
  user,
}: AppRoutesProps) {
  const location = useLocation();

  return (
    <Routes>
      <Route
        element={
          <AuthenticatedLayout
            profileFrame={profileFrame}
            profileImage={profileImage}
            user={user}
          />
        }
      >
        <Route
          index
          element={<Navigate to={getInitialRoute(location.search)} replace />}
        />
        <Route path="partido" element={<Partido user={user} />} />
        <Route path="historia" element={<Historia />} />
        <Route
          path="tienda"
          element={
            <Tienda
              user={user}
              onSaldoChange={(dinero: number) => setUser({ ...user, dinero })}
            />
          }
        />
        <Route
          path="perfil"
          element={
            <Perfil
              user={user}
              profileImage={profileImage}
              onLogout={onLogout}
              onUserUpdated={(nextUser) => setUser(nextUser)}
              onProfileImageChanged={(nextImage) => setProfileImage(nextImage)}
              onCustomizationChanged={(nextCustomization) =>
                setProfileFrame(nextCustomization.marcoItem || null)
              }
              onAccountDeleted={onAccountDeleted}
            />
          }
        />
        <Route path="laboratorio" element={<Laboratorio user={user} />} />
        <Route path="noticias" element={<Noticias />} />
        <Route path="noticias/:newsId" element={<Noticia />} />
        <Route path="vr-arena" element={<VrArena />} />
        <Route path="arcade" element={<Arcade />} />
        <Route path="arcade/wordle" element={<Wordle />} />
        <Route
          path="arcade/missing-xi"
          element={<MissingXI onSaldoChange={(dinero: number) => setUser({ ...user, dinero })} />}
        />
        <Route path="Arcade" element={<Navigate to={ROUTES.arcade} replace />} />
        {PROXIMAMENTE.map((section) => (
          <Route
            key={section}
            path={ROUTES[section].replace(/^\//, "")}
            element={<ComingSoon section={section} />}
          />
        ))}
        <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
      </Route>
    </Routes>
  );
}
