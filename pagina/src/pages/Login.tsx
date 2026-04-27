import { useState } from "react";

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
    window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>

      {/* ── Panel izquierdo: formulario ── */}
      <div
        className="flex-1 relative flex justify-center items-center p-8"
        style={{ background: "#263a55" }}
      >
        {/* Decoración: círculos de color difuminados */}
        <div className="absolute pointer-events-none"
          style={{ top: "10%", left: "-5%", width: 280, height: 280,
            background: "radial-gradient(circle, rgba(233,0,82,0.18) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div className="absolute pointer-events-none"
          style={{ bottom: "15%", right: "-8%", width: 220, height: 220,
            background: "radial-gradient(circle, rgba(135,29,84,0.25) 0%, transparent 70%)", borderRadius: "50%" }} />

        {/* Tarjeta del formulario */}
        <div
          className="relative w-full animate-slide-up"
          style={{
            maxWidth: 380, background: "#ffffff",
            borderRadius: 16, padding: "2.25rem",
            boxShadow: "0 24px 48px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {/* Encabezado */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#E90052", marginBottom: "0.4rem" }}>
              PremierHub
            </p>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#263a55",
              letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "0.4rem" }}>
              {isRegister ? "Crear cuenta" : "Bienvenido"}
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#84878F", lineHeight: 1.5 }}>
              {isRegister
                ? "Regístrate para acceder a la experiencia completa"
                : "Ingresa tus credenciales para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>

            {/* Correo */}
            <Field label="Correo electrónico">
              <input
                type="email" required
                placeholder="correo@ejemplo.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = "#263a55"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
              />
            </Field>

            {/* Nombre de usuario (solo registro) */}
            {isRegister && (
              <Field label="Nombre de usuario">
                <input
                  type="text" required
                  placeholder="ej. JMike99"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#263a55"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
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
              <p style={{ fontSize: "0.76rem", color: "#84878F", textAlign: "right",
                cursor: "pointer", marginTop: "-0.3rem" }}>
                ¿Olvidaste tu contraseña?
              </p>
            )}

            {/* Botón principal */}
            <button
              type="submit" disabled={loading}
              style={{
                padding: "0.75rem", borderRadius: 10, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: "0.9rem", color: "#fff", marginTop: "0.25rem",
                background: "linear-gradient(135deg, #871d54, #E90052)",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.2s, transform 0.1s",
                boxShadow: "0 4px 14px rgba(233,0,82,0.35)",
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? "Cargando..." : isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </button>

            {/* Divisor */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              <span style={{ fontSize: "0.75rem", color: "#84878F" }}>ó</span>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            </div>

            {/* Google */}
            <button
              type="button" onClick={handleGoogle}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "0.7rem", borderRadius: 10,
                background: "#fff", border: "1.5px solid #e5e7eb", cursor: "pointer",
                fontWeight: 600, fontSize: "0.85rem", color: "#263a55",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#263a55"; e.currentTarget.style.background = "#f8f9fa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                width="18" alt="Google" style={{ display: "block" }} />
              Continuar con Google
            </button>

            {/* Toggle registro / login */}
            <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#84878F" }}>
              {isRegister ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
              <span
                style={{ color: "#E90052", fontWeight: 700, cursor: "pointer" }}
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
        className="flex-[1.2] hidden md:flex flex-col justify-center items-center gap-6 relative"
        style={{ background: "#fff", borderLeft: "1px solid #f0f0f0" }}
      >
        {/* Fondo decorativo sutil */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #e9ecef 1px, transparent 0)",
            backgroundSize: "28px 28px",
            opacity: 0.6,
          }} />

        <div className="relative flex flex-col items-center gap-4">
          <img
            src="https://i.postimg.cc/RhHmYyQx/Logo_Premier_Hub.png"
            alt="PremierHub"
            style={{ maxWidth: "60%", height: "auto", display: "block" }}
          />
          <p style={{ fontSize: "0.8rem", color: "#84878F", letterSpacing: "0.1em",
            textTransform: "uppercase", fontWeight: 600 }}>
            La experiencia Premier League
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers de UI ── */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.65rem 0.85rem",
  borderRadius: 8, border: "1.5px solid #e5e7eb",
  fontSize: "0.88rem", outline: "none",
  transition: "border-color 0.2s",
  fontFamily: "inherit", color: "#1a1a2e",
  background: "#fff",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#263a55",
        textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"} required
        placeholder="••••••••"
        value={value} onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        onFocus={(e) => e.currentTarget.style.borderColor = "#263a55"}
        onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
      />
      <button
        type="button" onClick={onToggle}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "#84878F", display: "flex", alignItems: "center", padding: 0,
        }}
      >
        {show ? <EyeOpen /> : <EyeOff />}
      </button>
    </div>
  );
}
