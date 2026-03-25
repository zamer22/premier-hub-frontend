import { useState } from "react";
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
  const [tab, setTab] = useState<Section>("tablero");

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
            borderBottom: tab === t.key ? "2px solid #871d54" : "2px solid transparent",
            transition: "all 0.2s ease",
          }}>{t.label}</button>
        ))}
      </nav>
      <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
        {tab === "tablero" && <Tablero />}
        {tab === "partido" && <Partido />}
        {tab === "simulador" && <Simulador />}
        {tab === "tienda" && <Tienda />}
        {tab === "noticias" && <div style={{ background: "#fff", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "#84878F" }}>Noticias - Proximamente</div>}
        {tab === "vr-arena" && <div style={{ background: "#fff", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "#84878F" }}>VR Arena - Proximamente</div>}
      </div>
    </div>
  );
}
