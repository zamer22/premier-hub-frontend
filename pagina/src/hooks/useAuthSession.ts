import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_ROUTE } from "../router/routes";

const API_URL = import.meta.env.VITE_API_URL;

type OAuthPendingUser = {
  correo: string;
  nombre: string;
  fotoPerfilUrl?: string;
};

export function useAuthSession() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [oauthNuevo, setOauthNuevo] = useState<OAuthPendingUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const { hash, pathname, search } = window.location;

    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get("access_token");

      if (!accessToken) {
        setSessionLoading(false);
        return;
      }

      navigate({ pathname, search }, { replace: true });

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

          if (data.isNew) {
            setOauthNuevo({
              correo: data.correo,
              nombre: data.nombre,
              fotoPerfilUrl: data.foto_perfil_url,
            });
          } else {
            setUser(data.user);
          }
        })
        .catch(() => alert("No se pudo conectar con el servidor"))
        .finally(() => setSessionLoading(false));

      return;
    }

    fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setSessionLoading(false));
  }, [navigate]);

  const handleLoginSuccess = async (fallbackUser: any) => {
    localStorage.removeItem("premier_tab");

    const full = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .catch(() => ({ success: false }));

    setUser(full.success ? full.user : fallbackUser);
    navigate(DEFAULT_ROUTE, { replace: true });
  };

  const completeOAuthNickname = (nextUser: any) => {
    setOauthNuevo(null);
    setUser(nextUser);
    navigate(DEFAULT_ROUTE, { replace: true });
  };

  const clearSession = () => {
    localStorage.removeItem("premier_tab");
    setUser(null);
    navigate("/", { replace: true });
  };

  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    sessionStorage.setItem("google_select_account", "1");
    clearSession();
  };

  return {
    clearSession,
    completeOAuthNickname,
    handleLoginSuccess,
    logout,
    oauthNuevo,
    sessionLoading,
    setUser,
    user,
  };
}
