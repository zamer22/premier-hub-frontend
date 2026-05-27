import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Tienda.css";

import { PageHeader, Tabs, EmptyState } from "../../components/ui";

import type {
  Producto, InventarioItem, Listado, Direccion, Pedido, Comentario,
  Variante, NewDireccionForm, ConfirmAction, SubTab, MarketView, TiendaUser,
} from "../../components/tienda/types";
import { API_URL, EMPTY_DIRECCION, TIPOS_REAL, ESTADO_PEDIDO_LABEL } from "../../components/tienda/constants";
import { tipoLabel } from "../../components/tienda/utils";

import ProductVisual from "../../components/tienda/ProductVisual";
import ProductCard from "../../components/tienda/ProductCard";
import ListingCard from "../../components/tienda/ListingCard";
import PublishModal from "../../components/tienda/modals/PublishModal";
import ConfirmModal from "../../components/tienda/modals/ConfirmModal";
import SuccessModal from "../../components/tienda/modals/SuccessModal";
import ProductDetailModal from "../../components/tienda/modals/ProductDetailModal";
import CheckoutModal from "../../components/tienda/modals/CheckoutModal";
import PedidoModal from "../../components/tienda/modals/PedidoModal";

// Fix de Leaflet con Vite: sin esto los iconos de marcadores no cargan.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface TiendaProps {
  user: TiendaUser;
  onSaldoChange: (nuevoSaldo: number) => void;
}

