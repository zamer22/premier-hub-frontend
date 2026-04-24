import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const API_URL = import.meta.env.VITE_API_URL;

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
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [marketView, setMarketView] = useState<MarketView>("explorar");
  const [publishingItem, setPublishingItem] = useState<{ item: InventarioItem; precio: string } | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroPerfilTipo, setFiltroPerfilTipo] = useState<string>("todos");
  const [productModal, setProductModal] = useState<Producto | null>(null);

  type ConfirmAction =
    | { kind: "buy-product"; producto: Producto }
    | { kind: "buy-listing"; listado: Listado }
    | { kind: "publish"; item: InventarioItem; precio: number };
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const saldo = Number(user.dinero) || 0;
  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  // Bloquear scroll del body cuando hay un modal abierto
  useEffect(() => {
    const hasModal = !!productModal || !!confirmAction || !!successMsg || !!publishingItem;
    document.body.style.overflow = hasModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [productModal, confirmAction, successMsg, publishingItem]);

  /* ── Data fetching ── */
  const fetchProductos = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/productos-v2?categoria=${cat}`);
      const d = await r.json();
      if (d.success) setProductos(d.data);
    } catch { /* ignore */ } finally { setLoading(false); }
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



  // Reset filtros al cambiar de tab
  useEffect(() => {
    setBusqueda("");
    setFiltroTipo("todos");
    setFiltroPerfilTipo("todos");
    if (subTab === "perfil") { fetchProductos("perfil"); fetchMisItems(); }
    else if (subTab === "real") { fetchProductos("real"); }
    else { fetchListados(); fetchMisItems(); fetchMisListados(); }
  }, [subTab, fetchProductos, fetchListados, fetchMisItems, fetchMisListados]);

  const TIPOS = ["todos", "jersey", "balonazo", "ropa", "accesorio"];

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.equipo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
    const matchTipo = filtroTipo === "todos" || p.tipo === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  const ownedIds = new Set(misItems.map(i => i.id_producto));

  const matchBq = (texto: string) => texto.toLowerCase().includes(busqueda.toLowerCase());
  const matchPerfilTipo = (p: Producto) => filtroPerfilTipo === "todos" || p.tipo === filtroPerfilTipo;
  const perfilTipos = ["todos", ...Array.from(new Set(productos.map(p => p.tipo)))];
  const perfilFiltrados = productos.filter(p =>
    (matchBq(p.nombre) || matchBq(p.equipo ?? "")) && matchPerfilTipo(p));

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
        const nuevoSaldo = data.saldo != null && !isNaN(Number(data.saldo)) ? Number(data.saldo) : saldo;
        onSaldoChange(nuevoSaldo);
        setProductos(prev => prev.map(p => p.id_producto === id_producto ? { ...p, stock: p.stock - 1 } : p));
        setConfirmAction(null);
        setProductModal(null);
        setSuccessMsg(`¡${nombre} es tuyo! Tu nuevo saldo es ${nuevoSaldo.toLocaleString()} pts.`);
      } else { setConfirmAction(null); showToast(data.error, false); }
    } catch { setConfirmAction(null); showToast("Error de conexion", false); }
  };

  const reclamarBonus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tienda/bonus`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario }),
      });
      const data = await res.json();
      if (data.success) {
        onSaldoChange(Number(data.dinero));
        showToast(`+${data.bonus} pts reclamados!`, true);
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
        const rawSaldo = data.saldo ?? data.nuevo_saldo;
        const nuevoSaldo = rawSaldo != null && !isNaN(Number(rawSaldo)) ? Number(rawSaldo) : saldo;
        onSaldoChange(nuevoSaldo);
        setListados(prev => prev.filter(l => l.id_listado !== id_listado));
        setConfirmAction(null);
        setSuccessMsg(`¡${nombre} comprado en marketplace! Tu nuevo saldo es ${nuevoSaldo.toLocaleString()} pts.`);
      } else { setConfirmAction(null); showToast(data.error, false); }
    } catch { setConfirmAction(null); showToast("Error de conexion", false); }
  };

  const publicar = async () => {
    if (!confirmAction || confirmAction.kind !== "publish") return;
    try {
      const res = await fetch(`${API_URL}/api/marketplace/publicar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario, id_inventario: confirmAction.item.id_inventario, precio: confirmAction.precio }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmAction(null);
        setPublishingItem(null);
        setSuccessMsg(`¡${confirmAction.item.nombre} publicado en el marketplace por ${confirmAction.precio.toLocaleString()} pts!`);
        fetchMisItems(); fetchMisListados();
      } else { setConfirmAction(null); showToast(data.error, false); }
    } catch { setConfirmAction(null); showToast("Error de conexion", false); }
  };

  const prepararPublicacion = () => {
    if (!publishingItem) return;
    const precio = Number(publishingItem.precio);
    if (!precio || precio <= 0) { showToast("Precio inválido", false); return; }
    setPublishingItem(null);
    setConfirmAction({ kind: "publish", item: publishingItem.item, precio });
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

  const tipoLabel = (tipo: string) => {
    const map: Record<string, string> = {
      jersey: "Jersey", balonazo: "Balón", ropa: "Ropa", accesorio: "Accesorio",
      banner: "Banner", marco: "Marco", foto_perfil: "Foto de Perfil", avatar: "Avatar",
    };
    return map[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, " ");
  };


  /* ── Product card (reused across sub-tabs) ── */
  const ProductCard = ({ p, onBuy, badge }: { p: Producto; onBuy: () => void; badge?: string }) => (
    <div
      onClick={() => setProductModal(p)}
      style={{
        background: "#fff", borderRadius: "12px", overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer", position: "relative",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)"; }}
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
        height: "140px", background: p.imagen ? `#f5f6f8 url(${p.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)",
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
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmAction({ kind: "buy-product", producto: p }); }}
            disabled={p.stock <= 0 || Number(p.costo) > saldo}
            style={{
              padding: "0.35rem 0.75rem",
              background: p.stock > 0 && Number(p.costo) <= saldo ? "#E90052" : "#ddd",
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
        height: "120px", background: l.imagen ? `#f5f6f8 url(${l.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)",
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
          <button onClick={() => setConfirmAction({ kind: "buy-listing", listado: l })} disabled={Number(l.precio) > saldo}
            style={{
              padding: "0.35rem 0.75rem",
              background: Number(l.precio) <= saldo ? "#E90052" : "#ddd",
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
  /* Todos los modales van en un portal pegado a document.body para escapar
     cualquier CSS transform del árbol (animate-fade-in, etc.)             */
  const modals = createPortal(
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "80px", right: "2rem", padding: "0.75rem 1.25rem", background: toast.ok ? "#16a34a" : "#dc2626", color: "#fff", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 9999 }}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* Modal: precio para publicar */}
      {publishingItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9001 }}
          onClick={() => setPublishingItem(null)}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "1.75rem", width: "360px", maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "#263a55", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.2rem" }}>Publicar en Marketplace</h3>
            <p style={{ color: "#84878F", fontSize: "0.82rem", marginBottom: "1.25rem" }}>{publishingItem.item.nombre}</p>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#263a55", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio (pts)</label>
            <input type="number" min="1" value={publishingItem.precio}
              onChange={(e) => setPublishingItem({ ...publishingItem, precio: e.target.value })}
              style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", fontSize: "0.95rem", boxSizing: "border-box", marginBottom: "1.25rem", outline: "none" }}
              placeholder="Ej: 500" autoFocus />
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setPublishingItem(null)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancelar</button>
              <button onClick={prepararPublicacion} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", border: "none", background: "#E90052", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>Continuar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar acción */}
      {confirmAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9002 }}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "1.75rem", width: "380px", maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "#263a55", fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.4rem" }}>¿Confirmar acción?</h3>
            {confirmAction.kind === "buy-product" && (
              <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.4rem" }}>
                Comprarás <strong style={{ color: "#263a55" }}>{confirmAction.producto.nombre}</strong> por <strong style={{ color: "#E90052" }}>{Number(confirmAction.producto.costo).toLocaleString()} pts</strong>. Te quedarán <strong style={{ color: "#263a55" }}>{(saldo - Number(confirmAction.producto.costo)).toLocaleString()} pts</strong>.
              </p>
            )}
            {confirmAction.kind === "buy-listing" && (
              <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.4rem" }}>
                Comprarás <strong style={{ color: "#263a55" }}>{confirmAction.listado.nombre}</strong> por <strong style={{ color: "#E90052" }}>{Number(confirmAction.listado.precio).toLocaleString()} pts</strong>. Te quedarán <strong style={{ color: "#263a55" }}>{(saldo - Number(confirmAction.listado.precio)).toLocaleString()} pts</strong>.
              </p>
            )}
            {confirmAction.kind === "publish" && (
              <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.4rem" }}>
                Publicarás <strong style={{ color: "#263a55" }}>{confirmAction.item.nombre}</strong> en el marketplace por <strong style={{ color: "#E90052" }}>{confirmAction.precio.toLocaleString()} pts</strong>.
              </p>
            )}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancelar</button>
              <button onClick={() => {
                if (confirmAction.kind === "buy-product") comprar(confirmAction.producto.id_producto, confirmAction.producto.nombre);
                else if (confirmAction.kind === "buy-listing") comprarMarketplace(confirmAction.listado.id_listado, confirmAction.listado.nombre);
                else publicar();
              }} style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "none", background: "#E90052", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
                {confirmAction.kind === "publish" ? "Publicar" : "Confirmar compra"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: éxito */}
      {successMsg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9003 }}
          onClick={() => setSuccessMsg(null)}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "2rem", width: "360px", maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #E90052, #871d54)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <span style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 900 }}>✓</span>
            </div>
            <h3 style={{ color: "#263a55", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.45rem" }}>¡Operación exitosa!</h3>
            <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.4rem" }}>{successMsg}</p>
            <button onClick={() => setSuccessMsg(null)} style={{ padding: "0.65rem 2.5rem", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #263a55, #1a2a3f)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: detalle de producto */}
      {productModal && (() => {
        const isOwned = ownedIds.has(productModal.id_producto);
        const isRealItem = productModal.categoria === "real";
        const canBuyModal = isRealItem
          ? !isOwned && productModal.stock > 0 && Number(productModal.costo) <= saldo
          : !isOwned && Number(productModal.costo) <= saldo;
        const imgBg = productModal.temporada_nombre ? "#1e1e3a" : isRealItem ? "#f5f6f8" : "#eef0f2";
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, padding: "1rem" }}
            onClick={() => setProductModal(null)}>
            <div style={{ background: "#fff", borderRadius: "16px", width: "480px", maxWidth: "100%", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}
              onClick={(e) => e.stopPropagation()}>
              {/* Image */}
              <div style={{ height: "240px", background: productModal.imagen ? `${imgBg} url(${productModal.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {!productModal.imagen && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{tipoLabel(productModal.tipo)}</span>}
                {/* Badges top-left */}
                <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {productModal.es_nuevo && <span style={{ background: "#E90052", color: "#fff", fontSize: "0.65rem", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 700 }}>NUEVO</span>}
                  {isOwned && <span style={{ background: "#16a34a", color: "#fff", fontSize: "0.65rem", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 700 }}>EN TU PERFIL</span>}
                </div>
                <button onClick={() => setProductModal(null)} style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              {/* Info */}
              <div style={{ padding: "1.25rem 1.5rem" }}>
                <h3 style={{ color: "#263a55", fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.3rem" }}>{productModal.nombre}</h3>
                {/* Meta pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.85rem" }}>
                  <span style={{ background: "#f0f2f5", color: "#263a55", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "99px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{tipoLabel(productModal.tipo)}</span>
                  {productModal.equipo && <span style={{ background: "#f0f2f5", color: "#263a55", fontSize: "0.68rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "99px" }}>{productModal.equipo}</span>}
                  {productModal.temporada_nombre && <span style={{ background: "rgba(135,29,84,0.1)", color: "#871d54", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "99px" }}>Temporada: {productModal.temporada_nombre}</span>}
                  {productModal.categoria === "evento" && <span style={{ background: "rgba(233,0,82,0.1)", color: "#E90052", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "99px" }}>DROP EXCLUSIVO</span>}
                </div>
                {/* Stock info */}
                <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "0.6rem 0.85rem", marginBottom: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "#84878F", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.1rem" }}>Stock</p>
                    {isRealItem
                      ? <p style={{ fontSize: "0.82rem", color: productModal.stock === 0 ? "#dc2626" : "#263a55", fontWeight: 600 }}>{productModal.stock === 0 ? "Sin stock" : `${productModal.stock} disponibles`}</p>
                      : <p style={{ fontSize: "0.82rem", color: "#871d54", fontWeight: 700 }}>Objeto único por usuario</p>
                    }
                  </div>
                  {isOwned && (
                    <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "6px" }}>Ya lo tienes</div>
                  )}
                </div>
                {/* Price + buy */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: "0.9rem" }}>
                  <div>
                    <p style={{ fontSize: "0.68rem", color: "#84878F", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.05rem" }}>Precio</p>
                    <span style={{ fontSize: "1.45rem", fontWeight: 900, color: "#263a55" }}>{Number(productModal.costo).toLocaleString()}</span>
                    <span style={{ fontSize: "0.82rem", color: "#84878F", marginLeft: "0.25rem" }}>pts</span>
                  </div>
                  <button
                    disabled={!canBuyModal}
                    onClick={() => { if (canBuyModal) { setProductModal(null); setConfirmAction({ kind: "buy-product", producto: productModal }); } }}
                    style={{ padding: "0.65rem 1.75rem", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem", cursor: canBuyModal ? "pointer" : "not-allowed", background: canBuyModal ? "#E90052" : "#e0e0e0", color: canBuyModal ? "#fff" : "#999" }}>
                    {isOwned ? "Ya tienes este" : isRealItem && productModal.stock === 0 ? "Sin stock" : Number(productModal.costo) > saldo ? "Saldo insuficiente" : "Comprar ahora"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>,
    document.body
  );

  return (
    <>
      {modals}
      <div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ color: "#263a55", fontSize: "1.25rem", marginBottom: "0.2rem" }}>Tienda</h2>
          <p style={{ color: "#84878F", fontSize: "0.8rem" }}>Compra con tus puntos</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <button
            onClick={reclamarBonus}
            style={{
              padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #E90052",
              background: "transparent", color: "#E90052", fontSize: "0.8rem", fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#E90052"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#E90052"; }}
          >
            + 500 pts bonus
          </button>
          <div style={{ background: "linear-gradient(135deg, #263a55, #1a2a3f)", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700 }}>
            {saldo.toLocaleString()} pts
          </div>
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

      {/* Buscador + filtros (real y explorar marketplace; perfil tiene su propio buscador) */}
      {subTab !== "perfil" && (subTab !== "marketplace" || marketView === "explorar") && (
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
          {/* Search + filters */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
              <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#84878F", fontSize: "0.85rem", pointerEvents: "none" }}>&#x2315;</span>
              <input
                type="text"
                placeholder="Buscar en toda la tienda..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ width: "100%", padding: "0.7rem 0.9rem 0.7rem 2.4rem", borderRadius: "10px", border: "1.5px solid #e0e0e0", fontSize: "0.88rem", background: "#fff", boxSizing: "border-box", outline: "none", color: "#263a55" }}
              />
            </div>
            {perfilTipos.length > 1 && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {perfilTipos.map(tipo => (
                  <button key={tipo} onClick={() => setFiltroPerfilTipo(tipo)}
                    style={{
                      padding: "0.4rem 0.85rem", borderRadius: "20px", border: "1px solid",
                      borderColor: filtroPerfilTipo === tipo ? "#263a55" : "#e0e0e0",
                      background: filtroPerfilTipo === tipo ? "#263a55" : "#fff",
                      color: filtroPerfilTipo === tipo ? "#fff" : "#84878F",
                      fontSize: "0.78rem", fontWeight: filtroPerfilTipo === tipo ? 700 : 400,
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}>
                    {tipo === "todos" ? "Todos" : tipoLabel(tipo)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && <p style={{ color: "#84878F" }}>Cargando...</p>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {perfilFiltrados.map(p => {
              const owned = ownedIds.has(p.id_producto);
              const canBuy = !owned && Number(p.costo) <= saldo;
              return (
                <div
                  key={p.id_producto}
                  onClick={() => setProductModal(p)}
                  style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"; }}
                >
                  <div style={{ height: "160px", position: "relative", background: p.imagen ? `#eef0f2 url(${p.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {!p.imagen && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{tipoLabel(p.tipo)}</span>}
                    {owned
                      ? <span style={{ position: "absolute", top: "10px", left: "10px", background: "#16a34a", color: "#fff", fontSize: "0.6rem", padding: "0.18rem 0.5rem", borderRadius: "4px", fontWeight: 800 }}>EN TU PERFIL</span>
                      : p.es_nuevo && <span style={{ position: "absolute", top: "10px", left: "10px", background: "#E90052", color: "#fff", fontSize: "0.6rem", padding: "0.18rem 0.5rem", borderRadius: "4px", fontWeight: 800 }}>NUEVO</span>
                    }
                  </div>
                  <div style={{ padding: "0.9rem 1rem" }}>
                    <p style={{ fontSize: "0.7rem", color: "#84878F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{tipoLabel(p.tipo)}{p.equipo ? ` · ${p.equipo}` : ""}</p>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#263a55", marginBottom: "0.65rem", lineHeight: 1.3 }}>{p.nombre}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "1rem", fontWeight: 900, color: "#263a55" }}>{Number(p.costo).toLocaleString()}</span>
                        <span style={{ fontSize: "0.72rem", color: "#84878F", marginLeft: "0.25rem" }}>pts</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); if (canBuy) setConfirmAction({ kind: "buy-product", producto: p }); }}
                        disabled={!canBuy}
                        style={{ padding: "0.38rem 0.85rem", background: canBuy ? "#E90052" : "#e9ecef", color: canBuy ? "#fff" : "#aaa", border: "none", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: canBuy ? "pointer" : "not-allowed" }}
                      >
                        {owned ? "Ya tienes este" : "Comprar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && perfilFiltrados.length === 0 && (
            <p style={{ color: "#84878F", textAlign: "center", marginTop: "3rem", fontSize: "0.9rem" }}>No se encontraron productos</p>
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
                        background: item.imagen ? `#f5f6f8 url(${item.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55 0%, #871d54 100%)",
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
                        <button onClick={() => setPublishingItem({ item, precio: "" })}
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
    </>
  );
}
