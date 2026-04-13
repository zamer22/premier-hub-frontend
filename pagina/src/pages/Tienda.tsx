import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.DEV ? "" : "https://api.zamer-o.com";

/* ── Types ── */
interface Producto {
  id_producto: number; nombre: string; costo: string; tipo: string;
  stock: number; es_nuevo: boolean; equipo: string | null; imagen: string | null;
  temporada_nombre?: string; temporada_fin?: string; categoria?: string;
}
interface InventarioItem extends Producto {
  id_inventario: number; fecha_compra: string; en_marketplace: boolean;
}
interface Listado {
  id_listado: number; id_vendedor: number; precio: string;
  nombre: string; tipo: string; imagen: string | null; equipo: string | null;
  vendedor_nickname: string; fecha_creacion: string;
}
interface Temporada { id_temporada: number; nombre: string; fecha_fin: string; }

interface TiendaProps {
  user: { id_usuario: number; nickname: string; dinero: number; [k: string]: any };
  onSaldoChange: (nuevoSaldo: number) => void;
}

type SubTab = "perfil" | "real" | "marketplace";
type MarketView = "explorar" | "mis-items";

/* ── Component ── */
export default function Tienda({ user, onSaldoChange }: TiendaProps) {
  const [subTab, setSubTab] = useState<SubTab>("perfil");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [misItems, setMisItems] = useState<InventarioItem[]>([]);
  const [listados, setListados] = useState<Listado[]>([]);
  const [misListados, setMisListados] = useState<Listado[]>([]);
  const [temporada, setTemporada] = useState<Temporada | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [marketView, setMarketView] = useState<MarketView>("explorar");
  const [publishModal, setPublishModal] = useState<{ item: InventarioItem; precio: string } | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const saldo = Number(user.dinero);
  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  /* ── Data fetching ── */
  const fetchProductos = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/productos-v2?categoria=${cat}`);
      const d = await r.json();
      if (d.success) setProductos(d.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchTemporada = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/temporada-activa`);
      const d = await r.json();
      if (d.success) setTemporada(d.data);
    } catch { /* ignore */ }
  }, []);

  const fetchMisItems = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/mis-items/${user.id_usuario}`);
      const d = await r.json();
      if (d.success) setMisItems(d.data);
    } catch { /* ignore */ }
  }, [user.id_usuario]);

  const fetchListados = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/marketplace/listados`);
      const d = await r.json();
      if (d.success) setListados(d.data.filter((l: Listado) => l.id_vendedor !== user.id_usuario));
    } catch { /* ignore */ }
  }, [user.id_usuario]);

  const fetchMisListados = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/marketplace/listados?mios=${user.id_usuario}`);
      const d = await r.json();
      if (d.success) setMisListados(d.data);
    } catch { /* ignore */ }
  }, [user.id_usuario]);

  const refreshSaldo = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/saldo/${user.id_usuario}`);
      const d = await r.json();
      if (d.success) onSaldoChange(Number(d.dinero));
    } catch { /* ignore */ }
  }, [user.id_usuario, onSaldoChange]);

  // Reset filtros al cambiar de tab
  useEffect(() => {
    setBusqueda("");
    setFiltroTipo("todos");
    if (subTab === "perfil") { fetchProductos("perfil"); fetchTemporada(); }
    else if (subTab === "real") { fetchProductos("real"); }
    else { fetchListados(); fetchMisItems(); fetchMisListados(); }
  }, [subTab, fetchProductos, fetchTemporada, fetchListados, fetchMisItems, fetchMisListados]);

  const TIPOS = ["todos", "jersey", "balonazo", "ropa", "accesorio"];

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.equipo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
    const matchTipo = filtroTipo === "todos" || p.tipo === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  const listadosFiltrados = listados.filter(l => {
    const matchBusqueda = l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (l.equipo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
      l.vendedor_nickname.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === "todos" || l.tipo === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  /* ── Actions ── */
  const comprar = async (id_producto: number, nombre: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tienda/comprar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario, id_producto }),
      });
      const data = await res.json();
      if (data.success) {
        onSaldoChange(Number(data.saldo));
        setProductos(prev => prev.map(p => p.id_producto === id_producto ? { ...p, stock: p.stock - 1 } : p));
        showToast(`${nombre} comprado!`, true);
      } else { showToast(data.error, false); }
    } catch { showToast("Error de conexion", false); }
  };

  const comprarMarketplace = async (id_listado: number, nombre: string) => {
    try {
      const res = await fetch(`${API_URL}/api/marketplace/comprar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_comprador: user.id_usuario, id_listado }),
      });
      const data = await res.json();
      if (data.success) {
        onSaldoChange(Number(data.saldo));
        setListados(prev => prev.filter(l => l.id_listado !== id_listado));
        showToast(`${nombre} comprado en marketplace!`, true);
      } else { showToast(data.error, false); }
    } catch { showToast("Error de conexion", false); }
  };

  const publicar = async () => {
    if (!publishModal) return;
    const precio = Number(publishModal.precio);
    if (!precio || precio <= 0) { showToast("Precio inválido", false); return; }
    try {
      const res = await fetch(`${API_URL}/api/marketplace/publicar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario, id_inventario: publishModal.item.id_inventario, precio }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Item publicado en marketplace!", true);
        setPublishModal(null);
        fetchMisItems(); fetchMisListados();
      } else { showToast(data.error, false); }
    } catch { showToast("Error de conexion", false); }
  };

  const cancelarListado = async (id_listado: number) => {
    try {
      const res = await fetch(`${API_URL}/api/marketplace/cancelar/${id_listado}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Publicación cancelada", true);
        fetchMisListados(); fetchMisItems();
      } else { showToast(data.error, false); }
    } catch { showToast("Error de conexion", false); }
  };

  const tipoLabel = (tipo: string) =>
    tipo === "jersey" ? "Jersey" : tipo === "balonazo" ? "Balón" : tipo === "ropa" ? "Ropa" : "Accesorio";

  /* ── Product card (reused across sub-tabs) ── */
  const ProductCard = ({ p, onBuy, badge }: { p: Producto; onBuy: () => void; badge?: string }) => (
    <div style={{
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
      {badge && (
        <span style={{
          position: "absolute", top: "10px", right: "10px", background: "#263a55",
          color: "#fff", fontSize: "0.6rem", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 700, zIndex: 1,
        }}>{badge}</span>
      )}
      <div style={{
        height: "140px", background: p.imagen ? `url(${p.imagen}) center/cover` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!p.imagen && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{tipoLabel(p.tipo)}</span>}
      </div>
      <div style={{ padding: "0.75rem 1rem" }}>
        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#263a55", marginBottom: "0.2rem", lineHeight: "1.3" }}>{p.nombre}</p>
        <p style={{ fontSize: "0.75rem", color: "#84878F", marginBottom: "0.5rem" }}>
          {tipoLabel(p.tipo)}{p.equipo ? ` · ${p.equipo}` : ""}
          {p.stock === 0
            ? <span style={{ marginLeft: "0.4rem", background: "#fee2e2", color: "#dc2626", fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "4px" }}>Sin stock</span>
            : <span style={{ marginLeft: "0.4rem", color: "#84878F" }}>· {p.stock} disp.</span>
          }
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#263a55" }}>{p.costo} pts</span>
          <button onClick={onBuy} disabled={p.stock <= 0 || Number(p.costo) > saldo}
            style={{
              padding: "0.35rem 0.75rem",
              background: p.stock > 0 && Number(p.costo) <= saldo ? "#263a55" : "#ddd",
              color: p.stock > 0 && Number(p.costo) <= saldo ? "#fff" : "#999",
              border: "none", borderRadius: "6px",
              cursor: p.stock > 0 && Number(p.costo) <= saldo ? "pointer" : "not-allowed",
              fontSize: "0.8rem", fontWeight: 600, transition: "background 0.2s",
            }}>Comprar</button>
        </div>
      </div>
    </div>
  );

  /* ── Marketplace listing card ── */
  const ListingCard = ({ l, onBuy }: { l: Listado; onBuy: () => void }) => (
    <div style={{
      background: "#fff", borderRadius: "12px", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s",
      position: "relative",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
    >
      <div style={{
        height: "120px", background: l.imagen ? `url(${l.imagen}) center/cover` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!l.imagen && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{tipoLabel(l.tipo)}</span>}
      </div>
      <div style={{ padding: "0.75rem 1rem" }}>
        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#263a55", marginBottom: "0.15rem" }}>{l.nombre}</p>
        <p style={{ fontSize: "0.7rem", color: "#84878F", marginBottom: "0.4rem" }}>
          Vendedor: {l.vendedor_nickname}{l.equipo ? ` · ${l.equipo}` : ""}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#263a55" }}>{l.precio} pts</span>
          <button onClick={onBuy} disabled={Number(l.precio) > saldo}
            style={{
              padding: "0.35rem 0.75rem",
              background: Number(l.precio) <= saldo ? "#263a55" : "#ddd",
              color: Number(l.precio) <= saldo ? "#fff" : "#999",
              border: "none", borderRadius: "6px",
              cursor: Number(l.precio) <= saldo ? "pointer" : "not-allowed",
              fontSize: "0.8rem", fontWeight: 600,
            }}>Comprar</button>
        </div>
      </div>
    </div>
  );

  /* ── Render ── */
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

      {/* Publish modal */}
      {publishModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 999,
        }} onClick={() => setPublishModal(null)}>
          <div style={{
            background: "#fff", borderRadius: "12px", padding: "1.5rem", width: "340px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "#263a55", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Publicar en Marketplace</h3>
            <p style={{ color: "#84878F", fontSize: "0.8rem", marginBottom: "1rem" }}>{publishModal.item.nombre}</p>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#263a55", marginBottom: "0.4rem", textTransform: "uppercase" }}>
              Precio (pts)
            </label>
            <input
              type="number" min="1" value={publishModal.precio}
              onChange={(e) => setPublishModal({ ...publishModal, precio: e.target.value })}
              style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.9rem", boxSizing: "border-box", marginBottom: "1rem" }}
              placeholder="Ej: 500"
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setPublishModal(null)} style={{
                flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #ddd",
                background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600,
              }}>Cancelar</button>
              <button onClick={publicar} style={{
                flex: 1, padding: "0.6rem", borderRadius: "8px", border: "none",
                background: "#E90052", color: "#fff", cursor: "pointer", fontWeight: 700,
              }}>Publicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ color: "#263a55", fontSize: "1.25rem", marginBottom: "0.2rem" }}>Tienda</h2>
          <p style={{ color: "#84878F", fontSize: "0.8rem" }}>Compra con tus puntos</p>
        </div>
        <div style={{ background: "#263a55", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700 }}>
          {saldo.toLocaleString()} pts
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e9ecef", marginBottom: "1.5rem", gap: "0" }}>
        {([
          { key: "perfil" as SubTab,       label: "Objetos de Perfil" },
          { key: "real" as SubTab,         label: "Objetos Reales"    },
          { key: "marketplace" as SubTab,  label: "Marketplace"       },
        ]).map((t) => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            style={{
              padding: "0.75rem 1.5rem", border: "none", cursor: "pointer", background: "none",
              fontSize: "0.85rem", fontWeight: subTab === t.key ? 700 : 500,
              color: subTab === t.key ? "#E90052" : "#84878F",
              borderBottom: subTab === t.key ? "2px solid #E90052" : "2px solid transparent",
              marginBottom: "-2px", transition: "all 0.2s ease", whiteSpace: "nowrap",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Buscador + filtros (visible en perfil, real y explorar marketplace) */}
      {(subTab !== "marketplace" || marketView === "explorar") && (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#84878F", fontSize: "0.75rem", fontWeight: 600 }}>&#x2315;</span>
            <input
              type="text"
              placeholder="Buscar por nombre, equipo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%", padding: "0.6rem 0.75rem 0.6rem 2.2rem",
                borderRadius: "8px", border: "1px solid #e0e0e0", fontSize: "0.85rem",
                background: "#fff", boxSizing: "border-box", outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {TIPOS.map(tipo => (
              <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                style={{
                  padding: "0.4rem 0.85rem", borderRadius: "20px", border: "1px solid",
                  borderColor: filtroTipo === tipo ? "#263a55" : "#e0e0e0",
                  background: filtroTipo === tipo ? "#263a55" : "#fff",
                  color: filtroTipo === tipo ? "#fff" : "#84878F",
                  fontSize: "0.78rem", fontWeight: filtroTipo === tipo ? 700 : 400,
                  cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s ease",
                }}>
                {tipo === "todos" ? "Todos" : tipo === "balonazo" ? "Balón" : tipo === "jersey" ? "Jersey" : tipo === "ropa" ? "Ropa" : "Accesorio"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Sub-tab: Objetos de Perfil ── */}
      {subTab === "perfil" && (
        <div>
          {temporada && (
            <div style={{
              background: "linear-gradient(135deg, #263a55, #871d54)", color: "#fff",
              padding: "0.75rem 1.25rem", borderRadius: "10px", marginBottom: "1.25rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{temporada.nombre}</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                Termina: {new Date(temporada.fecha_fin).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          )}
          {loading ? <p style={{ color: "#84878F" }}>Cargando...</p> : (
            productosFiltrados.length === 0 ? <p style={{ color: "#84878F", textAlign: "center", marginTop: "2rem" }}>No se encontraron productos</p> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem" }}>
                {productosFiltrados.map(p => <ProductCard key={p.id_producto} p={p} onBuy={() => comprar(p.id_producto, p.nombre)} />)}
              </div>
            )
          )}
        </div>
      )}

      {/* ── Sub-tab: Objetos Reales ── */}
      {subTab === "real" && (
        <div>
          {loading ? <p style={{ color: "#84878F" }}>Cargando...</p> : (
            productosFiltrados.length === 0 ? <p style={{ color: "#84878F", textAlign: "center", marginTop: "2rem" }}>No se encontraron productos</p> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem" }}>
                {productosFiltrados.map(p => <ProductCard key={p.id_producto} p={p} onBuy={() => comprar(p.id_producto, p.nombre)} badge="OBJETO REAL" />)}
              </div>
            )
          )}
        </div>
      )}

      {/* ── Sub-tab: Marketplace ── */}
      {subTab === "marketplace" && (
        <div>
          {/* Inner toggle */}
          <div style={{ display: "inline-flex", background: "#f0f2f5", borderRadius: "10px", padding: "4px", marginBottom: "1.25rem" }}>
            {([
              { key: "explorar" as MarketView,   label: "Explorar" },
              { key: "mis-items" as MarketView,  label: "Mis Items" },
            ]).map((v) => (
              <button key={v.key}
                onClick={() => { setMarketView(v.key); if (v.key === "mis-items") { fetchMisItems(); fetchMisListados(); } }}
                style={{
                  padding: "0.45rem 1.1rem", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "0.82rem", fontWeight: marketView === v.key ? 700 : 500,
                  background: marketView === v.key ? "#fff" : "none",
                  color: marketView === v.key ? "#263a55" : "#84878F",
                  boxShadow: marketView === v.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s ease",
                }}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Explorar view */}
          {marketView === "explorar" && (
            listadosFiltrados.length === 0 ? (
              <p style={{ color: "#84878F", textAlign: "center", marginTop: "2rem" }}>No hay listados en el marketplace</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem" }}>
                {listadosFiltrados.map(l => (
                  <ListingCard key={l.id_listado} l={l} onBuy={() => comprarMarketplace(l.id_listado, l.nombre)} />
                ))}
              </div>
            )
          )}

          {/* Mis Items view */}
          {marketView === "mis-items" && (
            <div>
              {/* My inventory */}
              <h3 style={{ color: "#263a55", fontSize: "1rem", marginBottom: "0.75rem" }}>Mi Inventario</h3>
              {misItems.length === 0 ? (
                <p style={{ color: "#84878F", fontSize: "0.85rem", marginBottom: "1.5rem" }}>No tienes items. Compra algo en la tienda primero.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
                  {misItems.map(item => (
                    <div key={item.id_inventario} style={{
                      background: "#fff", borderRadius: "10px", padding: "0.75rem",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "0.4rem",
                    }}>
                      <div style={{
                        height: "80px", borderRadius: "8px",
                        background: item.imagen ? `url(${item.imagen}) center/cover` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {!item.imagen && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{tipoLabel(item.tipo)}</span>}
                      </div>
                      <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#263a55" }}>{item.nombre}</p>
                      <p style={{ fontSize: "0.7rem", color: "#84878F" }}>
                        {item.tipo}{item.equipo ? ` · ${item.equipo}` : ""}
                      </p>
                      {item.en_marketplace ? (
                        <span style={{ fontSize: "0.7rem", color: "#E90052", fontWeight: 600 }}>En marketplace</span>
                      ) : (
                        <button onClick={() => setPublishModal({ item, precio: "" })}
                          style={{
                            padding: "0.3rem 0.6rem", background: "#E90052", color: "#fff",
                            border: "none", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                            cursor: "pointer", alignSelf: "flex-start",
                          }}>
                          Publicar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* My active listings */}
              <h3 style={{ color: "#263a55", fontSize: "1rem", marginBottom: "0.75rem" }}>Mis Publicaciones Activas</h3>
              {misListados.length === 0 ? (
                <p style={{ color: "#84878F", fontSize: "0.85rem" }}>No tienes publicaciones activas</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {misListados.map(l => (
                    <div key={l.id_listado} style={{
                      background: "#fff", borderRadius: "10px", padding: "0.75rem 1rem",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#263a55" }}>{l.nombre}</p>
                        <p style={{ fontSize: "0.75rem", color: "#84878F" }}>
                          Precio: <span style={{ color: "#263a55", fontWeight: 700 }}>{l.precio} pts</span>
                          {" · "}Publicado: {new Date(l.fecha_creacion).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      <button onClick={() => cancelarListado(l.id_listado)}
                        style={{
                          padding: "0.35rem 0.75rem", background: "#fff", color: "#dc2626",
                          border: "1px solid #dc2626", borderRadius: "6px", fontSize: "0.78rem",
                          fontWeight: 600, cursor: "pointer",
                        }}>
                        Cancelar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
