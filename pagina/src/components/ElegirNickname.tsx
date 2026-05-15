import { useState } from "react";
import "./ElegirNickname.css";

interface Props {
  correo: string;
  nombre: string;
  fotoPerfilUrl?: string;
  onComplete: (user: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function ElegirNickname({ correo, nombre, fotoPerfilUrl, onComplete }: Props) {
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
        body: JSON.stringify({ correo, nombre_usuario: nombre, nickname: nickname.trim(), foto_perfil_url: fotoPerfilUrl }),
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
    <div className="nickname">
      <div className="nickname__card">
        <h2 className="nickname__title">Casi listo</h2>
        <p className="nickname__subtitle">
          Hola <strong>{nombre}</strong>, elige un nickname para tu cuenta en PremierHub.
        </p>
        <form onSubmit={handleSubmit} className="nickname__form">
          <div>
            <label className="nickname__label">
              Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="ej. PremierFan99"
              maxLength={20}
              className="nickname__input"
              required
            />
            <p className="nickname__hint">Solo letras, numeros y guiones bajos. Max. 20 caracteres.</p>
          </div>
          {error && <p className="nickname__error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="nickname__button"
          >
            {loading ? "Creando cuenta..." : "Entrar a PremierHub"}
          </button>
        </form>
      </div>
    </div>
  );
}
