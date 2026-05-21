import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL;

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface Variante {
  id_variante: number;
  id_producto: number;
  talla: string;
  stock: number;
}

interface Product {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  costo: number;
  stock: number;
  imagen: string | null;
  es_nuevo: boolean;
  categoria: "perfil" | "real";
  tipo: string | null;
  equipo: string | null;
  rareza: string | null;
  id_temporada: number | null;
  css: string | null;
  es_de_liga: boolean;
}

interface Listado {
  id_listado:        number;
  id_vendedor:       number;
  id_inventario:     number | null;
  precio:            number;
  estado:            "activo" | "vendido" | "cancelado";
  created_at?:       string;
  nombre?:           string | null;
  imagen?:           string | null;
  css?:              string | null;
  tipo?:             string | null;
  rareza?:           string | null;
  categoria?:        string | null;
  equipo?:           string | null;
  vendedor_nickname?: string | null;
}

interface AdminTiendaProps {
  user: { id_usuario: number };
}

type CatalogFilter = "todos" | "instock" | "outstock" | "nuevo" | "perfil" | "real";

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  costo: "",
  stock: "",
  imagen: "",
  es_nuevo: true,
  es_de_liga: false,
  categoria: "perfil" as "perfil" | "real",
  tipo: "",
  equipo: "",
  rareza: "",
  id_temporada: "",
  css: "",
};

const TIPOS = [
  "jersey", "balonazo", "ropa", "accesorio",
  "marco", "titulo", "trofeo", "achievement", "foto_perfil", "banner",
];

const TALLAS_DEFAULT = ["S", "M", "L", "XL"];

const RAREZA_COLORS: Record<string, { bg: string; color: string }> = {
  Common:    { bg: "#f1f5f9", color: "#64748b" },
  Rare:      { bg: "#dbeafe", color: "#1d4ed8" },
  Premier:   { bg: "#ede9fe", color: "#7c3aed" },
  Elite:     { bg: "#fef3c7", color: "#b45309" },
  Legendary: { bg: "#fce7f3", color: "#be185d" },
};

const ESTADO_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  activo:    { bg: "#dcfce7", color: "#16a34a", label: "Activo"    },
  vendido:   { bg: "#dbeafe", color: "#1d4ed8", label: "Vendido"   },
  cancelado: { bg: "#fee2e2", color: "#dc2626", label: "Cancelado" },
};

/* ── Shared styles ── */
const inp: React.CSSProperties = {
  width: "100%", padding: "0.55rem 0.75rem",
  border: "1.5px solid #e0e0e0", borderRadius: "8px",
  fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
  color: "#263a55", background: "#fff",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 700,
  color: "#263a55", textTransform: "uppercase",
  letterSpacing: "0.04em", marginBottom: "0.3rem",
};

/* ── Helpers ── */
const badge = (bg: string, color: string, text: string) => (
  <span style={{
    background: bg, color, fontSize: "0.62rem", fontWeight: 700,
    padding: "0.15rem 0.5rem", borderRadius: "99px",
    letterSpacing: "0.03em", textTransform: "capitalize" as const,
    whiteSpace: "nowrap" as const,
  }}>{text}</span>
);

