import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminTienda.css";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Product {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  costo: number;
  stock: number;
  imagen: string | null;
  es_nuevo: boolean;
  categoria: "perfil" | "real" | string;
  tipo: string | null;
  equipo: string | null;
  rareza: string | null;
  id_temporada: number | null;
  css: string | null;
  es_de_liga: boolean;
}

interface Listado {
  id_listado: number;
  id_vendedor: number;
  id_inventario: number | null;
  precio: number;
  estado: "activo" | "vendido" | "cancelado";
  created_at?: string;
  fecha_creacion?: string;
  fecha_venta?: string | null;
  id_comprador?: number | null;
  nombre?: string | null;
  imagen?: string | null;
  css?: string | null;
  tipo?: string | null;
  rareza?: string | null;
  categoria?: string | null;
  equipo?: string | null;
  vendedor_nickname?: string | null;
}

interface AdminTiendaProps {
  user: { id_usuario: number };
}

type EstadoFilter = "todos" | "activo" | "vendido" | "cancelado";
type CategoriaFilter = "todos" | "perfil" | "real";

const EMPTY_NEW_PRODUCT = {
  nombre: "",
  descripcion: "",
  costo: "",
  stock: "0",
  imagen: "",
  es_nuevo: true,
  es_de_liga: false,
  categoria: "perfil" as "perfil" | "real",
  tipo: "",
  equipo: "",
  rareza: "",
  id_temporada: "",
};

const NEW_PRODUCT_TIPOS = [
  "marco",
  "titulo",
  "banner",
  "trofeo",
  "achievement",
  "foto_perfil",
  "jersey",
  "balonazo",
  "ropa",
  "accesorio",
];

const ESTADO_LABEL: Record<string, string> = {
  activo: "Activo",
  vendido: "Vendido",
  cancelado: "Cancelado",
};

function tipoLabel(tipo?: string | null) {
  if (!tipo) return "Sin tipo";

  const labels: Record<string, string> = {
    balonazo: "Balón",
    foto_perfil: "Foto perfil",
    achievement: "Achievement",
    jersey: "Jersey",
    ropa: "Ropa",
    accesorio: "Accesorio",
    marco: "Marco",
    titulo: "Título",
    banner: "Banner",
    trofeo: "Trofeo",
  };

  return labels[tipo] || tipo;
}

function categoriaLabel(categoria?: string | null) {
  if (categoria === "real") return "Objeto real";
  if (categoria === "perfil") return "Perfil";
  return "Sin categoría";
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof TypeError) return "No se pudo conectar con el backend";
  if (error instanceof Error) return error.message;
  return "Error de conexión";
}

