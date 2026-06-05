import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  id_producto?: number | null;
  precio: number;
  estado: "activo" | "vendido" | "cancelado";
  created_at?: string;
  fecha_creacion?: string;
  fecha_venta?: string | null;
  id_comprador?: number | null;
  nombre?: string | null;
  descripcion?: string | null;
  costo?: number | null;
  stock?: number | null;
  imagen?: string | null;
  css?: string | null;
  tipo?: string | null;
  rareza?: string | null;
  categoria?: string | null;
  equipo?: string | null;
  es_nuevo?: boolean | null;
  es_de_liga?: boolean | null;
  id_temporada?: number | null;
  vendedor_nickname?: string | null;
}

interface AdminUser {
  id_usuario?: number | string | null;
  id?: number | string | null;
  usuario?: { id_usuario?: number | string | null } | null;
  profile?: { id_usuario?: number | string | null } | null;
  perfil?: { id_usuario?: number | string | null } | null;
}

interface AdminTiendaProps {
  user: AdminUser | null | undefined;
}

type EstadoFilter = "todos" | "activo" | "vendido" | "cancelado";
type ToastTone = "success" | "error" | "warning";

type ToastAction = {
  label: string;
  id_listado: number;
};

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
  publicarMarketplace: false,
  precioMarketplace: "",
};