export default function Tienda({ user, onSaldoChange }: TiendaProps) {
  const [subTab, setSubTab] = useState<SubTab>("perfil");
  const [marketView, setMarketView] = useState<MarketView>("explorar");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroPerfilTipo, setFiltroPerfilTipo] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [misItems, setMisItems] = useState<InventarioItem[]>([]);
  const [listados, setListados] = useState<Listado[]>([]);
  const [misListados, setMisListados] = useState<Listado[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);

  const [productModal, setProductModal] = useState<Producto | null>(null);
  const [selectedVariante, setSelectedVariante] = useState<Variante | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [successPedidoId, setSuccessPedidoId] = useState<number | null>(null);
  const [publishingItem, setPublishingItem] = useState<{ item: InventarioItem; precio: string } | null>(null);
  const [pedidoModal, setPedidoModal] = useState<Pedido | null>(null);

  const [checkoutAction, setCheckoutAction] = useState<{ producto: Producto; variante: Variante | null } | null>(null);
  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);
  const [showNewDireccion, setShowNewDireccion] = useState(false);
  const [newDireccion, setNewDireccion] = useState<NewDireccionForm>(EMPTY_DIRECCION);
  const [savingDireccion, setSavingDireccion] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [editingPedidoDireccion, setEditingPedidoDireccion] = useState(false);
  const [pedidoDireccionForm, setPedidoDireccionForm] = useState<NewDireccionForm>(EMPTY_DIRECCION);
  const [savingPedidoDireccion, setSavingPedidoDireccion] = useState(false);

  const [productComments, setProductComments] = useState<Comentario[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newReview, setNewReview] = useState({ calificacion: 5, comentario: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const saldo = Number(user.dinero) || 0;
  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { setSelectedVariante(null); }, [productModal?.id_producto]);

  useEffect(() => { setEditingPedidoDireccion(false); }, [pedidoModal?.id_pedido]);

  // Bloquea el scroll del body mientras haya un modal abierto.
  useEffect(() => {
    const hasModal = !!productModal || !!confirmAction || !!successMsg || !!publishingItem || !!checkoutAction || !!pedidoModal;
    document.body.style.overflow = hasModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [productModal, confirmAction, successMsg, publishingItem, checkoutAction, pedidoModal]);

  // /api/tienda/productos-v2?categoria=cat
  const fetchProductos = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/productos-v2?categoria=${cat}`);
      const d = await r.json();
      if (d.success) setProductos(d.data);
    } catch { } finally { setLoading(false); }
  }, []);

  // /api/tienda/mis-items/:id — excluye avatares
  const fetchMisItems = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/mis-items/${user.id_usuario}`);
      const d = await r.json();
      if (d.success) setMisItems((d.data || []).filter((i: InventarioItem) => i.tipo !== "avatar"));
    } catch { }
  }, [user.id_usuario]);

  // /api/marketplace/listados — filtra los del propio usuario en cliente
  const fetchListados = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/marketplace/listados`);
      const d = await r.json();
      if (d.success) setListados(d.data.filter((l: Listado) => l.id_vendedor !== user.id_usuario));
    } catch { }
  }, [user.id_usuario]);

  // /api/marketplace/listados?mios=id
  const fetchMisListados = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/marketplace/listados?mios=${user.id_usuario}`);
      const d = await r.json();
      if (d.success) setMisListados(d.data);
    } catch { }
  }, [user.id_usuario]);

  const fetchPedidos = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/pedidos/${user.id_usuario}`);
      const d = await r.json();
      if (d.success) setPedidos(d.data);
    } catch { }
  }, [user.id_usuario]);

  // /api/tienda/comentarios/:id — solo se llama cuando productModal es de categoria real
  const fetchComentarios = useCallback(async (id_producto: number) => {
    setLoadingComments(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/comentarios/${id_producto}`);
      const d = await r.json();
      if (d.success) setProductComments(d.data);
    } catch { } finally { setLoadingComments(false); }
  }, []);

  useEffect(() => {
    setBusqueda(""); setFiltroTipo("todos"); setFiltroPerfilTipo("todos");
    if (subTab === "perfil") { fetchProductos("perfil"); fetchMisItems(); }
    else if (subTab === "real") { fetchProductos("real"); fetchPedidos(); }
    else if (subTab === "pedidos") { fetchPedidos(); }
    else { fetchListados(); fetchMisItems(); fetchMisListados(); }
  }, [subTab, fetchProductos, fetchListados, fetchMisItems, fetchMisListados, fetchPedidos]);

  useEffect(() => {
    if (productModal?.categoria === "real") {
      fetchComentarios(productModal.id_producto);
      setNewReview({ calificacion: 5, comentario: "" });
    } else {
      setProductComments([]);
    }
  }, [productModal, fetchComentarios]);

  const ownedIds = new Set(misItems.map(i => i.id_producto));
  const perfilProductos = productos.filter(p => p.tipo !== "avatar");
  const perfilTipos = ["todos", ...Array.from(new Set(perfilProductos.map(p => p.tipo)))];
  const perfilFiltrados = perfilProductos.filter(p =>
    (p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.equipo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)) &&
    (filtroPerfilTipo === "todos" || p.tipo === filtroPerfilTipo)
  );
  const productosFiltrados = productos.filter(p => {
    const mb = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.equipo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
    return mb && (filtroTipo === "todos" || p.tipo === filtroTipo);
  });
  const listadosFiltrados = listados.filter(l => {
    const mb = l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (l.equipo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
      l.vendedor_nickname.toLowerCase().includes(busqueda.toLowerCase());
    return mb && (filtroTipo === "todos" || l.tipo === filtroTipo);
  });

  // POST /api/tienda/comprar — con id_direccion crea pedido (real); sin él agrega a inventario (perfil).
  const comprar = async (id_producto: number, nombre: string, id_variante: number | null, id_direccion: number | null = null) => {
    try {
      const res = await fetch(`${API_URL}/api/tienda/comprar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario, id_producto, id_variante, id_direccion }),
      });
      const data = await res.json();
      if (data.success) {
        const nuevoSaldo = data.saldo != null && !isNaN(Number(data.saldo)) ? Number(data.saldo) : saldo;
        onSaldoChange(nuevoSaldo);
        fetchMisItems();
        setProductos(prev => prev.map(p => {
          if (p.id_producto !== id_producto) return p;
          if (id_variante != null && p.variantes)
            return { ...p, variantes: p.variantes.map(v => v.id_variante === id_variante ? { ...v, stock: v.stock - 1 } : v) };
          return { ...p, stock: (p.stock ?? 0) - 1 };
        }));
        setConfirmAction(null); setProductModal(null); setCheckoutAction(null);
        if (id_direccion != null) {
          setSuccessPedidoId(data.id_pedido ?? null);
          setSuccessMsg(`¡${nombre} comprado! Tu pedido ya está en camino. Saldo: ${nuevoSaldo.toLocaleString()} pts.`);
          fetchPedidos();
        } else {
          setSuccessPedidoId(null);
          setSuccessMsg(`¡${nombre} es tuyo! Tu nuevo saldo es ${nuevoSaldo.toLocaleString()} pts.`);
        }
        return true;
      } else { setConfirmAction(null); showToast(data.error, false); return false; }
    } catch { setConfirmAction(null); showToast("Error de conexion", false); return false; }
  };

  // Abre CheckoutModal y precarga las direcciones. Si no hay ninguna, muestra el form de nueva dirección.
  const abrirCheckout = async (producto: Producto, variante: Variante | null) => {
    setCheckoutAction({ producto, variante });
    setShowNewDireccion(false);
    setNewDireccion(EMPTY_DIRECCION);
    try {
      const r = await fetch(`${API_URL}/api/tienda/direcciones/${user.id_usuario}`);
      const d = await r.json();
      if (d.success) {
        setDirecciones(d.data);
        const pred = d.data.find((x: Direccion) => x.es_predeterminada) || d.data[0];
        setSelectedDireccionId(pred?.id_direccion ?? null);
        if (!d.data.length) setShowNewDireccion(true);
      }
    } catch { }
  };

  // POST /api/tienda/direcciones — si es predeterminada, desactiva las demás en cliente también.
  const guardarDireccion = async (): Promise<Direccion | null> => {
    const f = newDireccion;
    if (!f.alias || !f.nombre_destinatario || !f.calle || !f.ciudad) {
      showToast("Completa alias, nombre, calle y ciudad", false);
      return null;
    }
    setSavingDireccion(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/direcciones`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario, ...f }),
      });
      const d = await r.json();
      if (!d.success) { showToast(d.error || "Error guardando dirección", false); return null; }
      setDirecciones(prev => {
        const next = f.es_predeterminada ? prev.map(x => ({ ...x, es_predeterminada: false })) : prev;
        return [d.data, ...next];
      });
      setSelectedDireccionId(d.data.id_direccion);
      setShowNewDireccion(false);
      setNewDireccion(EMPTY_DIRECCION);
      showToast("Dirección guardada", true);
      return d.data;
    } catch { showToast("Error de conexión", false); return null; }
    finally { setSavingDireccion(false); }
  };

  const confirmarPedido = async () => {
    if (!checkoutAction || !selectedDireccionId) return;
    setPlacingOrder(true);
    try {
      await comprar(checkoutAction.producto.id_producto, checkoutAction.producto.nombre, checkoutAction.variante?.id_variante ?? null, selectedDireccionId);
    } finally { setPlacingOrder(false); }
  };

  const eliminarDireccion = async (id_direccion: number) => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/direcciones/${id_direccion}?id_usuario=${user.id_usuario}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) {
        setDirecciones(prev => prev.filter(x => x.id_direccion !== id_direccion));
        if (selectedDireccionId === id_direccion) setSelectedDireccionId(null);
      } else { showToast(d.error || "Error", false); }
    } catch { showToast("Error de conexión", false); }
  };

  const reclamarBonus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tienda/bonus`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario }),
      });
      const data = await res.json();
      if (data.success) { onSaldoChange(Number(data.dinero)); showToast(`+${data.bonus} pts reclamados!`, true); }
      else { showToast(data.error, false); }
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
        setConfirmAction(null); setPublishingItem(null);
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
      if (data.success) { showToast("Publicación cancelada", true); fetchMisListados(); fetchMisItems(); }
      else { showToast(data.error, false); }
    } catch { showToast("Error de conexion", false); }
  };

  const enviarReseña = async () => {
    if (!productModal) return;
    if (newReview.comentario.trim().length < 3) { showToast("El comentario es muy corto", false); return; }
    setSubmittingReview(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/comentarios`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario, id_producto: productModal.id_producto, calificacion: newReview.calificacion, comentario: newReview.comentario.trim() }),
      });
      const d = await r.json();
      if (d.success) { setProductComments(prev => [d.data, ...prev]); setNewReview({ calificacion: 5, comentario: "" }); showToast("Reseña publicada", true); }
      else { showToast(d.error || "Error al publicar", false); }
    } catch { showToast("Error de conexión", false); }
    finally { setSubmittingReview(false); }
  };

  const eliminarReseña = async (id_comentario: number) => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/comentarios/${id_comentario}?id_usuario=${user.id_usuario}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) { setProductComments(prev => prev.filter(c => c.id_comentario !== id_comentario)); showToast("Reseña eliminada", true); }
      else { showToast(d.error || "Error", false); }
    } catch { showToast("Error de conexión", false); }
  };

  const iniciarEditarPedidoDireccion = () => {
    if (!pedidoModal) return;
    const s = pedidoModal.direccion_snapshot || {};
    setPedidoDireccionForm({
      alias: s.alias || "", nombre_destinatario: s.nombre_destinatario || "",
      telefono: s.telefono || "", calle: s.calle || "", ciudad: s.ciudad || "",
      estado: s.estado || "", codigo_postal: s.codigo_postal || "", pais: s.pais || "MX",
      lat: s.lat != null ? Number(s.lat) : (pedidoModal.lat_destino != null ? Number(pedidoModal.lat_destino) : null),
      lng: s.lng != null ? Number(s.lng) : (pedidoModal.lng_destino != null ? Number(pedidoModal.lng_destino) : null),
      es_predeterminada: false,
    });
    setEditingPedidoDireccion(true);
  };

  const guardarPedidoDireccion = async () => {
    if (!pedidoModal) return;
    const f = pedidoDireccionForm;
    if (!f.alias || !f.nombre_destinatario || !f.calle || !f.ciudad) { showToast("Completa alias, nombre, calle y ciudad", false); return; }
    setSavingPedidoDireccion(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/pedido/${pedidoModal.id_pedido}/direccion`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario, ...f }),
      });
      const d = await r.json();
      if (d.success) {
        setPedidoModal(d.data);
        setPedidos(prev => prev.map(p => p.id_pedido === d.data.id_pedido ? d.data : p));
        setEditingPedidoDireccion(false);
        showToast("Dirección actualizada", true);
      } else { showToast(d.error || "No se pudo actualizar", false); }
    } catch { showToast("Error de conexión", false); }
    finally { setSavingPedidoDireccion(false); }
  };

  const modals = createPortal(
    <>
      {toast && (
        <div className={`fixed top-20 right-8 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg z-[9999] text-white ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}
      {publishingItem && (
        <PublishModal
          item={publishingItem.item}
          precio={publishingItem.precio}
          onPrecioChange={(v) => setPublishingItem({ ...publishingItem, precio: v })}
          onContinue={prepararPublicacion}
          onClose={() => setPublishingItem(null)}
        />
      )}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          saldo={saldo}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.kind === "buy-product") comprar(confirmAction.producto.id_producto, confirmAction.producto.nombre, confirmAction.variante?.id_variante ?? null);
            else if (confirmAction.kind === "buy-listing") comprarMarketplace(confirmAction.listado.id_listado, confirmAction.listado.nombre);
            else publicar();
          }}
        />
      )}
      {successMsg && (
        <SuccessModal
          message={successMsg}
          pedidoId={successPedidoId}
          onClose={() => { setSuccessMsg(null); setSuccessPedidoId(null); }}
        />
      )}
      {productModal && (
        <ProductDetailModal
          producto={productModal}
          saldo={saldo}
          isOwned={productModal.categoria === "real"
            ? pedidos.some(p => p.id_producto === productModal.id_producto && p.estado !== "cancelado")
            : ownedIds.has(productModal.id_producto)}
          selectedVariante={selectedVariante}
          onSelectVariante={setSelectedVariante}
          productComments={productComments}
          loadingComments={loadingComments}
          userId={user.id_usuario}
          newReview={newReview}
          onReviewChange={setNewReview}
          submittingReview={submittingReview}
          onSubmitReview={enviarReseña}
          onDeleteReview={eliminarReseña}
          onClose={() => setProductModal(null)}
          onConfirm={setConfirmAction}
          onCheckout={abrirCheckout}
        />
      )}
      {checkoutAction && (
        <CheckoutModal
          producto={checkoutAction.producto}
          variante={checkoutAction.variante}
          saldo={saldo}
          direcciones={direcciones}
          selectedDireccionId={selectedDireccionId}
          onSelectDireccion={setSelectedDireccionId}
          onEliminarDireccion={eliminarDireccion}
          showNewDireccion={showNewDireccion}
          onShowNewDireccion={setShowNewDireccion}
          newDireccion={newDireccion}
          onDireccionChange={setNewDireccion}
          savingDireccion={savingDireccion}
          onGuardarDireccion={guardarDireccion}
          placingOrder={placingOrder}
          onConfirmar={confirmarPedido}
          onClose={() => setCheckoutAction(null)}
          showToast={showToast}
        />
      )}
      {pedidoModal && (
        <PedidoModal
          pedido={pedidoModal}
          editingDireccion={editingPedidoDireccion}
          direccionForm={pedidoDireccionForm}
          onDireccionFormChange={setPedidoDireccionForm}
          savingDireccion={savingPedidoDireccion}
          onIniciarEditar={iniciarEditarPedidoDireccion}
          onGuardarDireccion={guardarPedidoDireccion}
          onCancelarEditar={() => setEditingPedidoDireccion(false)}
          onClose={() => setPedidoModal(null)}
          showToast={showToast}
        />
      )}
    </>,
    document.body
  );

  return (
    <>
      {modals}
      <div>
        <PageHeader
          eyebrow="Fan economy"
          title="Tienda"
          subtitle="Compra con tus puntos"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={reclamarBonus} className="t-bonus-btn">+ 500 pts bonus</button>
              <div className="t-saldo">{saldo.toLocaleString()} pts</div>
            </div>
          }
        />

        <Tabs
          value={subTab}
          onChange={(k) => setSubTab(k as SubTab)}
          items={[
            { key: "perfil", label: "Objetos de Perfil" },
            { key: "real", label: "Objetos Reales" },
            { key: "marketplace", label: "Marketplace" },
            { key: "pedidos", label: "Mis Pedidos" },
          ]}
        />

        {subTab !== "perfil" && subTab !== "pedidos" && (subTab !== "marketplace" || marketView === "explorar") && (
          <div className="flex flex-wrap items-center gap-3 mt-4 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <input type="text" placeholder="Buscar por nombre, equipo..." value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)} className="t-input" />
            </div>
            <div className="flex flex-wrap gap-1">
              {TIPOS_REAL.map(tipo => (
                <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                  className={filtroTipo === tipo ? "t-chip t-chip--active" : "t-chip"}>
                  {tipo === "todos" ? "Todos" : tipoLabel(tipo)}
                </button>
              ))}
            </div>
          </div>
        )}

        {subTab === "perfil" && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mt-4 mb-8">
              <div className="relative flex-1 min-w-[200px]">
                <input type="text" placeholder="Buscar en toda la tienda..." value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)} className="t-input" />
              </div>
              {perfilTipos.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {perfilTipos.map(tipo => (
                    <button key={tipo} onClick={() => setFiltroPerfilTipo(tipo)}
                      className={filtroPerfilTipo === tipo ? "t-chip t-chip--active" : "t-chip"}>
                      {tipo === "todos" ? "Todos" : tipoLabel(tipo)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {loading && <p className="text-muted text-sm">Cargando...</p>}
            <div className="t-grid--perfil">
              {perfilFiltrados.map(p => {
                const owned = ownedIds.has(p.id_producto);
                const canBuy = !owned && Number(p.costo) <= saldo;
                return (
                  <div key={p.id_producto} onClick={() => setProductModal(p)} className="t-card t-card--perfil">
                    <div className="relative">
                      <ProductVisual p={p} height={160} />
                      {owned
                        ? <span className="t-badge t-badge--owned">EN TU PERFIL</span>
                        : p.es_nuevo && <span className="t-badge t-badge--nuevo">NUEVO</span>
                      }
                    </div>
                    <div className="t-card-body">
                      <p className="t-card-meta--sm">{tipoLabel(p.tipo)}{p.equipo ? ` · ${p.equipo}` : ""}</p>
                      <p className="t-card-name">{p.nombre}</p>
                      <div className="t-card-footer">
                        <div>
                          <span className="t-card-price">{Number(p.costo).toLocaleString()}</span>
                          <span className="text-muted text-[0.72rem] ml-1">pts</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); if (canBuy) setConfirmAction({ kind: "buy-product", producto: p, variante: null }); }}
                          disabled={!canBuy} className="t-card-btn t-card-btn--buy">
                          {owned ? "Ya tienes este" : "Comprar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!loading && perfilFiltrados.length === 0 && (
              <p className="text-muted text-center mt-12 text-sm">No se encontraron productos</p>
            )}
          </div>
        )}

        {subTab === "real" && (
          <div>
            {loading ? <p className="text-muted text-sm">Cargando...</p> : productosFiltrados.length === 0
              ? <p className="text-muted text-center mt-8">No se encontraron productos</p>
              : (
                <div className="t-grid">
                  {productosFiltrados.map(p => (
                    <ProductCard key={p.id_producto} p={p} saldo={saldo} badge="OBJETO REAL"
                      onOpenModal={setProductModal}
                      onConfirm={setConfirmAction}
                      onCheckout={abrirCheckout}
                    />
                  ))}
                </div>
              )}
          </div>
        )}

        {subTab === "marketplace" && (
          <div>
            <div className="t-market-toggle">
              {([
                { key: "explorar" as MarketView, label: "Explorar" },
                { key: "mis-items" as MarketView, label: "Mis Items" },
              ]).map((v) => (
                <button key={v.key}
                  onClick={() => { setMarketView(v.key); if (v.key === "mis-items") { fetchMisItems(); fetchMisListados(); } }}
                  className={marketView === v.key ? "t-market-btn t-market-btn--active" : "t-market-btn"}>
                  {v.label}
                </button>
              ))}
            </div>

            {marketView === "explorar" && (
              listadosFiltrados.length === 0
                ? <p className="text-muted text-center mt-8">No hay listados en el marketplace</p>
                : (
                  <div className="t-grid">
                    {listadosFiltrados.map(l => (
                      <ListingCard key={l.id_listado} l={l} saldo={saldo}
                        onBuy={() => setConfirmAction({ kind: "buy-listing", listado: l })}
                      />
                    ))}
                  </div>
                )
            )}

            {marketView === "mis-items" && (
              <div>
                <h3 className="t-text-dark font-bold text-base mb-3">Mi Inventario</h3>
                {misItems.length === 0
                  ? <p className="text-muted text-sm mb-6">No tienes items. Compra algo en la tienda primero.</p>
                  : (
                    <div className="t-grid--inv mb-8">
                      {misItems.map(item => (
                        <div key={item.id_inventario} className="bg-white rounded-xl p-3 shadow-sm flex flex-col gap-1.5">
                          <div className="rounded-lg overflow-hidden">
                            <ProductVisual p={item} height={80} />
                          </div>
                          <p className="t-card-name">{item.nombre}</p>
                          <p className="text-muted text-[0.7rem]">{item.tipo}{item.equipo ? ` · ${item.equipo}` : ""}</p>
                          {item.en_marketplace
                            ? <span className="t-text-accent text-[0.7rem] font-semibold">En marketplace</span>
                            : item.categoria === "perfil"
                              ? <button onClick={() => setPublishingItem({ item, precio: "" })} className="t-card-btn t-card-btn--buy self-start">
                                  Publicar
                                </button>
                              : null
                          }
                        </div>
                      ))}
                    </div>
                  )}

                <h3 className="t-text-dark font-bold text-base mb-3">Mis Publicaciones Activas</h3>
                {misListados.length === 0
                  ? <p className="text-muted text-sm">No tienes publicaciones activas</p>
                  : (
                    <div className="flex flex-col gap-2">
                      {misListados.map(l => (
                        <div key={l.id_listado} className="bg-white rounded-xl px-4 py-3 shadow-sm flex justify-between items-center">
                          <div>
                            <p className="t-card-name">{l.nombre}</p>
                            <p className="text-muted text-[0.75rem]">
                              Precio: <span className="t-text-dark-bold">{l.precio} pts</span>
                              {" · "}Publicado: {new Date(l.fecha_creacion).toLocaleDateString("es-MX")}
                            </p>
                          </div>
                          <button onClick={() => cancelarListado(l.id_listado)} className="t-card-btn t-card-btn--cancel">
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

        {subTab === "pedidos" && (
          <div>
            {pedidos.length === 0
              ? (
                <EmptyState
                  title="Aún no tienes pedidos"
                  description='Compra un objeto real desde la pestaña "Objetos Reales" y aparecerá aquí.'
                />
              )
              : (
                <div className="flex flex-col gap-3">
                  {pedidos.map(p => {
                    return (
                      <div key={p.id_pedido} onClick={() => setPedidoModal(p)} className="t-card t-card--pedido">
                        <div className="t-pedido-card-thumb"
                          style={{ backgroundImage: p.producto?.imagen ? `url(${p.producto.imagen})` : undefined }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="t-pedido-id-badge">#{p.id_pedido}</span>
                              <p className="t-text-dark font-bold text-sm mt-1.5">{p.producto?.nombre || `Producto #${p.id_producto}`}</p>
                              <p className="text-muted text-[0.74rem]">
                                {p.producto?.tipo ? tipoLabel(p.producto.tipo) : ""}{p.variante ? ` · talla ${p.variante.talla}` : ""}
                              </p>
                            </div>
                            <span className="t-status-badge--pedido" data-estado={p.estado}>
                              {ESTADO_PEDIDO_LABEL[p.estado] || p.estado}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1.5">
                            <p className="text-muted text-[0.72rem]">{new Date(p.fecha_pedido).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            <p className="t-text-accent font-extrabold text-sm">{Number(p.costo).toLocaleString()} pts</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}
      </div>
    </>
  );
}
