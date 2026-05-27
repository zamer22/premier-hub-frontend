import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminTienda.css";

import type {
  AdminProduct,
  AdminListado,
  ListadoEstadoFilter,
  ProductCategoriaFilter,
} from "../../components/admin/types";
import {
  EMPTY_NEW_PRODUCT,
  LISTADO_ESTADO_LABEL,
} from "../../components/admin/constants";
import {
  tipoLabel,
  categoriaLabel,
  formatDate,
  getErrorMessage,
} from "../../components/admin/utils";
import ProductThumb from "../../components/admin/ProductThumb";
import ChipGroup from "../../components/admin/ChipGroup";
import CreateProductModal from "../../components/admin/modals/CreateProductModal";
import PublishProductModal from "../../components/admin/modals/PublishProductModal";
import EditPriceModal from "../../components/admin/modals/EditPriceModal";
import ConfirmCancelModal from "../../components/admin/modals/ConfirmCancelModal";

const API_URL = import.meta.env.VITE_API_URL || "";

interface AdminTiendaProps {
  user: { id_usuario: number };
}

export default function AdminTienda({ user }: AdminTiendaProps) {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [listados, setListados] = useState<AdminListado[]>([]);
  const [productos, setProductos] = useState<AdminProduct[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [marketSearch, setMarketSearch] = useState("");
  const [marketEstado, setMarketEstado] = useState<ListadoEstadoFilter>("todos");
  const [marketTipo, setMarketTipo] = useState("todos");

  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoria, setCatalogCategoria] = useState<ProductCategoriaFilter>("todos");
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

  const [editingListado, setEditingListado] = useState<AdminListado | null>(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [confirmCancel, setConfirmCancel] = useState<AdminListado | null>(null);
  const [canceling, setCanceling] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  // Wrapper de fetch para /api/admin/*. El backend identifica al admin por la cookie
  // de sesion firmada (middleware requireAdmin) — ya no se envia id_usuario por el cliente.
  const adminFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

      const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
      const url = `${baseUrl}/api/admin${path}`;

      const res = await fetch(url, { ...init, credentials: "include", headers });
      const text = await res.text();

      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Ruta no encontrada o servidor equivocado: ${url}`);
      }

      if (!res.ok || !json.success) throw new Error(json.error || "Error de servidor");
      return json;
    },
    [],
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
      const json = await adminFetch("/productos", { method: "POST", body: JSON.stringify(payload) });
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
      setListados((prev) => prev.map((l) => (l.id_listado === json.data.id_listado ? json.data : l)));
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
      await adminFetch(`/marketplace/cancelar/${confirmCancel.id_listado}`, { method: "DELETE" });
      setListados((prev) =>
        prev.map((l) => (l.id_listado === confirmCancel.id_listado ? { ...l, estado: "cancelado" } : l)),
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
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
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
        <div><span>Catálogo</span><b>{stats.catalogo}</b></div>
        <div><span>Perfil</span><b>{stats.perfil}</b></div>
        <div><span>Reales</span><b>{stats.real}</b></div>
        <div><span>Activos</span><b>{stats.activos}</b></div>
        <div><span>Vendidos</span><b>{stats.vendidos}</b></div>
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
            onChange={(v) => setMarketEstado(v as ListadoEstadoFilter)}
            items={[
              { key: "todos", label: "Todos", count: listados.length },
              { key: "activo", label: "Activos", count: listados.filter((l) => l.estado === "activo").length },
              { key: "vendido", label: "Vendidos", count: listados.filter((l) => l.estado === "vendido").length },
              { key: "cancelado", label: "Cancelados", count: listados.filter((l) => l.estado === "cancelado").length },
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
                      {LISTADO_ESTADO_LABEL[l.estado] || l.estado}
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
            onChange={(v) => setCatalogCategoria(v as ProductCategoriaFilter)}
            items={[
              { key: "todos", label: "Todo", count: productos.length },
              { key: "perfil", label: "Perfil", count: productos.filter((p) => p.categoria === "perfil").length },
              { key: "real", label: "Reales", count: productos.filter((p) => p.categoria === "real").length },
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
        <CreateProductModal
          form={newProduct}
          onChange={setNewProduct}
          error={createError}
          saving={creating}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {publishOpen && (
        <PublishProductModal
          productos={productosParaPublicar}
          search={publishSearch}
          onSearchChange={setPublishSearch}
          selectedId={selectedProductId}
          onSelect={setSelectedProductId}
          precio={publishPrice}
          onPrecioChange={setPublishPrice}
          error={publishError}
          saving={publishing}
          onClose={() => setPublishOpen(false)}
          onSubmit={handlePublicar}
        />
      )}

      {editingListado && (
        <EditPriceModal
          listado={editingListado}
          precio={editPrecio}
          onPrecioChange={setEditPrecio}
          error={editError}
          saving={savingEdit}
          onClose={() => setEditingListado(null)}
          onSubmit={handleEditPrecio}
        />
      )}

      {confirmCancel && (
        <ConfirmCancelModal
          listado={confirmCancel}
          saving={canceling}
          onClose={() => setConfirmCancel(null)}
          onConfirm={handleCancelListado}
        />
      )}
    </div>
  );
}