const EMPTY_EDIT_PRODUCT = {
  precio: "",
  nombre: "",
  descripcion: "",
  costo: "",
  stock: "",
  imagen: "",
  categoria: "perfil" as "perfil" | "real",
  tipo: "",
  equipo: "",
  rareza: "",
  id_temporada: "",
  es_nuevo: false,
  es_de_liga: false,
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

function resolveAdminId(user: AdminUser | null | undefined) {
  const rawId =
    user?.id_usuario ??
    user?.usuario?.id_usuario ??
    user?.profile?.id_usuario ??
    user?.perfil?.id_usuario ??
    user?.id;

  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
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
  const toastTimerRef = useRef<number | null>(null);

  const [toast, setToast] = useState<{
    msg: string;
    ok: boolean;
    title?: string;
    tone: ToastTone;
    action?: ToastAction;
  } | null>(null);

  const [listados, setListados] = useState<Listado[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);

  const [marketSearch, setMarketSearch] = useState("");
  const [marketEstado, setMarketEstado] = useState<EstadoFilter>("todos");
  const [marketTipo, setMarketTipo] = useState("todos");

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishSearch, setPublishSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [publishPrice, setPublishPrice] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_NEW_PRODUCT);
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingListado, setEditingListado] = useState<Listado | null>(null);
  const [editProduct, setEditProduct] = useState(EMPTY_EDIT_PRODUCT);
  const [editProductImageFile, setEditProductImageFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [confirmCancel, setConfirmCancel] = useState<Listado | null>(null);
  const [canceling, setCanceling] = useState(false);

  const adminId = useMemo(() => resolveAdminId(user), [user]);

  const showToast = useCallback(
    (
      msg: string,
      ok = true,
      title?: string,
      tone?: ToastTone,
      action?: ToastAction,
    ) => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      setToast({ msg, ok, title, tone: tone || (ok ? "success" : "error"), action });

      toastTimerRef.current = window.setTimeout(
        () => setToast(null),
        action ? 6500 : 2800,
      );
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const adminFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      if (!adminId) {
        throw new Error("No se encontró id_usuario del admin.");
      }

      const joiner = path.includes("?") ? "&" : "?";
      const pathWithAdmin = `${path}${joiner}id_usuario=${encodeURIComponent(
        String(adminId),
      )}`;

      const headers = new Headers(init.headers);

      if (
        init.body &&
        !(init.body instanceof FormData) &&
        !(init.body instanceof File) &&
        !(init.body instanceof Blob) &&
        !headers.has("Content-Type")
      ) {
        headers.set("Content-Type", "application/json");
      }

      headers.set("x-id-usuario", String(adminId));

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
    [adminId],
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
  }, [adminFetch, showToast]);

  const fetchCatalogo = useCallback(async () => {
    try {
      const json = await adminFetch("/productos");
      setProductos(json.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), false);
    }
  }, [adminFetch, showToast]);

  useEffect(() => {
    if (!adminId) {
      setLoadingMarket(false);
      showToast(
        "No se encontró id_usuario del admin. Revisa que el componente reciba el usuario completo.",
        false,
        "Sesión incompleta",
      );
      return;
    }

    fetchListados();
    fetchCatalogo();
  }, [adminId, fetchListados, fetchCatalogo, showToast]);

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
    publicaciones: listados.length,
    activos: listados.filter((l) => l.estado === "activo").length,
    vendidos: listados.filter((l) => l.estado === "vendido").length,
    cancelados: listados.filter((l) => l.estado === "cancelado").length,
    ventasPts: listados
      .filter((l) => l.estado === "vendido")
      .reduce((total, l) => total + Number(l.precio || 0), 0),
  };

  const openCreate = () => {
    setNewProduct(EMPTY_NEW_PRODUCT);
    setNewProductImageFile(null);
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

  const openEdit = (listado: Listado) => {
    setEditingListado(listado);
    setEditProduct({
      precio: String(listado.precio || ""),
      nombre: listado.nombre || "",
      descripcion: listado.descripcion || "",
      costo: String(listado.costo ?? ""),
      stock: String(listado.stock ?? ""),
      imagen: listado.imagen || "",
      categoria: listado.categoria === "real" ? "real" : "perfil",
      tipo: listado.tipo || "",
      equipo: listado.equipo || "",
      rareza: listado.rareza || "",
      id_temporada: listado.id_temporada ? String(listado.id_temporada) : "",
      es_nuevo: !!listado.es_nuevo,
      es_de_liga: !!listado.es_de_liga,
    });
    setEditProductImageFile(null);
    setEditError("");
  };

  const handleToastDeleteListado = async (id_listado: number) => {
    setCanceling(true);

    try {
      const json = await adminFetch(`/marketplace/cancelar/${id_listado}`, {
        method: "DELETE",
      });

      setListados((prev) =>
        json.removed
          ? prev.filter((l) => l.id_listado !== id_listado)
          : prev.map((l) =>
              l.id_listado === id_listado ? { ...l, estado: "cancelado" } : l,
            ),
      );

      showToast(
        json.removed
          ? "Se eliminó el listado y su inventario asociado."
          : "El listado quedó cancelado.",
        true,
        json.removed ? "Listado eliminado" : "Listado cancelado",
      );
    } catch (error) {
      showToast(getErrorMessage(error), false);
    } finally {
      setCanceling(false);
    }
  };

  const handleCreateProduct = async () => {
    const precioMarketplace = Number(newProduct.precioMarketplace);

    if (!newProduct.nombre.trim() || newProduct.costo === "" || Number(newProduct.costo) < 0) {
      setCreateError("Nombre y costo válido son requeridos.");
      return;
    }

    if (
      newProduct.publicarMarketplace &&
      (!newProduct.precioMarketplace ||
        !Number.isFinite(precioMarketplace) ||
        precioMarketplace <= 0)
    ) {
      setCreateError("Agrega un precio válido para publicar en marketplace.");
      return;
    }

    if (!adminId) {
      setCreateError("No se encontró id_usuario del admin.");
      return;
    }

    setCreateError("");
    setCreating(true);

    try {
      let imagenUrl = newProduct.imagen.trim() || null;

      if (newProductImageFile) {
        const formData = new FormData();
        formData.append("imagen", newProductImageFile);

        const uploadJson = await adminFetch("/productos/imagen", {
          method: "POST",
          body: formData,
        });

        imagenUrl = uploadJson.data.publicUrl;
      }

      const payload = {
        nombre: newProduct.nombre.trim(),
        descripcion: newProduct.descripcion.trim() || null,
        costo: Number(newProduct.costo),
        stock: Number(newProduct.stock || 0),
        imagen: imagenUrl,
        es_nuevo: newProduct.es_nuevo,
        categoria: newProduct.categoria,
        tipo: newProduct.tipo || null,
        equipo: newProduct.equipo.trim() || null,
        rareza: newProduct.rareza.trim() || null,
        id_temporada: newProduct.id_temporada ? Number(newProduct.id_temporada) : null,
        css: null,
        es_de_liga: newProduct.es_de_liga,
      };

      const json = await adminFetch("/productos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const createdProduct = json.data as Product;
      setProductos((prev) => [createdProduct, ...prev]);

      if (newProduct.publicarMarketplace) {
        try {
          const publishJson = await adminFetch("/marketplace/publicar", {
            method: "POST",
            body: JSON.stringify({
              id_admin: adminId,
              id_producto: Number(createdProduct.id_producto),
              precio: precioMarketplace,
            }),
          });

          const publishedListado = publishJson.data as Listado;
          const publishedId = Number(publishedListado.id_listado);

          setListados((prev) => [publishedListado, ...prev]);

          showToast(
            "Ya aparece como publicación activa en marketplace.",
            true,
            "Objeto creado y publicado",
            "success",
            Number.isInteger(publishedId) && publishedId > 0
              ? { label: "Borrar listado", id_listado: publishedId }
              : undefined,
          );
        } catch (error) {
          showToast(
            `No se pudo publicar: ${getErrorMessage(error)}`,
            false,
            "Objeto creado",
            "warning",
          );
        }
      } else {
        showToast("Se agregó al catálogo base de la tienda.", true, "Objeto creado");
      }

      setCreateOpen(false);
    } catch (error) {
      setCreateError(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handlePublicar = async () => {
    const productoId = Number(selectedProductId);
    const precioNum = Number(publishPrice);

    if (!adminId) {
      setPublishError("No se encontró id_usuario del admin.");
      return;
    }

    if (
      !Number.isInteger(productoId) ||
      productoId <= 0 ||
      !Number.isFinite(precioNum) ||
      precioNum <= 0
    ) {
      setPublishError("Selecciona un producto y un precio mayor a 0.");
      return;
    }

    setPublishError("");
    setPublishing(true);

    try {
      const json = await adminFetch("/marketplace/publicar", {
        method: "POST",
        body: JSON.stringify({
          id_admin: adminId,
          id_producto: productoId,
          precio: precioNum,
        }),
      });

      const publishedListado = json.data as Listado;
      const publishedId = Number(publishedListado.id_listado);

      setListados((prev) => [publishedListado, ...prev]);
      setPublishOpen(false);

      showToast(
        "El producto ya aparece activo en marketplace.",
        true,
        "Publicado",
        "success",
        Number.isInteger(publishedId) && publishedId > 0
          ? { label: "Borrar listado", id_listado: publishedId }
          : undefined,
      );
    } catch (error) {
      setPublishError(getErrorMessage(error));
    } finally {
      setPublishing(false);
    }
  };

  const handleEditProducto = async () => {
    if (!editingListado || !editProduct.precio || Number(editProduct.precio) <= 0) {
      setEditError("Precio inválido.");
      return;
    }

    if (!editProduct.nombre.trim()) {
      setEditError("Nombre requerido.");
      return;
    }

    setEditError("");
    setSavingEdit(true);

    try {
      let imagenUrl = editProduct.imagen.trim() || null;

      if (editProductImageFile) {
        const formData = new FormData();
        formData.append("imagen", editProductImageFile);

        const uploadJson = await adminFetch("/productos/imagen", {
          method: "POST",
          body: formData,
        });

        imagenUrl = uploadJson.data.publicUrl;
      }

      const json = await adminFetch(`/marketplace/listados/${editingListado.id_listado}`, {
        method: "PUT",
        body: JSON.stringify({
          precio: Number(editProduct.precio),
          nombre: editProduct.nombre.trim(),
          descripcion: editProduct.descripcion.trim() || null,
          costo: editProduct.costo === "" ? 0 : Number(editProduct.costo),
          stock: editProduct.stock === "" ? 0 : Number(editProduct.stock),
          imagen: imagenUrl,
          categoria: editProduct.categoria,
          tipo: editProduct.tipo || null,
          equipo: editProduct.equipo.trim() || null,
          rareza: editProduct.rareza.trim() || null,
          id_temporada: editProduct.id_temporada ? Number(editProduct.id_temporada) : null,
          es_nuevo: editProduct.es_nuevo,
          es_de_liga: editProduct.es_de_liga,
        }),
      });

      setListados((prev) =>
        prev.map((l) => (l.id_listado === json.data.id_listado ? json.data : l)),
      );

      setEditingListado(null);
      showToast("Datos del listado actualizados", true, "Actualizado");
    } catch (error) {
      setEditError(getErrorMessage(error));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelListado = async () => {
    if (!confirmCancel) return;

    const listadoCancelado = confirmCancel;

    setCanceling(true);

    try {
      const json = await adminFetch(`/marketplace/cancelar/${listadoCancelado.id_listado}`, {
        method: "DELETE",
      });

      setListados((prev) =>
        json.removed
          ? prev.filter((l) => l.id_listado !== listadoCancelado.id_listado)
          : prev.map((l) =>
              l.id_listado === listadoCancelado.id_listado
                ? { ...l, estado: "cancelado" }
                : l,
            ),
      );

      setConfirmCancel(null);

      showToast(
        json.removed
          ? "Se eliminó el listado y su inventario asociado."
          : "El listado quedó cancelado.",
        true,
        json.removed ? "Listado eliminado" : "Listado cancelado",
      );
    } catch (error) {
      showToast(getErrorMessage(error), false);
    } finally {
      setCanceling(false);
    }
  };

  const createButtonText = creating
    ? newProduct.publicarMarketplace
      ? "Creando y publicando..."
      : "Creando..."
    : newProduct.publicarMarketplace
      ? "Crear y publicar"
      : "Crear objeto";

  return (
    <div className="adm-store">
      {toast && (
        <div
          className={`adm-store-toast is-${toast.tone}`}
          role={toast.ok ? "status" : "alert"}
          aria-live="polite"
        >
          <span className="adm-store-toast-icon">
            {toast.tone === "warning" ? "!" : toast.ok ? "✓" : "✕"}
          </span>

          <div className="adm-store-toast-copy">
            <b>{toast.title || (toast.ok ? "Listo" : "No se pudo completar")}</b>
            <small>{toast.msg}</small>

            {toast.action && (
              <button
                type="button"
                className="adm-store-toast-action"
                onClick={() => {
                  if (toast.action) {
                    handleToastDeleteListado(toast.action.id_listado);
                  }
                }}
                disabled={canceling}
              >
                {canceling ? "Borrando..." : toast.action.label}
              </button>
            )}
          </div>
        </div>
      )}

      <section className="adm-store-hero">
        <div>
          <h2>Marketplace</h2>
          <p>Gestiona publicaciones, precios y estado de los objetos en marketplace.</p>
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
          <span>Publicaciones</span>
          <b>{stats.publicaciones}</b>
        </div>
        <div>
          <span>Activas</span>
          <b>{stats.activos}</b>
        </div>
        <div>
          <span>Vendidas</span>
          <b>{stats.vendidos}</b>
        </div>
        <div>
          <span>Canceladas</span>
          <b>{stats.cancelados}</b>
        </div>
        <div>
          <span>Ventas pts</span>
          <b>{stats.ventasPts.toLocaleString()}</b>
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
                      <button type="button" onClick={() => openEdit(l)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => setConfirmCancel(l)}
                      >
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

              <label className="adm-store-field is-wide">
                <span>Imagen desde computadora</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setNewProductImageFile(e.target.files?.[0] || null)}
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

                <label>
                  <input
                    type="checkbox"
                    checked={newProduct.publicarMarketplace}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        publicarMarketplace: e.target.checked,
                      }))
                    }
                  />
                  Publicar en marketplace
                </label>
              </div>

              {newProduct.publicarMarketplace && (
                <label className="adm-store-field is-wide">
                  <span>Precio en marketplace</span>
                  <input
                    type="number"
                    value={newProduct.precioMarketplace}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        precioMarketplace: e.target.value,
                      }))
                    }
                    placeholder="Ej. 2500"
                  />
                </label>
              )}
            </div>

            {createError && <p className="adm-store-error">{createError}</p>}

            <div className="adm-store-modal-actions">
              <button
                type="button"
                className="adm-store-btn is-ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="adm-store-btn is-primary"
                onClick={handleCreateProduct}
                disabled={creating}
              >
                {createButtonText}
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
                  className={
                    selectedProductId === p.id_producto
                      ? "adm-store-pick is-selected"
                      : "adm-store-pick"
                  }
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
              <button
                type="button"
                className="adm-store-btn is-ghost"
                onClick={() => setPublishOpen(false)}
              >
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
          <div className="adm-store-modal">
            <div className="adm-store-modal-head">
              <div>
                <h3>Editar producto</h3>
                <p>{editingListado.nombre}</p>
              </div>
              <button type="button" onClick={() => setEditingListado(null)}>
                ×
              </button>
            </div>

            <div className="adm-store-form-grid">
              <label className="adm-store-field">
                <span>Precio marketplace</span>
                <input
                  type="number"
                  value={editProduct.precio}
                  onChange={(e) => setEditProduct((p) => ({ ...p, precio: e.target.value }))}
                />
              </label>

              <label className="adm-store-field">
                <span>Nombre</span>
                <input
                  value={editProduct.nombre}
                  onChange={(e) => setEditProduct((p) => ({ ...p, nombre: e.target.value }))}
                />
              </label>

              <label className="adm-store-field">
                <span>Costo</span>
                <input
                  type="number"
                  value={editProduct.costo}
                  onChange={(e) => setEditProduct((p) => ({ ...p, costo: e.target.value }))}
                />
              </label>

              <label className="adm-store-field">
                <span>Stock</span>
                <input
                  type="number"
                  value={editProduct.stock}
                  onChange={(e) => setEditProduct((p) => ({ ...p, stock: e.target.value }))}
                />
              </label>

              <label className="adm-store-field">
                <span>Categoría</span>
                <select
                  value={editProduct.categoria}
                  onChange={(e) =>
                    setEditProduct((p) => ({
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
                  value={editProduct.tipo}
                  onChange={(e) => setEditProduct((p) => ({ ...p, tipo: e.target.value }))}
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
                <span>Equipo</span>
                <input
                  value={editProduct.equipo}
                  onChange={(e) => setEditProduct((p) => ({ ...p, equipo: e.target.value }))}
                />
              </label>

              <label className="adm-store-field">
                <span>Rareza</span>
                <input
                  value={editProduct.rareza}
                  onChange={(e) => setEditProduct((p) => ({ ...p, rareza: e.target.value }))}
                />
              </label>

              <label className="adm-store-field">
                <span>Temporada ID</span>
                <input
                  type="number"
                  value={editProduct.id_temporada}
                  onChange={(e) =>
                    setEditProduct((p) => ({ ...p, id_temporada: e.target.value }))
                  }
                />
              </label>

              <label className="adm-store-field is-wide">
                <span>Descripción</span>
                <textarea
                  value={editProduct.descripcion}
                  onChange={(e) =>
                    setEditProduct((p) => ({ ...p, descripcion: e.target.value }))
                  }
                />
              </label>

              <label className="adm-store-field is-wide">
                <span>Imagen URL</span>
                <input
                  value={editProduct.imagen}
                  onChange={(e) => setEditProduct((p) => ({ ...p, imagen: e.target.value }))}
                />
              </label>

              <label className="adm-store-field is-wide">
                <span>Nueva imagen desde computadora</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setEditProductImageFile(e.target.files?.[0] || null)}
                />
              </label>

              <div className="adm-store-checks is-wide">
                <label>
                  <input
                    type="checkbox"
                    checked={editProduct.es_nuevo}
                    onChange={(e) =>
                      setEditProduct((p) => ({ ...p, es_nuevo: e.target.checked }))
                    }
                  />
                  Nuevo
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={editProduct.es_de_liga}
                    onChange={(e) =>
                      setEditProduct((p) => ({ ...p, es_de_liga: e.target.checked }))
                    }
                  />
                  De liga
                </label>
              </div>
            </div>

            {editError && <p className="adm-store-error">{editError}</p>}

            <div className="adm-store-modal-actions">
              <button
                type="button"
                className="adm-store-btn is-ghost"
                onClick={() => setEditingListado(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="adm-store-btn is-primary"
                onClick={handleEditProducto}
                disabled={savingEdit}
              >
                {savingEdit ? "Guardando..." : "Guardar cambios"}
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
              <button
                type="button"
                className="adm-store-btn is-ghost"
                onClick={() => setConfirmCancel(null)}
              >
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