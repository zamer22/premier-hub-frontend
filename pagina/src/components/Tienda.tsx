import { useState, useEffect } from "react";
const API_URL: string = "http://localhost:4000";

interface Producto { id_producto: number; nombre: string; costo: string; tipo: string; stock: number; es_nuevo: boolean; equipo: string | null; imagen: string | null; }

export default function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(1500);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/tienda/productos`).then(r => r.json()).then(d => { if (d.success) setProductos(d.data); }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const comprar = async (id: number, nombre: string): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/api/tienda/comprar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: 1, id_producto: id }),
      });
      const data = await res.json();
      if (data.success) {
        setSaldo(Number(data.saldo));
        setProductos(prev => prev.map(p => p.id_producto === id ? { ...p, stock: p.stock - 1 } : p));
        showToast(`${nombre} comprado!`, true);
      } else { showToast(data.error, false); }
    } catch (_) { showToast("Error de conexion", false); }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "80px", right: "2rem", padding: "0.75rem 1.25rem",
          background: toast.ok ? "#16a34a" : "#dc2626", color: "#fff", borderRadius: "10px",
          fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          animation: "slideUp 0.3s ease", zIndex: 1000,
        }}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ color: "#263a55", fontSize: "1.25rem", marginBottom: "0.2rem" }}>Tienda</h2>
          <p style={{ color: "#84878F", fontSize: "0.8rem" }}>Compra con tus puntos</p>
        </div>
        <div style={{ background: "#263a55", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700 }}>
          {saldo.toLocaleString()} pts
        </div>
      </div>

      {loading && <p style={{ color: "#84878F" }}>Cargando...</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {productos.map((p) => (
          <div key={p.id_producto} style={{
            background: "#fff", borderRadius: "12px", overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "default", position: "relative",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
          >
            {p.es_nuevo && (
              <span style={{
                position: "absolute", top: "10px", left: "10px", background: "#E90052",
                color: "#fff", fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 700, zIndex: 1,
              }}>NUEVO</span>
            )}

            {/* Imagen placeholder */}
            <div style={{
              height: "140px", background: p.imagen ? `url(${p.imagen}) center/cover` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {!p.imagen && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "2.5rem", fontWeight: 800 }}>{p.tipo === "jersey" ? "👕" : p.tipo === "balonazo" ? "⚽" : p.tipo === "ropa" ? "🧥" : "🎩"}</span>}
            </div>

            <div style={{ padding: "0.75rem 1rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#263a55", marginBottom: "0.2rem", lineHeight: "1.3" }}>{p.nombre}</p>
              <p style={{ fontSize: "0.75rem", color: "#84878F", marginBottom: "0.5rem" }}>
                {p.tipo}{p.equipo ? ` · ${p.equipo}` : ""} · Stock: {p.stock}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1rem", fontWeight: 800, color: "#E90052" }}>{p.costo} pts</span>
                <button onClick={() => comprar(p.id_producto, p.nombre)} disabled={p.stock <= 0 || Number(p.costo) > saldo}
                  style={{
                    padding: "0.35rem 0.75rem", background: p.stock > 0 && Number(p.costo) <= saldo ? "#263a55" : "#ddd",
                    color: p.stock > 0 && Number(p.costo) <= saldo ? "#fff" : "#999", border: "none", borderRadius: "6px",
                    cursor: p.stock > 0 && Number(p.costo) <= saldo ? "pointer" : "not-allowed",
                    fontSize: "0.8rem", fontWeight: 600, transition: "background 0.2s",
                  }}>Comprar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
