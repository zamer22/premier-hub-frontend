import Tablero from "./pages/Tablero";
import Partido from "./pages/Partido";
import Simulador from "./pages/Simulador";
import Tienda from "./pages/Tienda";
import Noticias from "./pages/NoticiasLanding";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

type Section =
  | "tablero"
  | "partido"
  | "noticias"
  | "tienda"
  | "vr-arena"
  | "simulador";

const TABS: { key: Section; label: string; path: string }[] = [
  { key: "tablero", label: "Tablero", path: "/tablero" },
  { key: "partido", label: "Partido", path: "/partido" },
  { key: "tienda", label: "Tienda", path: "/tienda" },
  { key: "simulador", label: "Simulador", path: "/simulador" },
  { key: "noticias", label: "Noticias", path: "/noticias" },
  { key: "vr-arena", label: "VR Arena", path: "/vr-arena" },
];

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f8" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          height: "60px",
          padding: "0 2rem",
          background: "#263a55",
          gap: "0.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <span
          style={{
            color: "#E90052",
            fontWeight: 800,
            fontSize: "1.3rem",
            marginRight: "2.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          PREMIER<span style={{ color: "#fff" }}>HUB</span>
        </span>

        {TABS.map((t) => (
          <NavLink
            key={t.key}
            to={t.path}
            style={({ isActive }: { isActive: boolean }) => ({
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              background: isActive ? "rgba(233,0,82,0.15)" : "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              color: isActive ? "#fff" : "#84878F",
              fontWeight: isActive ? 700 : 500,
              borderBottom: isActive
                ? "2px solid #871d54"
                : "2px solid transparent",
              transition: "all 0.2s ease",
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: "2rem",
          maxWidth: "1100px",
          margin: "0 auto",
          animation: "fadeIn 0.3s ease",
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/tablero" replace />} />
          <Route path="/tablero" element={<Tablero />} />
          <Route path="/partido" element={<Partido />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/vr-arena" element={<div>VR Arena - Proximamente</div>} />
        </Routes>
      </div>
    </div>
  );
}