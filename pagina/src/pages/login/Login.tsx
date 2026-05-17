import { useState } from "react";
import { Button, Field, Input } from "../../components/ui";
import "./Login.css";

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister && password !== confirmPassword) {
      alert("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    const endpoint = isRegister ? "/api/auth/registro" : "/api/auth/login";
    const body = isRegister
      ? { correo: email, nombre_usuario: username, nickname: username, contrasena: password }
      : { correo: email, contrasena: password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
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
    <div className="auth-card">
      <div className="auth-panel animate-slide-up">
        <div className="auth-header">
          <span className="ph-badge ph-badge--accent">PremierHub</span>
          <h1 className="auth-title">{isRegister ? "Crear cuenta" : "Bienvenido"}</h1>
          <p className="auth-subtitle">
            {isRegister
              ? "Crea tu perfil para competir, comprar items y seguir tu progreso."
              : "Entra a tu hub para seguir partidos, puntos y coleccionables."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Field label="Correo electronico">
            <Input
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          {isRegister && (
            <Field label="Nombre de usuario">
              <Input
                type="text"
                required
                placeholder="ej. PremierFan99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
          )}

          <Field label="Contrasena">
            <PasswordInput
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </Field>

          {isRegister && (
            <Field label="Confirmar contrasena">
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
              />
            </Field>
          )}

          {!isRegister && (
            <button type="button" className="auth-forgot">
              Olvidaste tu contrasena?
            </button>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Cargando..." : isRegister ? "Crear cuenta" : "Iniciar sesion"}
          </Button>

          <div className="auth-divider">
            <span />
            o
            <span />
          </div>

          <Button type="button" variant="secondary" onClick={handleGoogle}>
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="auth-google-icon" alt="" />
            Continuar con Google
          </Button>

          <p className="auth-switch-copy">
            {isRegister ? "Ya tienes cuenta? " : "No tienes cuenta? "}
            <button
              type="button"
              className="auth-switch-button"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Inicia sesion" : "Registrate"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="auth-password">
      <Input
        type={show ? "text" : "password"}
        required
        placeholder="********"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="auth-password-input"
      />
      <button
        type="button"
        onClick={onToggle}
        className="auth-password-toggle"
        aria-label={show ? "Ocultar contrasena" : "Mostrar contrasena"}
      >
        {show ? <EyeOpen /> : <EyeOff />}
      </button>
    </div>
  );
}
