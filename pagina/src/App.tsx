import "./App.css";
import ElegirNickname from "./components/ElegirNickname";
import { useAuthSession } from "./hooks/useAuthSession";
import { useProfileCustomization } from "./hooks/useProfileCustomization";
import AdminEnvios from "./pages/admin/AdminEnvios";
import Landing from "./pages/landing/Landing";
import AppRoutes from "./router/AppRoutes";

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-surface gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-crimson border-t-transparent animate-spin" />
      <span className="text-muted text-sm font-medium tracking-wide">
        Cargando PremierHub...
      </span>
    </div>
  );
}

export default function App() {
  const {
    clearSession,
    completeOAuthNickname,
    handleLoginSuccess,
    logout,
    oauthNuevo,
    sessionLoading,
    setUser,
    user,
  } = useAuthSession();
  const {
    profileFrame,
    profileImage,
    setProfileFrame,
    setProfileImage,
  } = useProfileCustomization(user);

  if (sessionLoading) return <LoadingScreen />;

  if (oauthNuevo) {
    return (
      <ElegirNickname
        correo={oauthNuevo.correo}
        nombre={oauthNuevo.nombre}
        fotoPerfilUrl={oauthNuevo.fotoPerfilUrl}
        onComplete={(nextUser) => {
          if (nextUser.avatar_url) setProfileImage(nextUser.avatar_url);
          completeOAuthNickname(nextUser);
        }}
      />
    );
  }

  if (!user) {
    return <Landing onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.es_admin) {
    return <AdminEnvios user={user} onLogout={logout} />;
  }

  return (
    <AppRoutes
      onAccountDeleted={clearSession}
      onLogout={logout}
      profileFrame={profileFrame}
      profileImage={profileImage}
      setProfileFrame={setProfileFrame}
      setProfileImage={setProfileImage}
      setUser={setUser}
      user={user}
    />
  );
}
