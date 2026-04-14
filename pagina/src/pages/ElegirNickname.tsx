import { useState } from "react";

interface Props {
  correo: string;
  nombre: string;
  onComplete: (user: any) => void;
}

const API_URL = import.meta.env.DEV ? "" : "https://api.zamer-o.com";

export default function ElegirNickname({ correo, nombre, onComplete }: Props) {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 3) { setError("El nickname debe tener al menos 3 caracteres"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/google-register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, nombre, nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (data.success) onComplete(data.user);
      else setError(data.error || "Error al crear la cuenta");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center", background: "#263a55" }}>
      <div style={{ background: "#fff", padding: "2.5rem", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
        <h2 style={{ color: "#263a55", fontWeight: 800, marginBottom: "0.5rem" }}>¡Casi listo!</h2>
        <p style={{ color: "#84878F", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Hola <strong>{nombre}</strong>, elige un nickname para tu cuenta en PremierHub.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#263a55", marginBottom: "0.4rem", textTransform: "uppercase" }}>
              Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="ej. PremierFan99"
              maxLength={20}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.9rem", boxSizing: "border-box" }}
              required
            />
            <p style={{ fontSize: "0.75rem", color: "#84878F", marginTop: "0.3rem" }}>Solo letras, números y guiones bajos. Máx. 20 caracteres.</p>
          </div>
          {error && <p style={{ color: "#E90052", fontSize: "0.85rem", margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: "#E90052", color: "#fff", border: "none", padding: "0.8rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creando cuenta..." : "Entrar a PremierHub"}
          </button>
        </form>
      </div>
    </div>
  );
}