function ProductThumb({
  item,
}: {
  item: { imagen?: string | null; css?: string | null; tipo?: string | null };
}) {
  const fallback =
    item.tipo === "banner"
      ? "linear-gradient(135deg, #263a55, #E90052)"
      : item.tipo === "marco"
        ? "linear-gradient(135deg, #E90052, #f59e0b)"
        : "linear-gradient(135deg, #263a55, #871d54)";

  return (
    <div
      className="adm-store-thumb"
      style={{
        background: item.imagen
          ? `#f0f2f5 url(${item.imagen}) center/cover no-repeat`
          : item.css || fallback,
      }}
    >
      {!item.imagen && !item.css && (
        <span>{tipoLabel(item.tipo).slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

function ChipGroup({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string; count?: number }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="adm-store-chips">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={value === item.key ? "adm-store-chip is-active" : "adm-store-chip"}
        >
          <span>{item.label}</span>
          {item.count !== undefined && <b>{item.count}</b>}
        </button>
      ))}
    </div>
  );
}

export default function AdminTienda({ user }: AdminTiendaProps) {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [listados, setListados] = useState<Listado[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [marketSearch, setMarketSearch] = useState("");
  const [marketEstado, setMarketEstado] = useState<EstadoFilter>("todos");
  const [marketTipo, setMarketTipo] = useState("todos");

  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoria, setCatalogCategoria] = useState<CategoriaFilter>("todos");
  const [catalogTipo, setCatalogTipo] = useState("todos");

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishSearch, setPublishSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [publishPrice, setPublishPrice] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_NEW_PRODUCT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingListado, setEditingListado] = useState<Listado | null>(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [confirmCancel, setConfirmCancel] = useState<Listado | null>(null);
  const [canceling, setCanceling] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const adminFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const joiner = path.includes("?") ? "&" : "?";
      const pathWithAdmin = `${path}${joiner}id_usuario=${encodeURIComponent(
        String(user.id_usuario),
      )}`;

      const headers = new Headers(init.headers);

      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      headers.set("x-id-usuario", String(user.id_usuario));

      const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
      const url = `${baseUrl}/api/admin${pathWithAdmin}`;

      const res = await fetch(url, {
        ...init,
        credentials: "include",
        headers,
      });

      const text = await res.text();

      let json: any;

      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Ruta no encontrada o servidor equivocado: ${url}`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error de servidor");
      }

      return json;
    },
    [user.id_usuario],
  );

  const fetchListados = useCallback(async () => {
    setLoadingMarket(true);

    try {
      const json = await adminFetch("/marketplace/listados");
      setListados(json.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), false);
    } finally {
      setLoadingMarket(false);
    }
  }, [adminFetch]);

  const fetchCatalogo = useCallback(async () => {
    setLoadingCatalog(true);

    try {
      const json = await adminFetch("/productos");
      setProductos(json.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), false);
    } finally {
      setLoadingCatalog(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    fetchListados();
    fetchCatalogo();
  }, [fetchListados, fetchCatalogo]);

  const productTypes = useMemo(() => {
    const tipos = productos.map((p) => p.tipo).filter(Boolean) as string[];
    return ["todos", ...Array.from(new Set(tipos))];
  }, [productos]);

  const marketTypes = useMemo(() => {
    const tipos = listados.map((l) => l.tipo).filter(Boolean) as string[];
    return ["todos", ...Array.from(new Set(tipos))];
  }, [listados]);

  const filteredListados = useMemo(() => {
    const term = marketSearch.trim().toLowerCase();

    return listados.filter((l) => {
      const matchesText =
        !term ||
        (l.nombre || "").toLowerCase().includes(term) ||
        (l.vendedor_nickname || "").toLowerCase().includes(term) ||
        (l.equipo || "").toLowerCase().includes(term) ||
        String(l.id_listado).includes(term);

      const matchesEstado = marketEstado === "todos" || l.estado === marketEstado;
      const matchesTipo = marketTipo === "todos" || l.tipo === marketTipo;

      return matchesText && matchesEstado && matchesTipo;
    });
  }, [listados, marketSearch, marketEstado, marketTipo]);

  const filteredProductos = useMemo(() => {
    const term = catalogSearch.trim().toLowerCase();

    return productos.filter((p) => {
      const matchesText =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion || "").toLowerCase().includes(term) ||
        (p.equipo || "").toLowerCase().includes(term) ||
        (p.tipo || "").toLowerCase().includes(term);

      const matchesCategoria = catalogCategoria === "todos" || p.categoria === catalogCategoria;
      const matchesTipo = catalogTipo === "todos" || p.tipo === catalogTipo;

      return matchesText && matchesCategoria && matchesTipo;
    });
  }, [productos, catalogSearch, catalogCategoria, catalogTipo]);

  const productosParaPublicar = useMemo(() => {
    const term = publishSearch.trim().toLowerCase();

    return productos.filter((p) => {
      if (!term) return true;

      return (
        p.nombre.toLowerCase().includes(term) ||
        (p.equipo || "").toLowerCase().includes(term) ||
        (p.tipo || "").toLowerCase().includes(term)
      );
    });
  }, [productos, publishSearch]);

  const stats = {
    catalogo: productos.length,
    perfil: productos.filter((p) => p.categoria === "perfil").length,
    real: productos.filter((p) => p.categoria === "real").length,
    activos: listados.filter((l) => l.estado === "activo").length,
    vendidos: listados.filter((l) => l.estado === "vendido").length,
  };

  const openCreate = () => {
    setNewProduct(EMPTY_NEW_PRODUCT);
    setCreateError("");
    setCreateOpen(true);
  };

  const openPublish = () => {
    setSelectedProductId(null);
    setPublishPrice("");
    setPublishSearch("");
    setPublishError("");
    setPublishOpen(true);
  };

  const handleCreateProduct = async () => {
    if (!newProduct.nombre.trim() || newProduct.costo === "" || Number(newProduct.costo) < 0) {
      setCreateError("Nombre y costo válido son requeridos.");
      return;
    }

    setCreateError("");
    setCreating(true);

    const payload = {
      nombre: newProduct.nombre.trim(),
      descripcion: newProduct.descripcion.trim() || null,
      costo: Number(newProduct.costo),
      stock: Number(newProduct.stock || 0),
      imagen: newProduct.imagen.trim() || null,
      es_nuevo: newProduct.es_nuevo,
      categoria: newProduct.categoria,
      tipo: newProduct.tipo || null,
      equipo: newProduct.equipo.trim() || null,
      rareza: newProduct.rareza.trim() || null,
      id_temporada: newProduct.id_temporada ? Number(newProduct.id_temporada) : null,
      css: null,
      es_de_liga: newProduct.es_de_liga,
    };

    try {
      const json = await adminFetch("/productos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setProductos((prev) => [json.data, ...prev]);
      setCreateOpen(false);
      showToast("Objeto creado");
    } catch (error) {
      setCreateError(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handlePublicar = async () => {
    if (!selectedProductId || !publishPrice || Number(publishPrice) <= 0) {
      setPublishError("Selecciona un producto y un precio mayor a 0.");
      return;
    }

    setPublishError("");
    setPublishing(true);

    try {
      const json = await adminFetch("/marketplace/publicar", {
        method: "POST",
        body: JSON.stringify({
          id_admin: user.id_usuario,
          id_producto: selectedProductId,
          precio: Number(publishPrice),
        }),
      });

      setListados((prev) => [json.data, ...prev]);
      setPublishOpen(false);
      showToast("Producto publicado en marketplace");
    } catch (error) {
      setPublishError(getErrorMessage(error));
    } finally {
      setPublishing(false);
    }
  };

  const handleEditPrecio = async () => {
    if (!editingListado || !editPrecio || Number(editPrecio) <= 0) {
      setEditError("Precio inválido.");
      return;
    }

    setEditError("");
    setSavingEdit(true);

    try {
      const json = await adminFetch(`/marketplace/listados/${editingListado.id_listado}`, {
        method: "PUT",
        body: JSON.stringify({ precio: Number(editPrecio) }),
      });

      setListados((prev) =>
        prev.map((l) => (l.id_listado === json.data.id_listado ? json.data : l)),
      );
      setEditingListado(null);
      showToast("Precio actualizado");
    } catch (error) {
      setEditError(getErrorMessage(error));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelListado = async () => {
    if (!confirmCancel) return;

    setCanceling(true);

    try {
      await adminFetch(`/marketplace/cancelar/${confirmCancel.id_listado}`, {
        method: "DELETE",
      });

      setListados((prev) =>
        prev.map((l) =>
          l.id_listado === confirmCancel.id_listado ? { ...l, estado: "cancelado" } : l,
        ),
      );
      setConfirmCancel(null);
      showToast("Listado cancelado");
    } catch (error) {
      showToast(getErrorMessage(error), false);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="adm-store">
      {toast && (
        <div className={toast.ok ? "adm-store-toast is-ok" : "adm-store-toast is-error"}>
          {toast.ok ? "✓ " : "✗ "}
          {toast.msg}
        </div>
      )}

      <section className="adm-store-hero">
        <div>
          <p className="adm-store-eyebrow">PremierHub Admin</p>
          <h2>Tienda y Marketplace</h2>
          <p>Gestiona el catálogo base y las publicaciones activas desde un solo lugar.</p>
        </div>

        <div className="adm-store-hero-actions">
          <button type="button" className="adm-store-btn is-secondary" onClick={openCreate}>
            + Crear objeto
          </button>
          <button type="button" className="adm-store-btn is-primary" onClick={openPublish}>
            + Publicar producto
          </button>
        </div>
      </section>

      <section className="adm-store-stats">
        <div>
          <span>Catálogo</span>
          <b>{stats.catalogo}</b>
        </div>
        <div>
          <span>Perfil</span>
          <b>{stats.perfil}</b>
        </div>
        <div>
          <span>Reales</span>
          <b>{stats.real}</b>
        </div>
        <div>
          <span>Activos</span>
          <b>{stats.activos}</b>
        </div>
        <div>
          <span>Vendidos</span>
          <b>{stats.vendidos}</b>
        </div>
      </section>

      <section className="adm-store-section">
        <div className="adm-store-section-head">
          <div>
            <h3>Marketplace</h3>
            <p>{filteredListados.length} publicaciones encontradas</p>
          </div>
        </div>

        <div className="adm-store-toolbar">
          <input
            value={marketSearch}
            onChange={(e) => setMarketSearch(e.target.value)}
            placeholder="Buscar publicación, vendedor, equipo o #id..."
            className="adm-store-input"
          />

          <ChipGroup
            value={marketEstado}
            onChange={(v) => setMarketEstado(v as EstadoFilter)}
            items={[
              { key: "todos", label: "Todos", count: listados.length },
              {
                key: "activo",
                label: "Activos",
                count: listados.filter((l) => l.estado === "activo").length,
              },
              {
                key: "vendido",
                label: "Vendidos",
                count: listados.filter((l) => l.estado === "vendido").length,
              },
              {
                key: "cancelado",
                label: "Cancelados",
                count: listados.filter((l) => l.estado === "cancelado").length,
              },
            ]}
          />

          <ChipGroup
            value={marketTipo}
            onChange={setMarketTipo}
            items={marketTypes.map((tipo) => ({
              key: tipo,
              label: tipo === "todos" ? "Todos los tipos" : tipoLabel(tipo),
            }))}
          />
        </div>

        {loadingMarket ? (
          <p className="adm-store-empty">Cargando marketplace...</p>
        ) : filteredListados.length === 0 ? (
          <p className="adm-store-empty">No hay publicaciones con esos filtros.</p>
        ) : (
          <div className="adm-store-list">
            {filteredListados.map((l) => (
              <article key={l.id_listado} className="adm-store-row">
                <ProductThumb item={l} />

                <div className="adm-store-row-main">
                  <div className="adm-store-row-top">
                    <h4>{l.nombre || `Listado #${l.id_listado}`}</h4>
                    <span className={`adm-store-status is-${l.estado}`}>
                      {ESTADO_LABEL[l.estado] || l.estado}
                    </span>
                  </div>

                  <p className="adm-store-row-meta">
                    #{l.id_listado} · {tipoLabel(l.tipo)} · {categoriaLabel(l.categoria)}
                    {l.equipo ? ` · ${l.equipo}` : ""}
                  </p>

                  <p className="adm-store-row-soft">
                    Vendedor: {l.vendedor_nickname || `Usuario #${l.id_vendedor}`} · Publicado:{" "}
                    {formatDate(l.fecha_creacion || l.created_at)}
                  </p>
                </div>

                <div className="adm-store-row-side">
                  <strong>{Number(l.precio).toLocaleString()} pts</strong>

                  {l.estado === "activo" && (
                    <div className="adm-store-row-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingListado(l);
                          setEditPrecio(String(l.precio));
                          setEditError("");
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className="is-danger" onClick={() => setConfirmCancel(l)}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="adm-store-section">
        <div className="adm-store-section-head">
          <div>
            <h3>Catálogo de tienda</h3>
            <p>{filteredProductos.length} objetos encontrados</p>
          </div>
        </div>

        <div className="adm-store-toolbar">
          <input
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder="Buscar objeto, equipo, tipo..."
            className="adm-store-input"
          />

          <ChipGroup
            value={catalogCategoria}
            onChange={(v) => setCatalogCategoria(v as CategoriaFilter)}
            items={[
              { key: "todos", label: "Todo", count: productos.length },
              {
                key: "perfil",
                label: "Perfil",
                count: productos.filter((p) => p.categoria === "perfil").length,
              },
              {
                key: "real",
                label: "Reales",
                count: productos.filter((p) => p.categoria === "real").length,
              },
            ]}
          />

          <ChipGroup
            value={catalogTipo}
            onChange={setCatalogTipo}
            items={productTypes.map((tipo) => ({
              key: tipo,
              label: tipo === "todos" ? "Todos los tipos" : tipoLabel(tipo),
            }))}
          />
        </div>

        {loadingCatalog ? (
          <p className="adm-store-empty">Cargando catálogo...</p>
        ) : filteredProductos.length === 0 ? (
          <p className="adm-store-empty">No hay objetos con esos filtros.</p>
        ) : (
          <div className="adm-store-list">
            {filteredProductos.map((p) => (
              <article key={p.id_producto} className="adm-store-row">
                <ProductThumb item={p} />

                <div className="adm-store-row-main">
                  <div className="adm-store-row-top">
                    <h4>{p.nombre}</h4>
                    <div className="adm-store-mini-tags">
                      {p.es_nuevo && <span>Nuevo</span>}
                      <span>{categoriaLabel(p.categoria)}</span>
                    </div>
                  </div>

                  <p className="adm-store-row-meta">
                    #{p.id_producto} · {tipoLabel(p.tipo)}
                    {p.equipo ? ` · ${p.equipo}` : ""}
                    {p.rareza ? ` · ${p.rareza}` : ""}
                  </p>

                  <p className="adm-store-row-soft">{p.descripcion || "Sin descripción"}</p>
                </div>

                <div className="adm-store-row-side">
                  <strong>{Number(p.costo).toLocaleString()} pts</strong>
                  <span>Stock: {Number(p.stock || 0)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {createOpen && (
        <div className="adm-store-modal-backdrop">
          <div className="adm-store-modal">
            <div className="adm-store-modal-head">
              <div>
                <h3>Crear objeto</h3>
                <p>Agrega un item nuevo al catálogo base de la tienda.</p>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)}>
                ×
              </button>
            </div>

            <div className="adm-store-form-grid">
              <label className="adm-store-field">
                <span>Nombre</span>
                <input
                  value={newProduct.nombre}
                  onChange={(e) => setNewProduct((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej. Marco Campeón"
                />
              </label>

              <label className="adm-store-field">
                <span>Costo</span>
                <input
                  type="number"
                  value={newProduct.costo}
                  onChange={(e) => setNewProduct((p) => ({ ...p, costo: e.target.value }))}
                  placeholder="1500"
                />
              </label>

              <label className="adm-store-field">
                <span>Categoría</span>
                <select
                  value={newProduct.categoria}
                  onChange={(e) =>
                    setNewProduct((p) => ({
                      ...p,
                      categoria: e.target.value as "perfil" | "real",
                    }))
                  }
                >
                  <option value="perfil">Perfil</option>
                  <option value="real">Objeto real</option>
                </select>
              </label>

              <label className="adm-store-field">
                <span>Tipo</span>
                <select
                  value={newProduct.tipo}
                  onChange={(e) => setNewProduct((p) => ({ ...p, tipo: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  {NEW_PRODUCT_TIPOS.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipoLabel(tipo)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="adm-store-field">
                <span>Stock</span>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                />
              </label>

              <label className="adm-store-field">
                <span>Equipo</span>
                <input
                  value={newProduct.equipo}
                  onChange={(e) => setNewProduct((p) => ({ ...p, equipo: e.target.value }))}
                  placeholder="Opcional"
                />
              </label>

              <label className="adm-store-field">
                <span>Rareza</span>
                <input
                  value={newProduct.rareza}
                  onChange={(e) => setNewProduct((p) => ({ ...p, rareza: e.target.value }))}
                  placeholder="Common, Rare, Elite..."
                />
              </label>

              <label className="adm-store-field">
                <span>Temporada ID</span>
                <input
                  type="number"
                  value={newProduct.id_temporada}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, id_temporada: e.target.value }))
                  }
                  placeholder="Opcional"
                />
              </label>

              <label className="adm-store-field is-wide">
                <span>Descripción</span>
                <textarea
                  value={newProduct.descripcion}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, descripcion: e.target.value }))
                  }
                  placeholder="Descripción visible en tienda"
                />
              </label>

              <label className="adm-store-field is-wide">
                <span>Imagen URL</span>
                <input
                  value={newProduct.imagen}
                  onChange={(e) => setNewProduct((p) => ({ ...p, imagen: e.target.value }))}
                  placeholder="https://..."
                />
              </label>

              <div className="adm-store-checks is-wide">
                <label>
                  <input
                    type="checkbox"
                    checked={newProduct.es_nuevo}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, es_nuevo: e.target.checked }))
                    }
                  />
                  Nuevo
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={newProduct.es_de_liga}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, es_de_liga: e.target.checked }))
                    }
                  />
                  De liga
                </label>
              </div>
            </div>

            {createError && <p className="adm-store-error">{createError}</p>}

            <div className="adm-store-modal-actions">
              <button type="button" className="adm-store-btn is-ghost" onClick={() => setCreateOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="adm-store-btn is-primary"
                onClick={handleCreateProduct}
                disabled={creating}
              >
                {creating ? "Creando..." : "Crear objeto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {publishOpen && (
        <div className="adm-store-modal-backdrop">
          <div className="adm-store-modal">
            <div className="adm-store-modal-head">
              <div>
                <h3>Publicar producto</h3>
                <p>Selecciona cualquier objeto del catálogo y publícalo en marketplace.</p>
              </div>
              <button type="button" onClick={() => setPublishOpen(false)}>
                ×
              </button>
            </div>

            <input
              value={publishSearch}
              onChange={(e) => setPublishSearch(e.target.value)}
              className="adm-store-input"
              placeholder="Buscar producto..."
            />

            <div className="adm-store-picker">
              {productosParaPublicar.map((p) => (
                <button
                  key={p.id_producto}
                  type="button"
                  onClick={() => setSelectedProductId(p.id_producto)}
                  className={selectedProductId === p.id_producto ? "adm-store-pick is-selected" : "adm-store-pick"}
                >
                  <ProductThumb item={p} />
                  <span>
                    <b>{p.nombre}</b>
                    <small>
                      {tipoLabel(p.tipo)} · {categoriaLabel(p.categoria)}
                    </small>
                  </span>
                  <strong>{Number(p.costo).toLocaleString()} pts</strong>
                </button>
              ))}
            </div>

            <label className="adm-store-field">
              <span>Precio en marketplace</span>
              <input
                type="number"
                value={publishPrice}
                onChange={(e) => setPublishPrice(e.target.value)}
                placeholder="Ej. 2500"
              />
            </label>

            {publishError && <p className="adm-store-error">{publishError}</p>}

            <div className="adm-store-modal-actions">
              <button type="button" className="adm-store-btn is-ghost" onClick={() => setPublishOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="adm-store-btn is-primary"
                onClick={handlePublicar}
                disabled={publishing}
              >
                {publishing ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingListado && (
        <div className="adm-store-modal-backdrop">
          <div className="adm-store-modal is-small">
            <div className="adm-store-modal-head">
              <div>
                <h3>Editar precio</h3>
                <p>{editingListado.nombre}</p>
              </div>
              <button type="button" onClick={() => setEditingListado(null)}>
                ×
              </button>
            </div>

            <label className="adm-store-field">
              <span>Nuevo precio</span>
              <input
                type="number"
                value={editPrecio}
                onChange={(e) => setEditPrecio(e.target.value)}
              />
            </label>

            {editError && <p className="adm-store-error">{editError}</p>}

            <div className="adm-store-modal-actions">
              <button type="button" className="adm-store-btn is-ghost" onClick={() => setEditingListado(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="adm-store-btn is-primary"
                onClick={handleEditPrecio}
                disabled={savingEdit}
              >
                {savingEdit ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="adm-store-modal-backdrop">
          <div className="adm-store-modal is-small">
            <div className="adm-store-modal-head">
              <div>
                <h3>Cancelar listado</h3>
                <p>¿Seguro que quieres cancelar “{confirmCancel.nombre}”?</p>
              </div>
              <button type="button" onClick={() => setConfirmCancel(null)}>
                ×
              </button>
            </div>

            <div className="adm-store-modal-actions">
              <button type="button" className="adm-store-btn is-ghost" onClick={() => setConfirmCancel(null)}>
                Volver
              </button>
              <button
                type="button"
                className="adm-store-btn is-danger"
                onClick={handleCancelListado}
                disabled={canceling}
              >
                {canceling ? "Cancelando..." : "Cancelar listado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}