import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import "./AdminTienda.css";

const API_URL = import.meta.env.VITE_API_URL;

interface Product {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  costo: number;
  stock: number;
  imagen: string | null;
  es_nuevo: boolean;
  categoria: string;
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

const ESTADO_STYLE: Record<string, { label: string; className: string }> = {
  activo: { label: "Activo", className: "is-active" },
  vendido: { label: "Vendido", className: "is-sold" },
  cancelado: { label: "Cancelado", className: "is-cancelled" },
};

const tipoLabel = (tipo?: string | null) => {
  if (!tipo) return "Sin tipo";

  const labels: Record<string, string> = {
    jersey: "Jersey",
    balonazo: "Balón",
    ropa: "Ropa",
    accesorio: "Accesorio",
    marco: "Marco",
    titulo: "Título",
    trofeo: "Trofeo",
    achievement: "Achievement",
    foto_perfil: "Foto de perfil",
    banner: "Banner",
    avatar: "Avatar",
  };

  return labels[tipo] || tipo;
};

const categoriaLabel = (cat?: string | null) => {
  if (!cat) return "Sin categoría";
  if (cat === "perfil") return "Perfil";
  if (cat === "real") return "Real";
  return cat;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function ProductThumb({
  item,
}: {
  item: { imagen?: string | null; css?: string | null; nombre?: string | null };
}) {
  return (
    <div
      className="adm-store-thumb"
      style={{
        background: item.css
          ? item.css
          : item.imagen
            ? `#f3f4f6 url(${item.imagen}) center/cover no-repeat`
            : "linear-gradient(135deg, #263a55, #871d54)",
      }}
    >
      {!item.imagen && !item.css && (
        <span>{(item.nombre || "?").slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function ChipGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="adm-store-chips">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`adm-store-chip ${value === opt.value ? "is-selected" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AdminObjectCard({
  item,
  eyebrow,
  title,
  meta,
  submeta,
  price,
  status,
  actions,
  onClick,
  compact = false,
}: {
  item: { imagen?: string | null; css?: string | null; nombre?: string | null };
  eyebrow: string;
  title: string;
  meta: string;
  submeta?: string | null;
  price?: string;
  status?: { label: string; className: string };
  actions?: ReactNode;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`adm-store-card ${compact ? "is-compact" : ""} ${onClick ? "is-clickable" : ""}`}
      onClick={onClick}
    >
      <ProductThumb item={item} />

      <div className="adm-store-card-main">
        <span className="adm-store-card-eyebrow">{eyebrow}</span>
        <strong>{title}</strong>
        <p>{meta}</p>
        {submeta && <small>{submeta}</small>}
      </div>

      <div className="adm-store-card-side">
        {price && <strong>{price}</strong>}
        {status && <span className={`adm-store-status ${status.className}`}>{status.label}</span>}
        {actions && <div className="adm-store-card-actions">{actions}</div>}
      </div>
    </div>
  );
}

export default function AdminTienda({ user }: AdminTiendaProps) {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [listados, setListados] = useState<Listado[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loadingListados, setLoadingListados] = useState(false);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  const [marketSearch, setMarketSearch] = useState("");
  const [marketEstado, setMarketEstado] = useState("todos");
  const [marketTipo, setMarketTipo] = useState("todos");

  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoria, setCatalogCategoria] = useState("todos");
  const [catalogTipo, setCatalogTipo] = useState("todos");

  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [prodSearch, setProdSearch] = useState("");
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [pubPrecio, setPubPrecio] = useState("");
  const [pubError, setPubError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [editingListado, setEditingListado] = useState<Listado | null>(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [confirmCancel, setConfirmCancel] = useState<Listado | null>(null);
  const [canceling, setCanceling] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const adminFetch = useCallback((path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set("x-id-usuario", String(user.id_usuario));

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(`${API_URL}/api/admin${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  }, [user.id_usuario]);

  const fetchListados = useCallback(async () => {
    setLoadingListados(true);

    try {
      const res = await adminFetch("/marketplace/listados");
      const json = await res.json();

      if (json.success) setListados(json.data || []);
      else showToast(json.error || "Error cargando listados", false);
    } catch {
      showToast("Error de conexión cargando listados", false);
    } finally {
      setLoadingListados(false);
    }
  }, [adminFetch]);

  const fetchCatalogo = useCallback(async () => {
    setLoadingCatalogo(true);

    try {
      const res = await adminFetch("/marketplace/catalogo");
      const json = await res.json();

      if (json.success) setProductos(json.data || []);
      else showToast(json.error || "Error cargando catálogo", false);
    } catch {
      showToast("Error de conexión cargando catálogo", false);
    } finally {
      setLoadingCatalogo(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    fetchListados();
    fetchCatalogo();
  }, [fetchListados, fetchCatalogo]);

  const marketTipos = useMemo(() => {
    const tipos = new Set<string>();
    listados.forEach(l => l.tipo && tipos.add(l.tipo));
    return ["todos", ...Array.from(tipos).sort()];
  }, [listados]);

  const catalogTipos = useMemo(() => {
    const tipos = new Set<string>();
    productos.forEach(p => p.tipo && tipos.add(p.tipo));
    return ["todos", ...Array.from(tipos).sort()];
  }, [productos]);

  const catalogCategorias = useMemo(() => {
    const cats = new Set<string>();
    productos.forEach(p => p.categoria && cats.add(p.categoria));
    return ["todos", ...Array.from(cats).sort()];
  }, [productos]);

  const filteredListados = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();

    return listados.filter(l => {
      const matchSearch =
        !q ||
        String(l.id_listado).includes(q) ||
        (l.nombre || "").toLowerCase().includes(q) ||
        (l.equipo || "").toLowerCase().includes(q) ||
        (l.tipo || "").toLowerCase().includes(q) ||
        (l.categoria || "").toLowerCase().includes(q) ||
        (l.vendedor_nickname || "").toLowerCase().includes(q);

      return matchSearch
        && (marketEstado === "todos" || l.estado === marketEstado)
        && (marketTipo === "todos" || l.tipo === marketTipo);
    });
  }, [listados, marketSearch, marketEstado, marketTipo]);

  const filteredProductos = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();

    return productos.filter(p => {
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.equipo || "").toLowerCase().includes(q) ||
        (p.tipo || "").toLowerCase().includes(q) ||
        (p.categoria || "").toLowerCase().includes(q) ||
        (p.rareza || "").toLowerCase().includes(q);

      return matchSearch
        && (catalogCategoria === "todos" || p.categoria === catalogCategoria)
        && (catalogTipo === "todos" || p.tipo === catalogTipo);
    });
  }, [productos, catalogSearch, catalogCategoria, catalogTipo]);

  const modalProductos = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();

    return productos.filter(p =>
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.equipo || "").toLowerCase().includes(q) ||
      (p.tipo || "").toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q) ||
      (p.rareza || "").toLowerCase().includes(q)
    );
  }, [productos, prodSearch]);

  const stats = useMemo(() => ({
    total: listados.length,
    activos: listados.filter(l => l.estado === "activo").length,
    vendidos: listados.filter(l => l.estado === "vendido").length,
    cancelados: listados.filter(l => l.estado === "cancelado").length,
    catalogo: productos.length,
  }), [listados, productos]);

  const openPublish = () => {
    setSelectedProd(null);
    setPubPrecio("");
    setProdSearch("");
    setPubError("");
    setPubModalOpen(true);
  };

  const closePublishModal = () => {
    setPubModalOpen(false);
    setSelectedProd(null);
    setPubPrecio("");
    setProdSearch("");
    setPubError("");
  };

  const handlePublicar = async () => {
    if (!selectedProd || !pubPrecio || Number(pubPrecio) <= 0) {
      setPubError("Selecciona un producto y un precio mayor a 0.");
      return;
    }

    setPublishing(true);
    setPubError("");

    try {
      const res = await adminFetch("/marketplace/publicar", {
        method: "POST",
        body: JSON.stringify({
          id_admin: user.id_usuario,
          id_producto: selectedProd.id_producto,
          precio: Number(pubPrecio),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setPubError(json.error || "Error al publicar");
        return;
      }

      setListados(prev => [json.data, ...prev]);
      showToast("Producto publicado en marketplace");
      closePublishModal();
    } catch {
      setPubError("Error de conexión");
    } finally {
      setPublishing(false);
    }
  };

  const handleEditPrecio = async () => {
    if (!editingListado || !editPrecio || Number(editPrecio) <= 0) {
      setEditError("Precio inválido.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const res = await adminFetch(`/marketplace/listados/${editingListado.id_listado}`, {
        method: "PUT",
        body: JSON.stringify({ precio: Number(editPrecio) }),
      });

      const json = await res.json();

      if (!json.success) {
        setEditError(json.error || "Error al guardar");
        return;
      }

      setListados(prev => prev.map(l => l.id_listado === json.data.id_listado ? json.data : l));
      showToast("Precio actualizado");
      setEditingListado(null);
    } catch {
      setEditError("Error de conexión");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelar = async () => {
    if (!confirmCancel) return;

    setCanceling(true);

    try {
      const res = await adminFetch(`/marketplace/cancelar/${confirmCancel.id_listado}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json.success) {
        showToast(json.error || "Error al cancelar", false);
        return;
      }

      setListados(prev => prev.map(l =>
        l.id_listado === confirmCancel.id_listado ? { ...l, estado: "cancelado" as const } : l
      ));

      showToast("Listado cancelado");
      setConfirmCancel(null);
    } catch {
      showToast("Error de conexión", false);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="adm-store">
      {toast && (
        <div className={`adm-store-toast ${toast.ok ? "is-ok" : "is-error"}`}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      <div className="adm-store-hero">
        <div>
          <span className="adm-store-kicker">Admin marketplace</span>
          <h2>Marketplace y catálogo</h2>
          <p>Publica objetos de tienda al marketplace y administra listados existentes.</p>
        </div>

        <button className="adm-store-primary" onClick={openPublish}>
          + Publicar producto
        </button>
      </div>

      <div className="adm-store-stats">
        <div><span>Listados</span><strong>{stats.total}</strong></div>
        <div className="is-active"><span>Activos</span><strong>{stats.activos}</strong></div>
        <div className="is-sold"><span>Vendidos</span><strong>{stats.vendidos}</strong></div>
        <div className="is-cancelled"><span>Cancelados</span><strong>{stats.cancelados}</strong></div>
        <div className="is-catalog"><span>Catálogo</span><strong>{stats.catalogo}</strong></div>
      </div>

      <section className="adm-store-section">
        <div className="adm-store-section-head">
          <div>
            <h3>Publicaciones de marketplace</h3>
            <p>{filteredListados.length} de {listados.length} listados</p>
          </div>
        </div>

        <div className="adm-store-filterbox">
          <input
            className="adm-store-input"
            placeholder="Buscar listado, vendedor, tipo, equipo o ID..."
            value={marketSearch}
            onChange={e => setMarketSearch(e.target.value)}
          />

          <ChipGroup
            value={marketEstado}
            onChange={setMarketEstado}
            options={[
              { value: "todos", label: "Todos" },
              { value: "activo", label: "Activos" },
              { value: "vendido", label: "Vendidos" },
              { value: "cancelado", label: "Cancelados" },
            ]}
          />

          <ChipGroup
            value={marketTipo}
            onChange={setMarketTipo}
            options={marketTipos.map(t => ({
              value: t,
              label: t === "todos" ? "Todos los tipos" : tipoLabel(t),
            }))}
          />
        </div>

        <div className="adm-store-card-grid">
          {loadingListados ? (
            <div className="adm-store-empty">Cargando marketplace...</div>
          ) : filteredListados.length === 0 ? (
            <div className="adm-store-empty">No hay listados para estos filtros.</div>
          ) : (
            filteredListados.map(l => {
              const estado = ESTADO_STYLE[l.estado] || ESTADO_STYLE.cancelado;

              return (
                <AdminObjectCard
                  key={l.id_listado}
                  item={l}
                  eyebrow={`Listado #${l.id_listado}`}
                  title={l.nombre || `Inventario #${l.id_inventario}`}
                  meta={`${tipoLabel(l.tipo)} · ${categoriaLabel(l.categoria)}${l.equipo ? ` · ${l.equipo}` : ""}`}
                  submeta={`${l.vendedor_nickname ? `@${l.vendedor_nickname}` : "Sin vendedor"} · ${formatDate(l.created_at || l.fecha_creacion)}`}
                  price={`${Number(l.precio || 0).toLocaleString()} pts`}
                  status={estado}
                  actions={l.estado === "activo" && (
                    <>
                      <button
                        onClick={() => {
                          setEditingListado(l);
                          setEditPrecio(String(l.precio));
                          setEditError("");
                        }}
                      >
                        Editar
                      </button>
                      <button className="is-danger" onClick={() => setConfirmCancel(l)}>
                        Cancelar
                      </button>
                    </>
                  )}
                />
              );
            })
          )}
        </div>
      </section>

      <section className="adm-store-section">
        <div className="adm-store-section-head">
          <div>
            <h3>Catálogo de tienda</h3>
            <p>{filteredProductos.length} de {productos.length} objetos</p>
          </div>
        </div>

        <div className="adm-store-filterbox">
          <input
            className="adm-store-input"
            placeholder="Buscar objeto, tipo, categoría, equipo..."
            value={catalogSearch}
            onChange={e => setCatalogSearch(e.target.value)}
          />

          <ChipGroup
            value={catalogCategoria}
            onChange={setCatalogCategoria}
            options={catalogCategorias.map(c => ({
              value: c,
              label: c === "todos" ? "Todas las categorías" : categoriaLabel(c),
            }))}
          />

          <ChipGroup
            value={catalogTipo}
            onChange={setCatalogTipo}
            options={catalogTipos.map(t => ({
              value: t,
              label: t === "todos" ? "Todos los tipos" : tipoLabel(t),
            }))}
          />
        </div>

        <div className="adm-store-card-grid">
          {loadingCatalogo ? (
            <div className="adm-store-empty">Cargando catálogo...</div>
          ) : filteredProductos.length === 0 ? (
            <div className="adm-store-empty">No hay objetos para estos filtros.</div>
          ) : (
            filteredProductos.map(p => (
              <AdminObjectCard
                key={p.id_producto}
                item={p}
                eyebrow={`Producto #${p.id_producto}`}
                title={p.nombre}
                meta={`${tipoLabel(p.tipo)} · ${categoriaLabel(p.categoria)}${p.equipo ? ` · ${p.equipo}` : ""}`}
                submeta={p.rareza || p.descripcion}
                price={`${Number(p.costo || 0).toLocaleString()} pts`}
              />
            ))
          )}
        </div>
      </section>

      {pubModalOpen && (
        <div className="adm-store-modal-backdrop" onClick={closePublishModal}>
          <div className="adm-store-modal is-large" onClick={e => e.stopPropagation()}>
            <div className="adm-store-modal-head">
              <div>
                <h3>Publicar producto</h3>
                <p>Elige cualquier objeto de la tienda y publícalo en marketplace.</p>
              </div>
              <button onClick={closePublishModal}>×</button>
            </div>

            <div className="adm-store-modal-body">
              <input
                className="adm-store-input"
                placeholder="Buscar producto..."
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
              />

              <div className="adm-store-picker">
                {modalProductos.length === 0 ? (
                  <div className="adm-store-empty">No se encontraron productos.</div>
                ) : (
                  modalProductos.map(p => (
                    <AdminObjectCard
                      key={p.id_producto}
                      compact
                      item={p}
                      eyebrow={`Producto #${p.id_producto}`}
                      title={p.nombre}
                      meta={`${tipoLabel(p.tipo)} · ${categoriaLabel(p.categoria)}${p.equipo ? ` · ${p.equipo}` : ""}`}
                      submeta={p.rareza}
                      price={`${Number(p.costo || 0).toLocaleString()} pts`}
                      onClick={() => {
                        setSelectedProd(p);
                        if (!pubPrecio) {
                          setPubPrecio(String(Math.max(1, Math.round(Number(p.costo || 1) * 0.8))));
                        }
                      }}
                      status={
                        selectedProd?.id_producto === p.id_producto
                          ? { label: "Seleccionado", className: "is-active" }
                          : undefined
                      }
                    />
                  ))
                )}
              </div>

              <label className="adm-store-label">Precio de venta</label>
              <input
                className="adm-store-input"
                type="number"
                min={1}
                value={pubPrecio}
                onChange={e => setPubPrecio(e.target.value)}
                placeholder="Ej: 800"
              />

              {pubError && <p className="adm-store-error">{pubError}</p>}
            </div>

            <div className="adm-store-modal-foot">
              <button className="adm-store-secondary" onClick={closePublishModal}>
                Cancelar
              </button>
              <button
                className="adm-store-primary"
                disabled={publishing || !selectedProd || !pubPrecio || Number(pubPrecio) <= 0}
                onClick={handlePublicar}
              >
                {publishing ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingListado && (
        <div className="adm-store-modal-backdrop" onClick={() => setEditingListado(null)}>
          <div className="adm-store-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-store-modal-head">
              <div>
                <h3>Editar precio</h3>
                <p>{editingListado.nombre || `Listado #${editingListado.id_listado}`}</p>
              </div>
              <button onClick={() => setEditingListado(null)}>×</button>
            </div>

            <div className="adm-store-modal-body">
              <label className="adm-store-label">Nuevo precio</label>
              <input
                className="adm-store-input"
                type="number"
                min={1}
                value={editPrecio}
                onChange={e => setEditPrecio(e.target.value)}
                autoFocus
              />
              {editError && <p className="adm-store-error">{editError}</p>}
            </div>

            <div className="adm-store-modal-foot">
              <button className="adm-store-secondary" onClick={() => setEditingListado(null)}>
                Cancelar
              </button>
              <button className="adm-store-primary" disabled={savingEdit} onClick={handleEditPrecio}>
                {savingEdit ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="adm-store-modal-backdrop" onClick={() => setConfirmCancel(null)}>
          <div className="adm-store-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-store-modal-head">
              <div>
                <h3>Cancelar listado</h3>
                <p>Dejará de aparecer como activo.</p>
              </div>
              <button onClick={() => setConfirmCancel(null)}>×</button>
            </div>

            <div className="adm-store-confirm">
              ¿Seguro que quieres cancelar <strong>{confirmCancel.nombre || `#${confirmCancel.id_listado}`}</strong>?
            </div>

            <div className="adm-store-modal-foot">
              <button className="adm-store-secondary" onClick={() => setConfirmCancel(null)}>
                Volver
              </button>
              <button className="adm-store-danger" disabled={canceling} onClick={handleCancelar}>
                {canceling ? "Cancelando..." : "Cancelar listado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}