import { useState } from "react";
import LoginPage from "./components/Login";
import Tablero from "./components/Tablero";
import Partido from "./components/Partido";
import Simulador from "./components/Simulador";
import Tienda from "./components/Tienda";

type Section = "tablero" | "partido" | "noticias" | "tienda" | "vr-arena" | "simulador";

const TABS: { key: Section; label: string }[] = [
  { key: "tablero", label: "Tablero" },
  { key: "partido", label: "Partido" },
  { key: "tienda", label: "Tienda" },
  { key: "simulador", label: "Simulador" },
  { key: "noticias", label: "Noticias" },
  { key: "vr-arena", label: "VR Arena" },
];

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [tab, setTab] = useState<Section>("tablero");

  const handleLoginSuccess = (u: any) => {
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f8" }}>
      <nav style={{
        display: "flex", alignItems: "center", height: "60px", padding: "0 2rem",
        background: "#263a55", gap: "0.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}>
        <span style={{ color: "#E90052", fontWeight: 800, fontSize: "1.3rem", marginRight: "2.5rem", letterSpacing: "-0.02em" }}>
          PREMIER<span style={{ color: "#fff" }}>HUB</span>
        </span>

        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "rgba(233,0,82,0.15)" : "none",
            border: "none", cursor: "pointer", fontSize: "0.85rem",
            padding: "0.5rem 1rem", borderRadius: "6px",
            color: tab === t.key ? "#fff" : "#84878F",
            fontWeight: tab === t.key ? 700 : 500,
            borderBottom: tab === t.key ? "2px solid #E90052" : "2px solid transparent",
            transition: "all 0.2s ease",
          }}>{t.label}</button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Badge del usuario con borde azul claro */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            border: "1.5px solid #7eb8d4",
            borderRadius: "6px",
            padding: "0.3rem 0.75rem",
            background: "rgba(126,184,212,0.08)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7eb8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span style={{ color: "#fff", fontSize: "0.8rem", fontWeight: 600 }}>
              {user.nickname || user.email}
            </span>
          </div>

          <button onClick={handleLogout} style={{
            background: "rgba(233,0,82,0.15)", border: "1px solid #E90052",
            color: "#E90052", padding: "0.35rem 0.85rem", borderRadius: "6px",
            cursor: "pointer", fontSize: "0.8rem", fontWeight: 700,
          }}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
        {tab === "tablero" && <Tablero />}
        {tab === "partido" && <Partido />}
        {tab === "simulador" && <Simulador />}
        {tab === "tienda" && <Tienda />}
        {tab === "noticias" && (
          <div style={{ background: "#fff", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "#84878F" }}>
            Noticias - Próximamente
          </div>
        )}
        {tab === "vr-arena" && (
          <div style={{ background: "#fff", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "#84878F" }}>
            VR Arena - Próximamente
          </div>
        )}
      </div>
    </div>
  );
}