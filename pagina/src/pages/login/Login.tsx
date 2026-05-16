import { useState } from "react";
import "./Login.css";

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isRegister,      setIsRegister]      = useState(false);
  const [email,           setEmail]           = useState("");
  const [username,        setUsername]        = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister && password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    const endpoint = isRegister ? "/api/auth/registro" : "/api/auth/login";
    const body = isRegister
      ? { correo: email, nombre_usuario: username, nickname: username, contrasena: password }
      : { correo: email, contrasena: password };
    try {
      const res  = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) onLoginSuccess(data.user);
      else alert(data.error || (isRegister ? "Error al registrarse" : "Credenciales incorrectas"));
    } catch {
      alert("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    const redirectTo = import.meta.env.VITE_APP_URL;
    const selectAccount = sessionStorage.getItem("google_select_account");
    sessionStorage.removeItem("google_select_account");
    const prompt = selectAccount ? "&query_params=prompt%3Dselect_account" : "";
    window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}${prompt}`;
  };

  return (
    <div className="login">

      {/* ── Panel izquierdo: formulario ── */}
      <div
        className="flex-1 relative flex justify-center items-center p-8 login__left"
      >
        {/* Decoración: círculos de color difuminados */}
        <div className="absolute pointer-events-none login__orb login__orb--one" />
        <div className="absolute pointer-events-none login__orb login__orb--two" />

        {/* Tarjeta del formulario */}
        <div
          className="relative w-full animate-slide-up login__card"
        >
          {/* Encabezado */}
          <div className="login__header">
            <p className="login__eyebrow">
              PremierHub
            </p>
            <h1 className="login__title">
              {isRegister ? "Crear cuenta" : "Bienvenido"}
            </h1>
            <p className="login__subtitle">
              {isRegister
                ? "Regístrate para acceder a la experiencia completa"
                : "Ingresa tus credenciales para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login__form">

            {/* Correo */}
            <Field label="Correo electrónico">
              <input
                type="email" required
                placeholder="correo@ejemplo.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                  className="login__input"
              />
            </Field>

            {/* Nombre de usuario (solo registro) */}
            {isRegister && (
              <Field label="Nombre de usuario">
                <input
                  type="text" required
                  placeholder="ej. JMike99"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  className="login__input"
                />
              </Field>
            )}

            {/* Contraseña */}
            <Field label="Contraseña">
              <PasswordInput
                value={password} onChange={setPassword}
                show={showPassword} onToggle={() => setShowPassword(!showPassword)}
              />
            </Field>

            {/* Confirmar contraseña */}
            {isRegister && (
              <Field label="Confirmar contraseña">
                <PasswordInput
                  value={confirmPassword} onChange={setConfirmPassword}
                  show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
                />
              </Field>
            )}

            {!isRegister && (
              <p className="login__forgot">
                ¿Olvidaste tu contraseña?
              </p>
            )}

            {/* Botón principal */}
            <button
              type="submit" disabled={loading}
              className="login__primary"
            >
              {loading ? "Cargando..." : isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </button>

            {/* Divisor */}
            <div className="login__divider">
              <div className="login__divider-line" />
              <span className="login__divider-text">ó</span>
              <div className="login__divider-line" />
            </div>

            {/* Google */}
            <button
              type="button" onClick={handleGoogle}
              className="login__google"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                width="18" alt="Google" className="login__google-icon" />
              Continuar con Google
            </button>

            {/* Toggle registro / login */}
            <p className="login__toggle">
              {isRegister ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
              <span
                className="login__toggle-link"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Inicia sesión" : "Regístrate"}
              </span>
            </p>
          </form>
        </div>
      </div>

      {/* ── Panel derecho: marca ── */}
      <div
        className="flex-[1.2] hidden md:flex flex-col justify-center items-center gap-6 relative login__right"
      >
        {/* Fondo decorativo sutil */}
        <div className="absolute inset-0 pointer-events-none login__right-bg" />

        <div className="relative flex flex-col items-center gap-4">
          <img
            src="https://i.postimg.cc/RhHmYyQx/Logo_Premier_Hub.png"
            alt="PremierHub"
            className="login__logo"
          />
          <p className="login__slogan">
            La experiencia Premier League
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers de UI ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="login__field">
      <label className="login__label">
        {label}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggle }: {
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <div className="login__password">
      <input
        type={show ? "text" : "password"} required
        placeholder="••••••••"
        value={value} onChange={(e) => onChange(e.target.value)}
        className="login__input"
      />
      <button
        type="button" onClick={onToggle}
        className="login__password-toggle"
      >
        {show ? <EyeOpen /> : <EyeOff />}
      </button>
    </div>
  );
}