const Thumb = ({ item }: { item: { imagen?: string | null; css?: string | null } }) => (
  <div style={{
    width: "36px", height: "36px", borderRadius: "7px", flexShrink: 0,
    background: item.css
      ? item.css
      : item.imagen
        ? `#f0f2f5 url(${item.imagen}) center/cover no-repeat`
        : "linear-gradient(135deg, #263a55, #871d54)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem",
  }}>
    {!item.imagen && !item.css && "📦"}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AdminTienda({ user }: AdminTiendaProps) {
  const [subTab, setSubTab] = useState<"catalogo" | "marketplace">("catalogo");

  /* ── Toast compartido ── */
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  /* ══════════════════════════════════════════════════════════════
     CATÁLOGO STATE
  ══════════════════════════════════════════════════════════════ */
  const [products, setProducts]   = useState<Product[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<CatalogFilter>("todos");

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [activeTab, setActiveTab]   = useState<"info" | "variantes">("info");

  const [variantes, setVariantes]         = useState<Variante[]>([]);
  const [variantesLoading, setVarLoading] = useState(false);
  const [newTalla, setNewTalla]           = useState("");
  const [newStock, setNewStock]           = useState("0");
  const [savingVariante, setSavingVar]    = useState(false);

  const [confirmId, setConfirmId] = useState<number | null>(null);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/productos`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setProducts(json.data);
      else showToast(json.error || "Error cargando productos", false);
    } catch {
      showToast("Error de conexión", false);
    } finally {
      setLoadingCat(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Fetch variantes ── */
  const fetchVariantes = async (id: number) => {
    setVarLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/productos/${id}/variantes`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setVariantes(json.data);
    } catch { }
    finally { setVarLoading(false); }
  };

  /* ── Modal helpers ── */
  const openAdd = () => {
    setEditingId(null); setForm(EMPTY_FORM); setVariantes([]);
    setFormError(""); setActiveTab("info"); setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id_producto);
    setForm({
      nombre: p.nombre, descripcion: p.descripcion ?? "", costo: String(p.costo),
      stock: String(p.stock), imagen: p.imagen ?? "", es_nuevo: p.es_nuevo,
      es_de_liga: p.es_de_liga, categoria: p.categoria, tipo: p.tipo ?? "",
      equipo: p.equipo ?? "", rareza: p.rareza ?? "",
      id_temporada: p.id_temporada ? String(p.id_temporada) : "", css: p.css ?? "",
    });
    setVariantes([]); setFormError(""); setActiveTab("info"); setModalOpen(true);
    fetchVariantes(p.id_producto);
  };

  const closeModal = () => {
    setModalOpen(false); setEditingId(null); setNewTalla(""); setNewStock("0");
  };

  /* ── Save producto ── */
  const handleSave = async () => {
    if (!form.nombre.trim() || form.costo === "") { setFormError("Nombre y costo son requeridos."); return; }
    setFormError(""); setSaving(true);
    const payload = {
      nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null,
      costo: Number(form.costo), stock: Number(form.stock || 0),
      imagen: form.imagen.trim() || null, es_nuevo: form.es_nuevo, es_de_liga: form.es_de_liga,
      categoria: form.categoria, tipo: form.tipo || null, equipo: form.equipo.trim() || null,
      rareza: form.rareza.trim() || null,
      id_temporada: form.id_temporada ? Number(form.id_temporada) : null,
      css: form.css.trim() || null,
    };
    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `${API_URL}/api/admin/productos/${editingId}` : `${API_URL}/api/admin/productos`;
      const res  = await fetch(url, {
        method: isEdit ? "PUT" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) { setFormError(json.error || "Error al guardar"); return; }
      await fetchProducts();
      showToast(isEdit ? "Producto actualizado" : "Producto creado");
      if (!isEdit && json.data?.id_producto) {
        setEditingId(json.data.id_producto);
        setActiveTab("variantes");
        fetchVariantes(json.data.id_producto);
      } else { closeModal(); }
    } catch { setFormError("Error de conexión"); }
    finally { setSaving(false); }
  };

  /* ── Variantes CRUD ── */
  const handleAddVariante = async () => {
    if (!newTalla.trim() || editingId === null) return;
    setSavingVar(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/productos/${editingId}/variantes`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talla: newTalla.trim().toUpperCase(), stock: Number(newStock || 0) }),
      });
      const json = await res.json();
      if (!json.success) { showToast(json.error || "Error al agregar variante", false); return; }
      setVariantes(v => [...v, json.data]);
      setNewTalla(""); setNewStock("0");
      showToast("Variante agregada");
    } catch { showToast("Error de conexión", false); }
    finally { setSavingVar(false); }
  };

  const handleUpdateVarianteStock = async (id_variante: number, stock: number) => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/variantes/${id_variante}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock }),
      });
      const json = await res.json();
      if (!json.success) { showToast(json.error || "Error", false); return; }
      setVariantes(v => v.map(x => x.id_variante === id_variante ? { ...x, stock } : x));
    } catch { showToast("Error de conexión", false); }
  };

  const handleDeleteVariante = async (id_variante: number) => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/variantes/${id_variante}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!json.success) { showToast(json.error || "Error", false); return; }
      setVariantes(v => v.filter(x => x.id_variante !== id_variante));
      showToast("Variante eliminada");
    } catch { showToast("Error de conexión", false); }
  };

  /* ── Delete producto ── */
  const handleDelete = async () => {
    if (confirmId === null) return;
    try {
      const res  = await fetch(`${API_URL}/api/admin/productos/${confirmId}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!json.success) { showToast(json.error || "Error al eliminar", false); return; }
      await fetchProducts();
      showToast("Producto eliminado");
    } catch { showToast("Error de conexión", false); }
    finally { setConfirmId(null); }
  };

  /* ── Filtered ── */
  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    const matchQ = p.nombre.toLowerCase().includes(q) || (p.descripcion ?? "").toLowerCase().includes(q)
      || (p.tipo ?? "").toLowerCase().includes(q) || (p.equipo ?? "").toLowerCase().includes(q);
    if (filter === "instock")  return matchQ && p.stock > 0;
    if (filter === "outstock") return matchQ && p.stock === 0;
    if (filter === "nuevo")    return matchQ && p.es_nuevo;
    if (filter === "perfil")   return matchQ && p.categoria === "perfil";
    if (filter === "real")     return matchQ && p.categoria === "real";
    return matchQ;
  });

  const confirmProduct = products.find(p => p.id_producto === confirmId);
  const esReal = form.categoria === "real";

  /* ══════════════════════════════════════════════════════════════
     MARKETPLACE STATE
  ══════════════════════════════════════════════════════════════ */
  const [listados, setListados]       = useState<Listado[]>([]);
  const [loadingMkt, setLoadingMkt]   = useState(false);
  const [mktSearch, setMktSearch]     = useState("");
  const [mktFiltro, setMktFiltro]     = useState<"todos" | "activo" | "vendido" | "cancelado">("todos");
  const [productos, setProductos]     = useState<Product[]>([]);

  const [pubModalOpen, setPubModalOpen]   = useState(false);
  const [selectedProd, setSelectedProd]   = useState<Product | null>(null);
  const [pubPrecio, setPubPrecio]         = useState("");
  const [publishing, setPublishing]       = useState(false);
  const [pubError, setPubError]           = useState("");
  const [prodSearch, setProdSearch]       = useState("");

  const [editingListado, setEditingListado] = useState<Listado | null>(null);
  const [editPrecio, setEditPrecio]         = useState("");
  const [savingEdit, setSavingEdit]         = useState(false);
  const [editError, setEditError]           = useState("");

  const [confirmMktId, setConfirmMktId] = useState<number | null>(null);
  const [canceling, setCanceling]       = useState(false);

  const fetchListados = useCallback(async () => {
    setLoadingMkt(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/marketplace/listados`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setListados(json.data || []);
      else showToast(json.error || "Error cargando listados", false);
    } catch { showToast("Error de conexión", false); }
    finally { setLoadingMkt(false); }
  }, []);

  const fetchProductosCatalogo = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/api/tienda/productos-v2?categoria=perfil`, { credentials: "include" }),
        fetch(`${API_URL}/api/tienda/productos-v2?categoria=real`,   { credentials: "include" }),
      ]);
      const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
      setProductos([...(j1.success ? j1.data : []), ...(j2.success ? j2.data : [])]);
    } catch { showToast("Error cargando catálogo", false); }
  }, []);

  /* Solo cargamos marketplace cuando se abre ese subtab */
  useEffect(() => {
    if (subTab === "marketplace") {
      fetchListados();
      fetchProductosCatalogo();
    }
  }, [subTab, fetchListados, fetchProductosCatalogo]);

  const handlePublicar = async () => {
    if (!selectedProd || !pubPrecio || Number(pubPrecio) <= 0) { setPubError("Seleccioná un producto y un precio mayor a 0."); return; }
    setPubError(""); setPublishing(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/marketplace/publicar`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_admin: user.id_usuario, id_producto: selectedProd.id_producto, precio: Number(pubPrecio) }),
      });
      const json = await res.json();
      if (!json.success) { setPubError(json.error || "Error al publicar"); return; }
      setListados(prev => [json.data, ...prev]);
      showToast("Producto publicado en marketplace");
      closePubModal();
    } catch { setPubError("Error de conexión"); }
    finally { setPublishing(false); }
  };

  const handleEditPrecio = async () => {
    if (!editingListado || !editPrecio || Number(editPrecio) <= 0) { setEditError("Precio inválido."); return; }
    setEditError(""); setSavingEdit(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/marketplace/listados/${editingListado.id_listado}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precio: Number(editPrecio) }),
      });
      const json = await res.json();
      if (!json.success) { setEditError(json.error || "Error al guardar"); return; }
      setListados(prev => prev.map(l => l.id_listado === json.data.id_listado ? json.data : l));
      showToast("Precio actualizado");
      setEditingListado(null);
    } catch { setEditError("Error de conexión"); }
    finally { setSavingEdit(false); }
  };

  const handleCancelarListado = async () => {
    if (confirmMktId === null) return;
    setCanceling(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/marketplace/cancelar/${confirmMktId}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!json.success) { showToast(json.error || "Error al cancelar", false); return; }
      setListados(prev => prev.map(l => l.id_listado === confirmMktId ? { ...l, estado: "cancelado" as const } : l));
      showToast("Listado cancelado");
    } catch { showToast("Error de conexión", false); }
    finally { setCanceling(false); setConfirmMktId(null); }
  };

  const closePubModal = () => {
    setPubModalOpen(false); setSelectedProd(null);
    setPubPrecio(""); setPubError(""); setProdSearch("");
  };

  const filteredListados = listados.filter(l => {
    const q = mktSearch.toLowerCase();
    const matchQ = (l.nombre || "").toLowerCase().includes(q)
      || (l.vendedor_nickname || "").toLowerCase().includes(q)
      || String(l.id_listado).includes(q);
    return mktFiltro === "todos" ? matchQ : matchQ && l.estado === mktFiltro;
  });

  const filteredProds = productos.filter(p =>
    p.nombre.toLowerCase().includes(prodSearch.toLowerCase())
    || (p.tipo || "").toLowerCase().includes(prodSearch.toLowerCase())
    || (p.equipo || "").toLowerCase().includes(prodSearch.toLowerCase())
  );

  const mktStats = {
    total:     listados.length,
    activos:   listados.filter(l => l.estado === "activo").length,
    vendidos:  listados.filter(l => l.estado === "vendido").length,
    cancelados:listados.filter(l => l.estado === "cancelado").length,
    volumen:   listados.filter(l => l.estado === "vendido").reduce((s, l) => s + l.precio, 0),
  };

  const confirmMktListado = listados.find(l => l.id_listado === confirmMktId);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "80px", right: "2rem", zIndex: 9999,
          padding: "0.75rem 1.25rem", borderRadius: "10px",
          background: toast.ok ? "#16a34a" : "#dc2626",
          color: "#fff", fontSize: "0.85rem", fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* ── Subtabs ── */}
      <div style={{ display: "flex", gap: "4px", padding: "0 1.5rem", borderBottom: "2px solid #f0f0f0", background: "#fff" }}>
        {(["catalogo", "marketplace"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{
            padding: "0.65rem 1.1rem", border: "none",
            borderBottom: subTab === t ? "2px solid #E90052" : "2px solid transparent",
            background: "transparent",
            color: subTab === t ? "#E90052" : "#84878F",
            fontSize: "0.82rem", fontWeight: subTab === t ? 700 : 400,
            cursor: "pointer", marginBottom: "-2px", transition: "color 0.15s",
          }}>
            {t === "catalogo" ? "Catálogo" : "Marketplace"}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: CATÁLOGO
      ════════════════════════════════════════════════════════ */}
      {subTab === "catalogo" && (
        <div style={{ padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
            <div>
              <h2 style={{ color: "#263a55", fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.15rem" }}>Productos</h2>
              <p style={{ color: "#84878F", fontSize: "0.8rem" }}>{products.length} productos · Gestiona el catálogo de la tienda</p>
            </div>
            <button onClick={openAdd} style={{ padding: "0.55rem 1.2rem", border: "none", borderRadius: "8px", background: "#E90052", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
              + Agregar producto
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "1.5rem" }}>
            {[
              { label: "Total",     value: products.length,                             color: "#263a55" },
              { label: "En stock",  value: products.filter(p => p.stock > 0).length,   color: "#16a34a" },
              { label: "Sin stock", value: products.filter(p => p.stock === 0).length, color: "#dc2626" },
              { label: "Nuevos",    value: products.filter(p => p.es_nuevo).length,    color: "#f59e0b" },
              { label: "Reales",    value: products.filter(p => p.categoria === "real").length, color: "#1d4ed8" },
            ].map(s => (
              <div key={s.label} style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.9rem 1rem", borderTop: `3px solid ${s.color}` }}>
                <p style={{ fontSize: "0.68rem", color: "#84878F", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{s.label}</p>
                <p style={{ fontSize: "1.6rem", fontWeight: 900, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search + Filters */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "1.1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#84878F", pointerEvents: "none", fontSize: "1.1rem" }}>⌕</span>
              <input type="text" placeholder="Buscar por nombre, tipo, equipo..." value={search}
                onChange={e => setSearch(e.target.value)} style={{ ...inp, paddingLeft: "2.2rem" }} />
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {([["todos","Todos"],["instock","En stock"],["outstock","Sin stock"],["nuevo","Nuevos"],["perfil","Perfil"],["real","Real"]] as [CatalogFilter,string][]).map(([f, label]) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "0.45rem 1rem", borderRadius: "20px", border: "1px solid",
                  borderColor: filter === f ? "#263a55" : "#e0e0e0",
                  background: filter === f ? "#263a55" : "#fff",
                  color: filter === f ? "#fff" : "#84878F",
                  fontSize: "0.78rem", fontWeight: filter === f ? 700 : 400, cursor: "pointer",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loadingCat ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#84878F" }}>Cargando productos...</div>
          ) : (
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid #f0f0f0", background: "#fafafa" }}>
                    {["Producto","Categoría / Tipo","Rareza","Costo","Stock","Estado",""].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.67rem", fontWeight: 700, color: "#84878F", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#84878F", fontSize: "0.88rem" }}>No se encontraron productos.</td></tr>
                  ) : filteredProducts.map(p => {
                    const rarezaStyle = p.rareza ? (RAREZA_COLORS[p.rareza] || { bg: "#f0f0f0", color: "#555" }) : null;
                    return (
                      <tr key={p.id_producto} style={{ borderBottom: "1px solid #f5f5f5" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width:"40px",height:"40px",borderRadius:"8px",flexShrink:0,background:p.css?p.css:p.imagen?`#f0f2f5 url(${p.imagen}) center/cover no-repeat`:"linear-gradient(135deg,#263a55,#871d54)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem" }}>
                              {!p.imagen && !p.css && "📦"}
                            </div>
                            <div>
                              <p style={{ fontWeight:700,color:"#263a55",marginBottom:"2px",fontSize:"0.83rem" }}>
                                {p.nombre}
                                {p.es_nuevo && <span style={{ marginLeft:"5px",background:"#fef3c7",color:"#b45309",fontSize:"0.6rem",fontWeight:700,padding:"0.1rem 0.4rem",borderRadius:"4px" }}>NUEVO</span>}
                              </p>
                              <p style={{ fontSize:"0.7rem",color:"#84878F",maxWidth:"200px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.equipo||p.descripcion||"—"}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ display:"flex",flexDirection:"column",gap:"4px" }}>
                            {badge(p.categoria==="real"?"#dbeafe":"#f3e8ff",p.categoria==="real"?"#1e40af":"#7e22ce",p.categoria)}
                            {p.tipo && <span style={{ fontSize:"0.7rem",color:"#84878F" }}>{p.tipo}</span>}
                          </div>
                        </td>
                        <td style={{ padding:"11px 14px" }}>{rarezaStyle?badge(rarezaStyle.bg,rarezaStyle.color,p.rareza!):<span style={{ color:"#c0c0c0",fontSize:"0.78rem" }}>—</span>}</td>
                        <td style={{ padding:"11px 14px",fontWeight:700,color:"#263a55",whiteSpace:"nowrap" }}>{Number(p.costo).toLocaleString()}<span style={{ fontSize:"0.7rem",color:"#84878F",fontWeight:400 }}> pts</span></td>
                        <td style={{ padding:"11px 14px",color:"#263a55" }}><span style={{ fontWeight:600 }}>{p.stock}</span></td>
                        <td style={{ padding:"11px 14px" }}>{p.stock===0?badge("#fee2e2","#dc2626","Sin stock"):badge("#dcfce7","#16a34a","En stock")}</td>
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ display:"flex",gap:"5px" }}>
                            <button onClick={()=>openEdit(p)} title="Editar" style={{ width:"30px",height:"30px",borderRadius:"7px",border:"1px solid #e0e0e0",background:"#fff",cursor:"pointer",fontSize:"0.8rem",display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>
                            <button onClick={()=>setConfirmId(p.id_producto)} title="Eliminar" style={{ width:"30px",height:"30px",borderRadius:"7px",border:"1px solid #fca5a5",background:"#fff",cursor:"pointer",fontSize:"0.8rem",display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── MODAL: Agregar/Editar producto ── */}
          {modalOpen && (
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,padding:"1rem" }} onClick={closeModal}>
              <div style={{ background:"#fff",borderRadius:"14px",width:"560px",maxWidth:"100%",maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }} onClick={e=>e.stopPropagation()}>
                <div style={{ padding:"1.4rem 1.75rem 0",borderBottom:"1px solid #f0f0f0" }}>
                  <h3 style={{ color:"#263a55",fontSize:"1.05rem",fontWeight:800,marginBottom:"1rem" }}>{editingId!==null?"Editar producto":"Agregar producto"}</h3>
                  <div style={{ display:"flex",gap:"0" }}>
                    {(["info",...(editingId!==null?["variantes"]:[])] as ("info"|"variantes")[]).map(tab=>(
                      <button key={tab} onClick={()=>setActiveTab(tab)} style={{ padding:"0.5rem 1.1rem",border:"none",borderBottom:`2px solid ${activeTab===tab?"#E90052":"transparent"}`,background:"transparent",color:activeTab===tab?"#E90052":"#84878F",fontSize:"0.8rem",fontWeight:activeTab===tab?700:400,cursor:"pointer",textTransform:"capitalize" }}>
                        {tab==="info"?"Información":`Variantes / Tallas ${variantes.length>0?`(${variantes.length})`:""}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ overflowY:"auto",padding:"1.25rem 1.75rem",flex:1 }}>
                  {activeTab==="info" && (
                    <>
                      <div style={{ marginBottom:"0.8rem" }}><label style={lbl}>Nombre *</label><input type="text" style={inp} placeholder="Ej: Jersey Arsenal Home 24/25" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} /></div>
                      <div style={{ marginBottom:"0.8rem" }}><label style={lbl}>Descripción</label><textarea style={{ ...inp,resize:"vertical",minHeight:"60px",fontFamily:"inherit" }} placeholder="Descripción del producto..." value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} /></div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"0.8rem" }}>
                        <div><label style={lbl}>Costo (pts) *</label><input type="number" style={inp} placeholder="500" min={0} value={form.costo} onChange={e=>setForm(f=>({...f,costo:e.target.value}))} /></div>
                        <div>
                          <label style={lbl}>Stock base</label>
                          <input type="number" style={inp} placeholder="50" min={0} value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} />
                          {esReal && <p style={{ fontSize:"0.65rem",color:"#f59e0b",marginTop:"3px" }}>⚠ Productos reales usan stock por variante</p>}
                        </div>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"0.8rem" }}>
                        <div><label style={lbl}>Categoría</label><select style={inp} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value as "perfil"|"real"}))}><option value="perfil">Perfil</option><option value="real">Real</option></select></div>
                        <div><label style={lbl}>Tipo</label><select style={inp} value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}><option value="">— Sin tipo —</option>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                      </div>
                      <div style={{ marginBottom:"0.8rem" }}>
                        <label style={lbl}>URL de imagen</label>
                        <input type="text" style={inp} placeholder="https://..." value={form.imagen} onChange={e=>setForm(f=>({...f,imagen:e.target.value}))} />
                        {form.imagen && <img src={form.imagen} alt="preview" onError={e=>(e.currentTarget.style.display="none")} style={{ marginTop:"6px",height:"48px",borderRadius:"6px",objectFit:"contain",border:"1px solid #f0f0f0" }} />}
                      </div>
                      <div style={{ marginBottom:"0.8rem" }}>
                        <label style={lbl}>CSS (gradiente para marcos/banners)</label>
                        <input type="text" style={inp} placeholder="linear-gradient(135deg, #E90052, #871d54)" value={form.css} onChange={e=>setForm(f=>({...f,css:e.target.value}))} />
                        {form.css && <div style={{ marginTop:"6px",height:"28px",borderRadius:"6px",background:form.css,border:"1px solid #f0f0f0" }} />}
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"0.8rem" }}>
                        <div><label style={lbl}>Equipo</label><input type="text" style={inp} placeholder="Arsenal FC" value={form.equipo} onChange={e=>setForm(f=>({...f,equipo:e.target.value}))} /></div>
                        <div><label style={lbl}>Rareza</label><select style={inp} value={form.rareza} onChange={e=>setForm(f=>({...f,rareza:e.target.value}))}><option value="">— Sin rareza —</option>{Object.keys(RAREZA_COLORS).map(r=><option key={r} value={r}>{r}</option>)}</select></div>
                      </div>
                      <div style={{ marginBottom:"0.8rem" }}><label style={lbl}>ID Temporada</label><input type="number" style={inp} placeholder="1" value={form.id_temporada} onChange={e=>setForm(f=>({...f,id_temporada:e.target.value}))} /></div>
                      <div style={{ display:"flex",gap:"1.5rem",marginBottom:"1rem" }}>
                        <label style={{ display:"flex",alignItems:"center",gap:"7px",fontSize:"0.83rem",color:"#263a55",cursor:"pointer" }}>
                          <input type="checkbox" checked={form.es_nuevo} onChange={e=>setForm(f=>({...f,es_nuevo:e.target.checked}))} style={{ accentColor:"#E90052",width:"15px",height:"15px" }} />Marcar como nuevo
                        </label>
                        <label style={{ display:"flex",alignItems:"center",gap:"7px",fontSize:"0.83rem",color:"#263a55",cursor:"pointer" }}>
                          <input type="checkbox" checked={form.es_de_liga} onChange={e=>setForm(f=>({...f,es_de_liga:e.target.checked}))} style={{ accentColor:"#263a55",width:"15px",height:"15px" }} />Es de liga
                        </label>
                      </div>
                      {formError && <p style={{ fontSize:"0.78rem",color:"#dc2626",marginBottom:"0.8rem" }}>{formError}</p>}
                    </>
                  )}

                  {activeTab==="variantes" && (
                    <>
                      <p style={{ fontSize:"0.78rem",color:"#84878F",marginBottom:"1rem",lineHeight:1.5 }}>Gestiona el stock por talla. Productos como jerseys y ropa tienen variantes S/M/L/XL con stock individual.</p>
                      {variantesLoading ? <p style={{ color:"#84878F",fontSize:"0.85rem" }}>Cargando variantes...</p> : (
                        <>
                          {variantes.length===0 ? (
                            <div style={{ textAlign:"center",padding:"1.5rem",background:"#fafafa",borderRadius:"10px",marginBottom:"1rem" }}>
                              <p style={{ color:"#84878F",fontSize:"0.83rem" }}>Sin variantes todavía.</p>
                              <p style={{ color:"#b0b0b0",fontSize:"0.75rem" }}>Agrega tallas abajo 👇</p>
                            </div>
                          ) : (
                            <div style={{ marginBottom:"1.25rem",display:"flex",flexDirection:"column",gap:"6px" }}>
                              {variantes.map(v=>(
                                <div key={v.id_variante} style={{ display:"flex",alignItems:"center",gap:"10px",padding:"0.6rem 0.9rem",background:"#f8f9fa",borderRadius:"9px",border:"1px solid #f0f0f0" }}>
                                  <span style={{ fontWeight:800,color:"#263a55",fontSize:"0.88rem",minWidth:"30px" }}>{v.talla}</span>
                                  <span style={{ color:"#84878F",fontSize:"0.75rem" }}>Stock:</span>
                                  <input type="number" min={0} defaultValue={v.stock}
                                    onBlur={e=>{ const n=Number(e.target.value); if(n!==v.stock) handleUpdateVarianteStock(v.id_variante,n); }}
                                    style={{ ...inp,width:"80px",padding:"0.35rem 0.55rem",fontSize:"0.83rem" }} />
                                  <span style={{ marginLeft:"auto",background:v.stock>0?"#dcfce7":"#fee2e2",color:v.stock>0?"#16a34a":"#dc2626",fontSize:"0.65rem",fontWeight:700,padding:"0.15rem 0.5rem",borderRadius:"99px" }}>{v.stock>0?"En stock":"Sin stock"}</span>
                                  <button onClick={()=>handleDeleteVariante(v.id_variante)} style={{ width:"26px",height:"26px",borderRadius:"6px",border:"1px solid #fca5a5",background:"#fff",cursor:"pointer",fontSize:"0.75rem",display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ background:"#f8f9fa",borderRadius:"10px",padding:"1rem",border:"1px dashed #e0e0e0" }}>
                            <p style={{ fontSize:"0.72rem",fontWeight:700,color:"#263a55",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:"0.75rem" }}>Agregar talla</p>
                            <div style={{ display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"0.6rem" }}>
                              {TALLAS_DEFAULT.filter(t=>!variantes.find(v=>v.talla===t)).map(t=>(
                                <button key={t} onClick={()=>setNewTalla(t)} style={{ padding:"0.35rem 0.8rem",borderRadius:"7px",border:"1px solid",borderColor:newTalla===t?"#263a55":"#e0e0e0",background:newTalla===t?"#263a55":"#fff",color:newTalla===t?"#fff":"#84878F",fontSize:"0.8rem",fontWeight:600,cursor:"pointer" }}>{t}</button>
                              ))}
                            </div>
                            <div style={{ display:"flex",gap:"8px",alignItems:"center" }}>
                              <div style={{ flex:1 }}><input type="text" style={inp} placeholder="Talla (ej: XXL)" value={newTalla} onChange={e=>setNewTalla(e.target.value.toUpperCase())} /></div>
                              <div style={{ width:"90px" }}><input type="number" style={inp} placeholder="Stock" min={0} value={newStock} onChange={e=>setNewStock(e.target.value)} /></div>
                              <button onClick={handleAddVariante} disabled={savingVariante||!newTalla.trim()} style={{ padding:"0.55rem 1rem",borderRadius:"8px",border:"none",background:savingVariante||!newTalla.trim()?"#e0e0e0":"#E90052",color:savingVariante||!newTalla.trim()?"#999":"#fff",fontSize:"0.83rem",fontWeight:700,cursor:savingVariante||!newTalla.trim()?"not-allowed":"pointer",whiteSpace:"nowrap" }}>
                                {savingVariante?"...":"+ Agregar"}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div style={{ padding:"1rem 1.75rem",borderTop:"1px solid #f0f0f0",display:"flex",gap:"8px",justifyContent:"flex-end" }}>
                  <button onClick={closeModal} style={{ padding:"0.6rem 1.1rem",borderRadius:"8px",border:"1px solid #e0e0e0",background:"#fff",color:"#84878F",fontSize:"0.85rem",fontWeight:600,cursor:"pointer" }}>
                    {activeTab==="variantes"?"Cerrar":"Cancelar"}
                  </button>
                  {activeTab==="info" && (
                    <button onClick={handleSave} disabled={saving} style={{ padding:"0.6rem 1.3rem",borderRadius:"8px",border:"none",background:saving?"#e0e0e0":"#E90052",color:saving?"#999":"#fff",fontSize:"0.85rem",fontWeight:700,cursor:saving?"not-allowed":"pointer" }}>
                      {saving?"Guardando...":editingId!==null?"Guardar cambios":"Guardar producto"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL: Confirmar eliminar producto ── */}
          {confirmId!==null && (
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9001 }} onClick={()=>setConfirmId(null)}>
              <div style={{ background:"#fff",borderRadius:"14px",padding:"1.75rem",width:"360px",maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }} onClick={e=>e.stopPropagation()}>
                <h3 style={{ color:"#263a55",fontSize:"1rem",fontWeight:800,marginBottom:"0.4rem" }}>Eliminar producto</h3>
                <p style={{ color:"#84878F",fontSize:"0.85rem",lineHeight:1.6,marginBottom:"1.4rem" }}>
                  ¿Seguro que querés eliminar <strong style={{ color:"#263a55" }}>{confirmProduct?.nombre}</strong>? Esta acción no se puede deshacer.
                </p>
                <div style={{ display:"flex",gap:"8px",justifyContent:"flex-end" }}>
                  <button onClick={()=>setConfirmId(null)} style={{ padding:"0.6rem 1.1rem",borderRadius:"8px",border:"1px solid #e0e0e0",background:"#fff",color:"#84878F",fontSize:"0.85rem",fontWeight:600,cursor:"pointer" }}>Cancelar</button>
                  <button onClick={handleDelete} style={{ padding:"0.6rem 1.1rem",borderRadius:"8px",border:"none",background:"#dc2626",color:"#fff",fontSize:"0.85rem",fontWeight:700,cursor:"pointer" }}>Eliminar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: MARKETPLACE
      ════════════════════════════════════════════════════════ */}
      {subTab === "marketplace" && (
        <div style={{ padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.75rem" }}>
            <div>
              <h2 style={{ color:"#263a55",fontSize:"1.35rem",fontWeight:800,marginBottom:"0.15rem" }}>Marketplace</h2>
              <p style={{ color:"#84878F",fontSize:"0.8rem" }}>{listados.length} listados totales · Gestiona las publicaciones</p>
            </div>
            <button onClick={()=>setPubModalOpen(true)} style={{ padding:"0.55rem 1.2rem",border:"none",borderRadius:"8px",background:"#E90052",color:"#fff",fontSize:"0.85rem",fontWeight:700,cursor:"pointer" }}>
              + Publicar producto
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:"12px",marginBottom:"1.5rem" }}>
            {[
              { label:"Total",       value:mktStats.total,                    color:"#263a55" },
              { label:"Activos",     value:mktStats.activos,                  color:"#16a34a" },
              { label:"Vendidos",    value:mktStats.vendidos,                 color:"#1d4ed8" },
              { label:"Cancelados",  value:mktStats.cancelados,               color:"#dc2626" },
              { label:"Volumen pts", value:mktStats.volumen.toLocaleString(), color:"#b45309" },
            ].map(s=>(
              <div key={s.label} style={{ background:"#f8f9fa",borderRadius:"10px",padding:"0.9rem 1rem",borderTop:`3px solid ${s.color}` }}>
                <p style={{ fontSize:"0.68rem",color:"#84878F",marginBottom:"0.3rem",textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600 }}>{s.label}</p>
                <p style={{ fontSize:"1.4rem",fontWeight:900,color:s.color,lineHeight:1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search + Filtros */}
          <div style={{ display:"flex",gap:"10px",marginBottom:"1.1rem",flexWrap:"wrap",alignItems:"center" }}>
            <div style={{ position:"relative",flex:1,minWidth:"200px" }}>
              <span style={{ position:"absolute",left:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"#84878F",pointerEvents:"none",fontSize:"1.1rem" }}>⌕</span>
              <input type="text" placeholder="Buscar por nombre, vendedor o ID..." value={mktSearch} onChange={e=>setMktSearch(e.target.value)} style={{ ...inp,paddingLeft:"2.2rem" }} />
            </div>
            <div style={{ display:"flex",gap:"6px" }}>
              {(["todos","activo","vendido","cancelado"] as const).map(f=>(
                <button key={f} onClick={()=>setMktFiltro(f)} style={{ padding:"0.45rem 1rem",borderRadius:"20px",border:"1px solid",borderColor:mktFiltro===f?"#263a55":"#e0e0e0",background:mktFiltro===f?"#263a55":"#fff",color:mktFiltro===f?"#fff":"#84878F",fontSize:"0.78rem",fontWeight:mktFiltro===f?700:400,cursor:"pointer" }}>
                  {f==="todos"?"Todos":ESTADO_STYLE[f].label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loadingMkt ? (
            <div style={{ padding:"3rem",textAlign:"center",color:"#84878F" }}>Cargando marketplace...</div>
          ) : (
            <div style={{ background:"#fff",borderRadius:"12px",border:"1px solid #f0f0f0",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom:"1.5px solid #f0f0f0",background:"#fafafa" }}>
                    {["#","Producto","Vendedor","Rareza","Precio","Estado","Fecha",""].map(h=>(
                      <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:"0.67rem",fontWeight:700,color:"#84878F",textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredListados.length===0 ? (
                    <tr><td colSpan={8} style={{ padding:"3rem",textAlign:"center",color:"#84878F",fontSize:"0.88rem" }}>No se encontraron listados.</td></tr>
                  ) : filteredListados.map(l=>{
                    const rarezaStyle = l.rareza?(RAREZA_COLORS[l.rareza]||{bg:"#f0f0f0",color:"#555"}):null;
                    const estadoStyle = ESTADO_STYLE[l.estado]||ESTADO_STYLE.cancelado;
                    return (
                      <tr key={l.id_listado} style={{ borderBottom:"1px solid #f5f5f5" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="#fafafa")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <td style={{ padding:"11px 14px",color:"#84878F",fontSize:"0.75rem",fontWeight:600 }}>#{l.id_listado}</td>
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
                            <Thumb item={l} />
                            <div>
                              <p style={{ fontWeight:700,color:"#263a55",fontSize:"0.83rem",marginBottom:"2px" }}>{l.nombre||`Inventario #${l.id_inventario}`}</p>
                              <p style={{ fontSize:"0.7rem",color:"#84878F" }}>{l.tipo||"—"}{l.equipo?` · ${l.equipo}`:""}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"11px 14px",fontSize:"0.82rem" }}>{l.vendedor_nickname?<span style={{ fontWeight:600,color:"#263a55" }}>@{l.vendedor_nickname}</span>:<span style={{ color:"#c0c0c0" }}>—</span>}</td>
                        <td style={{ padding:"11px 14px" }}>{rarezaStyle?badge(rarezaStyle.bg,rarezaStyle.color,l.rareza!):<span style={{ color:"#c0c0c0",fontSize:"0.78rem" }}>—</span>}</td>
                        <td style={{ padding:"11px 14px",fontWeight:700,color:"#263a55",whiteSpace:"nowrap" }}>{l.precio.toLocaleString()}<span style={{ fontSize:"0.7rem",color:"#84878F",fontWeight:400 }}> pts</span></td>
                        <td style={{ padding:"11px 14px" }}>{badge(estadoStyle.bg,estadoStyle.color,estadoStyle.label)}</td>
                        <td style={{ padding:"11px 14px",color:"#84878F",fontSize:"0.75rem",whiteSpace:"nowrap" }}>{l.created_at?new Date(l.created_at).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}):"—"}</td>
                        <td style={{ padding:"11px 14px" }}>
                          {l.estado==="activo" && (
                            <div style={{ display:"flex",gap:"5px" }}>
                              <button onClick={()=>{setEditingListado(l);setEditPrecio(String(l.precio));setEditError("");}} title="Editar precio" style={{ width:"30px",height:"30px",borderRadius:"7px",border:"1px solid #e0e0e0",background:"#fff",cursor:"pointer",fontSize:"0.8rem",display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>
                              <button onClick={()=>setConfirmMktId(l.id_listado)} title="Cancelar listado" style={{ width:"30px",height:"30px",borderRadius:"7px",border:"1px solid #fca5a5",background:"#fff",cursor:"pointer",fontSize:"0.8rem",display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── MODAL: Publicar producto ── */}
          {pubModalOpen && (
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,padding:"1rem" }} onClick={closePubModal}>
              <div style={{ background:"#fff",borderRadius:"14px",width:"540px",maxWidth:"100%",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }} onClick={e=>e.stopPropagation()}>
                <div style={{ padding:"1.4rem 1.75rem",borderBottom:"1px solid #f0f0f0" }}>
                  <h3 style={{ color:"#263a55",fontSize:"1.05rem",fontWeight:800 }}>Publicar en Marketplace</h3>
                  <p style={{ color:"#84878F",fontSize:"0.78rem",marginTop:"0.25rem" }}>El producto se agrega al inventario del admin y se publica.</p>
                </div>
                <div style={{ overflowY:"auto",padding:"1.25rem 1.75rem",flex:1,display:"flex",flexDirection:"column",gap:"1rem" }}>
                  <div>
                    <label style={lbl}>Buscar producto</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute",left:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"#84878F",pointerEvents:"none" }}>⌕</span>
                      <input type="text" placeholder="Nombre, tipo, equipo..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)} style={{ ...inp,paddingLeft:"2.1rem" }} />
                    </div>
                  </div>
                  <div style={{ border:"1.5px solid #e0e0e0",borderRadius:"10px",overflow:"hidden",maxHeight:"260px",overflowY:"auto" }}>
                    {filteredProds.length===0?(
                      <div style={{ padding:"2rem",textAlign:"center",color:"#84878F",fontSize:"0.83rem" }}>No se encontraron productos.</div>
                    ):filteredProds.map((p,i)=>{
                      const isSel=selectedProd?.id_producto===p.id_producto;
                      return (
                        <div key={p.id_producto} onClick={()=>{setSelectedProd(p);if(!pubPrecio)setPubPrecio(String(Math.round(p.costo*0.8)));}}
                          style={{ display:"flex",alignItems:"center",gap:"10px",padding:"0.65rem 0.9rem",borderBottom:i<filteredProds.length-1?"1px solid #f5f5f5":"none",background:isSel?"#fff5f8":"#fff",cursor:"pointer",borderLeft:isSel?"3px solid #E90052":"3px solid transparent" }}>
                          <Thumb item={p} />
                          <div style={{ flex:1,minWidth:0 }}>
                            <p style={{ fontWeight:isSel?700:500,color:"#263a55",fontSize:"0.83rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.nombre}</p>
                            <p style={{ fontSize:"0.7rem",color:"#84878F" }}>{p.tipo||p.categoria}{p.equipo?` · ${p.equipo}`:""}</p>
                          </div>
                          <div style={{ textAlign:"right",flexShrink:0 }}>
                            <p style={{ fontSize:"0.78rem",fontWeight:700,color:"#263a55" }}>{Number(p.costo).toLocaleString()} pts</p>
                            {p.rareza&&(()=>{const rs=RAREZA_COLORS[p.rareza!]||{bg:"#f0f0f0",color:"#555"};return badge(rs.bg,rs.color,p.rareza!);})()}
                          </div>
                          {isSel&&<span style={{ color:"#E90052",fontSize:"1rem",flexShrink:0 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <label style={lbl}>Precio de venta (pts) *</label>
                    <input type="number" min={1} placeholder="Ej: 800" value={pubPrecio} onChange={e=>setPubPrecio(e.target.value)} style={inp} />
                    {selectedProd&&pubPrecio&&Number(pubPrecio)>0&&(
                      <p style={{ fontSize:"0.7rem",color:"#84878F",marginTop:"4px" }}>
                        {Number(pubPrecio)<Number(selectedProd.costo)?`↓ ${Math.round((1-Number(pubPrecio)/Number(selectedProd.costo))*100)}% bajo precio de catálogo`:Number(pubPrecio)>Number(selectedProd.costo)?`↑ ${Math.round((Number(pubPrecio)/Number(selectedProd.costo)-1)*100)}% sobre precio de catálogo`:"Al precio de catálogo"}
                      </p>
                    )}
                  </div>
                  {pubError&&<p style={{ fontSize:"0.78rem",color:"#dc2626" }}>{pubError}</p>}
                </div>
                <div style={{ padding:"1rem 1.75rem",borderTop:"1px solid #f0f0f0",display:"flex",gap:"8px",justifyContent:"flex-end" }}>
                  <button onClick={closePubModal} style={{ padding:"0.6rem 1.1rem",borderRadius:"8px",border:"1px solid #e0e0e0",background:"#fff",color:"#84878F",fontSize:"0.85rem",fontWeight:600,cursor:"pointer" }}>Cancelar</button>
                  <button onClick={handlePublicar} disabled={publishing||!selectedProd||!pubPrecio||Number(pubPrecio)<=0} style={{ padding:"0.6rem 1.3rem",borderRadius:"8px",border:"none",background:publishing||!selectedProd||!pubPrecio||Number(pubPrecio)<=0?"#e0e0e0":"#E90052",color:publishing||!selectedProd||!pubPrecio||Number(pubPrecio)<=0?"#999":"#fff",fontSize:"0.85rem",fontWeight:700,cursor:publishing||!selectedProd||!pubPrecio||Number(pubPrecio)<=0?"not-allowed":"pointer" }}>
                    {publishing?"Publicando...":"Publicar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL: Editar precio ── */}
          {editingListado&&(
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9001 }} onClick={()=>setEditingListado(null)}>
              <div style={{ background:"#fff",borderRadius:"14px",padding:"1.75rem",width:"380px",maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }} onClick={e=>e.stopPropagation()}>
                <h3 style={{ color:"#263a55",fontSize:"1rem",fontWeight:800,marginBottom:"0.3rem" }}>Editar precio</h3>
                <div style={{ display:"flex",alignItems:"center",gap:"10px",margin:"1rem 0",padding:"0.75rem",background:"#f8f9fa",borderRadius:"9px" }}>
                  <Thumb item={editingListado} />
                  <div>
                    <p style={{ fontWeight:700,color:"#263a55",fontSize:"0.85rem" }}>{editingListado.nombre||`Listado #${editingListado.id_listado}`}</p>
                    <p style={{ fontSize:"0.72rem",color:"#84878F" }}>Precio actual: <strong>{editingListado.precio.toLocaleString()} pts</strong></p>
                  </div>
                </div>
                <div style={{ marginBottom:"1rem" }}>
                  <label style={lbl}>Nuevo precio (pts)</label>
                  <input type="number" min={1} autoFocus value={editPrecio} onChange={e=>setEditPrecio(e.target.value)} style={inp} />
                </div>
                {editError&&<p style={{ fontSize:"0.78rem",color:"#dc2626",marginBottom:"0.8rem" }}>{editError}</p>}
                <div style={{ display:"flex",gap:"8px",justifyContent:"flex-end" }}>
                  <button onClick={()=>setEditingListado(null)} style={{ padding:"0.6rem 1.1rem",borderRadius:"8px",border:"1px solid #e0e0e0",background:"#fff",color:"#84878F",fontSize:"0.85rem",fontWeight:600,cursor:"pointer" }}>Cancelar</button>
                  <button onClick={handleEditPrecio} disabled={savingEdit} style={{ padding:"0.6rem 1.3rem",borderRadius:"8px",border:"none",background:savingEdit?"#e0e0e0":"#263a55",color:savingEdit?"#999":"#fff",fontSize:"0.85rem",fontWeight:700,cursor:savingEdit?"not-allowed":"pointer" }}>{savingEdit?"Guardando...":"Guardar"}</button>
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL: Confirmar cancelar listado ── */}
          {confirmMktId!==null&&(
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9001 }} onClick={()=>setConfirmMktId(null)}>
              <div style={{ background:"#fff",borderRadius:"14px",padding:"1.75rem",width:"360px",maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }} onClick={e=>e.stopPropagation()}>
                <h3 style={{ color:"#263a55",fontSize:"1rem",fontWeight:800,marginBottom:"0.4rem" }}>Cancelar listado</h3>
                <p style={{ color:"#84878F",fontSize:"0.85rem",lineHeight:1.6,marginBottom:"1.4rem" }}>
                  ¿Seguro que querés cancelar <strong style={{ color:"#263a55" }}>{confirmMktListado?.nombre||`#${confirmMktId}`}</strong>? Dejará de aparecer en el marketplace.
                </p>
                <div style={{ display:"flex",gap:"8px",justifyContent:"flex-end" }}>
                  <button onClick={()=>setConfirmMktId(null)} style={{ padding:"0.6rem 1.1rem",borderRadius:"8px",border:"1px solid #e0e0e0",background:"#fff",color:"#84878F",fontSize:"0.85rem",fontWeight:600,cursor:"pointer" }}>Volver</button>
                  <button onClick={handleCancelarListado} disabled={canceling} style={{ padding:"0.6rem 1.1rem",borderRadius:"8px",border:"none",background:canceling?"#e0e0e0":"#dc2626",color:canceling?"#999":"#fff",fontSize:"0.85rem",fontWeight:700,cursor:canceling?"not-allowed":"pointer" }}>{canceling?"Cancelando...":"Cancelar listado"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}