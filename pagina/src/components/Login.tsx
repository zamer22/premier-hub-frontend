import { useState } from "react";

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const API_URL: string = "http://localhost:4000";

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#84878F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#84878F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
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

    if (isRegister) {
      if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            correo: email,
            nombre_usuario: username,
            nickname: username,
            contrasena: password,
          }),
        });
        const data = await res.json();
        if (data.success) {
          onLoginSuccess(data.user);
        } else {
          alert(data.error || "Error al registrarse");
        }
      } catch {
        alert("No se pudo conectar con el servidor");
      } finally {
        setLoading(false);
      }

    } else {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            correo: email,
            contrasena: password,
          }),
        });
        const data = await res.json();
        if (data.success) {
          onLoginSuccess(data.user);
        } else {
          alert(data.error || "Credenciales incorrectas");
        }
      } catch {
        alert("No se pudo conectar con el servidor");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogle = () => {
    // TODO: conectar Supabase OAuth
    alert("Google login próximamente");
  };

  return (
    <div style={s.screen}>
      <div style={s.formSide}>
        <div style={s.card}>
          <h1 style={s.title}>{isRegister ? "Crear cuenta" : "Bienvenido"}</h1>
          <p style={s.subtitle}>
            {isRegister
              ? "Ingresa tus datos para registrarte en PremierHub"
              : "Ingresa tus credenciales para acceder a PremierHub"}
          </p>

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.inputGroup}>
              <label style={s.label}>Correo electrónico</label>
              <input
                type="email"
                style={s.input}
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <div style={s.inputGroup}>
                <label style={s.label}>Nombre de usuario</label>
                <input
                  type="text"
                  style={s.input}
                  placeholder="ej. JMike"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={s.inputGroup}>
              <label style={s.label}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  style={s.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  {showPassword ? <EyeOpen /> : <EyeOff />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div style={s.inputGroup}>
                <label style={s.label}>Confirmar contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    style={s.input}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                    {showConfirm ? <EyeOpen /> : <EyeOff />}
                  </button>
                </div>
              </div>
            )}

            {!isRegister && (
              <p style={{ fontSize: "0.8rem", color: "#84878F", textAlign: "right", marginBottom: "0.5rem", cursor: "pointer" }}>
                ¿Olvidaste tu contraseña?
              </p>
            )}

            <button type="submit" style={{ ...s.mainBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? "Cargando..." : isRegister ? "Registrarse" : "Iniciar sesión"}
            </button>

            <div style={s.divider}>
              <div style={s.line} />
              <span style={{ padding: "0 10px", color: "#84878F", fontSize: "0.8rem" }}>ó</span>
              <div style={s.line} />
            </div>

            <button type="button" onClick={handleGoogle} style={s.googleBtn}>
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="18" alt="Google" />
              Continuar con Google
            </button>

            <p style={s.footer}>
              {isRegister ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
              <span
                style={{ color: "#E90052", fontWeight: 700, cursor: "pointer" }}
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "inicia sesión aquí" : "Regístrate aquí"}
              </span>
            </p>
          </form>
        </div>
      </div>

      <div style={s.brandSide}>
        <img
          src="https://i.postimg.cc/RhHmYyQx/Logo_Premier_Hub.png"
          alt="PremierHub Logo"
          style={{ maxWidth: "65%", height: "auto" }}
        />
      </div>
    </div>
  );
}

const s: { [k: string]: React.CSSProperties } = {
  screen: { display: "flex", height: "100vh", width: "100vw", background: "#f5f6f8" },
  formSide: { flex: 1, background: "#263a55", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" },
  brandSide: { flex: 1.2, background: "#fff", display: "flex", justifyContent: "center", alignItems: "center" },
  card: { background: "#fff", padding: "2.5rem", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
  title: { color: "#263a55", fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem" },
  subtitle: { color: "#84878F", fontSize: "0.85rem", marginBottom: "1.5rem" },
  form: { display: "flex", flexDirection: "column" },
  inputGroup: { marginBottom: "1rem" },
  label: { display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#263a55", marginBottom: "0.4rem", textTransform: "uppercase" },
  input: { width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.9rem", boxSizing: "border-box" },
  eyeBtn: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" },
  mainBtn: { background: "#6b1d4f", color: "#fff", border: "none", padding: "0.8rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", marginTop: "0.25rem", fontSize: "0.95rem" },
  googleBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "#fff", border: "1px solid #ddd", padding: "0.75rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600, color: "#263a55", fontSize: "0.9rem" },
  divider: { display: "flex", alignItems: "center", margin: "1.25rem 0" },
  line: { flex: 1, height: "1px", background: "#eee" },
  footer: { marginTop: "1.25rem", textAlign: "center", fontSize: "0.85rem", color: "#84878F" },
};