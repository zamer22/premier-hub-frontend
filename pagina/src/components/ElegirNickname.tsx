import { useState } from "react";
import { Button, Field, Input } from "./ui";

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
    if (nickname.trim().length < 3) {
      setError("El nickname debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/google-register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo,
          nombre_usuario: nombre,
          nickname: nickname.trim(),
          foto_perfil_url: fotoPerfilUrl,
        }),
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
    <main className="min-h-screen grid place-items-center bg-[var(--ph-surface)] p-4">
      <section className="ph-panel w-full max-w-[430px] animate-slide-up">
        <span className="ph-badge ph-badge--accent">Perfil nuevo</span>
        <h1 className="ph-title mt-4">Casi listo</h1>
        <p className="ph-subtitle text-sm">
          Hola <strong>{nombre}</strong>, elige el nickname que aparecera en rankings, tienda y comunidad.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <Field
            label="Nickname"
            hint="Solo letras, numeros y guiones bajos. Maximo 20 caracteres."
          >
            <Input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="ej. PremierFan99"
              maxLength={20}
              required
            />
          </Field>

          {error && <p className="m-0 text-sm font-semibold text-[var(--ph-danger-600)]">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "Entrar a PremierHub"}
          </Button>
        </form>
      </section>
    </main>
  );
}
