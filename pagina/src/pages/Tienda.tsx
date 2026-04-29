import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons cuando se usa bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_MAP_CENTER: [number, number] = [19.4326, -99.1332]; // CDMX

/* ── Types ── */
interface Variante {
  id_variante: number; talla: string; stock: number;
}
interface Producto {
  id_producto: number; nombre: string; costo: string; tipo: string;
  stock: number; es_nuevo: boolean; equipo: string | null; imagen: string | null;
  temporada_nombre?: string; temporada_fin?: string; categoria?: string;
  descripcion?: string | null;
  variantes?: Variante[];
}
interface InventarioItem extends Producto {
  id_inventario: number; fecha_compra: string; en_marketplace: boolean;
  talla?: string | null;
}
interface Listado {
  id_listado: number; id_vendedor: number; precio: string;
  nombre: string; tipo: string; imagen: string | null; equipo: string | null;
  vendedor_nickname: string; fecha_creacion: string;
}
interface Direccion {
  id_direccion: number;
  id_usuario: number;
  alias: string;
  nombre_destinatario: string;
  telefono: string | null;
  calle: string;
  ciudad: string;
  estado: string | null;
  codigo_postal: string | null;
  pais: string;
  lat: number | null;
  lng: number | null;
  es_predeterminada: boolean;
}
interface Pedido {
  id_pedido: number;
  id_usuario: number;
  id_producto: number;
  id_variante: number | null;
  costo: string;
  direccion_snapshot: any;
  lat_destino: number | null;
  lng_destino: number | null;
  lat_actual: number | null;
  lng_actual: number | null;
  tracking_numero: string | null;
  fecha_estimada: string | null;
  notas_admin: string | null;
  estado: "procesando" | "enviado" | "en_camino" | "entregado" | "cancelado";
  fecha_pedido: string;
  fecha_entrega: string | null;
  producto?: { id_producto: number; nombre: string; imagen: string | null; tipo: string; descripcion?: string | null } | null;
  variante?: { id_variante: number; talla: string } | null;
}
interface Comentario {
  id_comentario: number;
  id_producto: number;
  id_usuario: number;
  calificacion: number;
  comentario: string;
  fecha_creacion: string;
  usuario?: { nickname: string | null; nombre_usuario: string | null } | null;
}
type NewDireccionForm = {
  alias: string;
  nombre_destinatario: string;
  telefono: string;
  calle: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
  lat: number | null;
  lng: number | null;
  es_predeterminada: boolean;
};
const EMPTY_DIRECCION: NewDireccionForm = {
  alias: "", nombre_destinatario: "", telefono: "", calle: "", ciudad: "",
  estado: "", codigo_postal: "", pais: "MX", lat: null, lng: null, es_predeterminada: false,
};

/* ── Map helpers ── */
function RecenterMap({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}
interface GeoResult { display_name: string; lat: number; lng: number; id: number }

function photonToResults(data: any): GeoResult[] {
  if (!Array.isArray(data?.features)) return [];
  return (data.features as any[]).map((f: any, i: number) => {
    const p = f.properties || {};
    const [lon, lat] = f.geometry?.coordinates ?? [0, 0];
    const parts: string[] = [
      p.housenumber && p.street ? `${p.street} ${p.housenumber}` : (p.street || p.name || ""),
      p.city || p.county || "",
      p.state || "",
      p.country || "",
    ].map(s => s.trim()).filter(Boolean);
    return { display_name: parts.join(", "), lat, lng: lon, id: p.osm_id ?? i };
  });
}

function LocationPicker({ lat, lng, onChange }: { lat: number | null; lng: number | null; onChange: (lat: number, lng: number) => void }) {
  function ClickHandler() {
    useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) });
    return null;
  }
  const center: [number, number] = lat != null && lng != null ? [lat, lng] : DEFAULT_MAP_CENTER;

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const buscarDireccion = async (q: string, manual: boolean) => {
    const term = q.trim();
    if (!term) return;
    setSearching(true);
    setSearchError(null);
    try {
      const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&limit=10&lang=es`);
      const data = await r.json();
      const parsed = photonToResults(data);
      if (parsed.length === 0) {
        setResults([]);
        if (manual) setSearchError("Sin resultados");
      } else {
        setResults(parsed);
      }
    } catch {
      if (manual) setSearchError("Error al buscar");
    } finally {
      setSearching(false);
    }
  };

  // Búsqueda en vivo (debounced) a partir de 3 caracteres
  useEffect(() => {
    const term = search.trim();
    if (term.length < 3) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const t = setTimeout(() => buscarDireccion(term, false), 500);
    return () => clearTimeout(t);
  }, [search]);

  const elegirResultado = (r: GeoResult) => {
    onChange(r.lat, r.lng);
    setResults([]);
    setSearch(r.display_name);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", gap: "0.4rem", position: "relative" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarDireccion(search, true); } }}
          placeholder="Buscar dirección o lugar (ej. Av. Reforma 222, CDMX)"
          style={{
            flex: 1, padding: "0.5rem 0.7rem", border: "1.5px solid #e0e0e0",
            borderRadius: "8px", fontSize: "0.82rem", outline: "none",
            color: "#263a55", background: "#fff",
          }}
        />
        <button type="button" onClick={() => buscarDireccion(search, true)} disabled={searching || !search.trim()}
          style={{
            padding: "0.5rem 0.95rem", borderRadius: "8px", border: "none",
            background: searching || !search.trim() ? "#e0e0e0" : "#263a55",
            color: searching || !search.trim() ? "#999" : "#fff",
            fontSize: "0.78rem", fontWeight: 700,
            cursor: searching || !search.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}>
          {searching ? "..." : "Buscar"}
        </button>
        {results.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem",
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 1000, maxHeight: "200px", overflowY: "auto",
          }}>
            {results.map(r => (
              <button key={r.id} type="button" onClick={() => elegirResultado(r)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "0.55rem 0.75rem", border: "none", background: "transparent",
                  fontSize: "0.78rem", color: "#263a55", cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
      {searchError && <p style={{ fontSize: "0.72rem", color: "#dc2626" }}>{searchError}</p>}
      <MapContainer center={center} zoom={11} style={{ height: "200px", width: "100%", borderRadius: "8px" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {lat != null && lng != null && <Marker position={[lat, lng]} />}
        <RecenterMap lat={lat} lng={lng} />
        <ClickHandler />
      </MapContainer>
    </div>
  );
}
const destinoIcon = L.divIcon({
  html: `<div style="background:#E90052;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">🏠</div>`,
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});
const paqueteIcon = L.divIcon({
  html: `<div style="background:#2563eb;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">📦</div>`,
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView(points[0], 13); return; }
    map.fitBounds(points, { padding: [40, 40] });
  }, [JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function TrackingMap({
  destLat, destLng, actualLat, actualLng, mostrarPaquete,
}: {
  destLat: number; destLng: number;
  actualLat?: number | null; actualLng?: number | null;
  mostrarPaquete: boolean;
}) {
  const tienePaquete = mostrarPaquete && actualLat != null && actualLng != null;
  const puntos: [number, number][] = tienePaquete
    ? [[actualLat as number, actualLng as number], [destLat, destLng]]
    : [[destLat, destLng]];
  return (
    <MapContainer center={[destLat, destLng]} zoom={5} style={{ height: "300px", width: "100%", borderRadius: "10px" }} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[destLat, destLng]} icon={destinoIcon} />
      {tienePaquete && (
        <>
          <Marker position={[actualLat as number, actualLng as number]} icon={paqueteIcon} />
          <Polyline positions={puntos} pathOptions={{ color: "#2563eb", dashArray: "8, 6", weight: 3 }} />
        </>
      )}
      <FitBounds points={puntos} />
    </MapContainer>
  );
}

const ESTADO_PEDIDO_LABEL: Record<string, string> = {
  procesando: "Procesando", enviado: "Enviado", en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado",
};
const ESTADO_PEDIDO_COLOR: Record<string, { bg: string; fg: string }> = {
  procesando: { bg: "#fef3c7", fg: "#92400e" },
  enviado:    { bg: "#dbeafe", fg: "#1e40af" },
  en_camino:  { bg: "#e0e7ff", fg: "#4338ca" },
  entregado:  { bg: "#dcfce7", fg: "#16a34a" },
  cancelado:  { bg: "#fee2e2", fg: "#dc2626" },
};
const ESTADO_FLOW = ["procesando", "enviado", "en_camino", "entregado"] as const;

const inputStyle: CSSProperties = {
  padding: "0.6rem 0.7rem",
  border: "1.5px solid #e0e0e0",
  borderRadius: "8px",
  fontSize: "0.85rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  color: "#263a55",
  background: "#fff",
};

interface TiendaProps {
  user: { id_usuario: number; nickname: string; dinero: number; [k: string]: any };
  onSaldoChange: (nuevoSaldo: number) => void;
}

type SubTab = "perfil" | "real" | "marketplace" | "pedidos";
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
  const [selectedVariante, setSelectedVariante] = useState<Variante | null>(null);

  // Reset talla seleccionada cuando cambia el modal de producto
  useEffect(() => { setSelectedVariante(null); }, [productModal?.id_producto]);

  type ConfirmAction =
    | { kind: "buy-product"; producto: Producto; variante: Variante | null }
    | { kind: "buy-listing"; listado: Listado }
    | { kind: "publish"; item: InventarioItem; precio: number };
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Checkout (envío) — solo para items reales
  const [checkoutAction, setCheckoutAction] = useState<{ producto: Producto; variante: Variante | null } | null>(null);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);
  const [showNewDireccion, setShowNewDireccion] = useState(false);
  const [newDireccion, setNewDireccion] = useState<NewDireccionForm>(EMPTY_DIRECCION);
  const [savingDireccion, setSavingDireccion] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Pedidos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoModal, setPedidoModal] = useState<Pedido | null>(null);

  // Editar dirección de un pedido en 'procesando'
  const [editingPedidoDireccion, setEditingPedidoDireccion] = useState(false);
  const [pedidoDireccionForm, setPedidoDireccionForm] = useState<NewDireccionForm>(EMPTY_DIRECCION);
  const [savingPedidoDireccion, setSavingPedidoDireccion] = useState(false);

  // Reseñas / comentarios (productos reales)
  const [productComments, setProductComments] = useState<Comentario[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newReview, setNewReview] = useState<{ calificacion: number; comentario: string }>({ calificacion: 5, comentario: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Pedido id reciente (para mostrar destacado en success modal)
  const [successPedidoId, setSuccessPedidoId] = useState<number | null>(null);

  const saldo = Number(user.dinero) || 0;
  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  // Bloquear scroll del body cuando hay un modal abierto
  useEffect(() => {
    const hasModal = !!productModal || !!confirmAction || !!successMsg || !!publishingItem || !!checkoutAction || !!pedidoModal;
    document.body.style.overflow = hasModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [productModal, confirmAction, successMsg, publishingItem, checkoutAction, pedidoModal]);

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

  const fetchDirecciones = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/direcciones/${user.id_usuario}`);
      const d = await r.json();
      if (d.success) setDirecciones(d.data);
    } catch { /* ignore */ }
  }, [user.id_usuario]);

  const fetchPedidos = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/pedidos/${user.id_usuario}`);
      const d = await r.json();
      if (d.success) setPedidos(d.data);
    } catch { /* ignore */ }
  }, [user.id_usuario]);

  // Reset filtros al cambiar de tab
  useEffect(() => {
    setBusqueda("");
    setFiltroTipo("todos");
    setFiltroPerfilTipo("todos");
    if (subTab === "perfil") { fetchProductos("perfil"); fetchMisItems(); }
    else if (subTab === "real") { fetchProductos("real"); }
    else if (subTab === "pedidos") { fetchPedidos(); }
    else { fetchListados(); fetchMisItems(); fetchMisListados(); }
  }, [subTab, fetchProductos, fetchListados, fetchMisItems, fetchMisListados, fetchPedidos]);

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
          if (id_variante != null && p.variantes) {
            return { ...p, variantes: p.variantes.map(v => v.id_variante === id_variante ? { ...v, stock: v.stock - 1 } : v) };
          }
          return { ...p, stock: (p.stock ?? 0) - 1 };
        }));
        setConfirmAction(null);
        setProductModal(null);
        setCheckoutAction(null);
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
    } catch { /* ignore */ }
  };

  const guardarDireccion = async (): Promise<Direccion | null> => {
    const f = newDireccion;
    if (!f.alias || !f.nombre_destinatario || !f.calle || !f.ciudad) {
      showToast("Completá alias, nombre, calle y ciudad", false);
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
        const next = f.es_predeterminada
          ? prev.map(x => ({ ...x, es_predeterminada: false }))
          : prev;
        return [d.data, ...next];
      });
      setSelectedDireccionId(d.data.id_direccion);
      setShowNewDireccion(false);
      setNewDireccion(EMPTY_DIRECCION);
      showToast("Dirección guardada", true);
      return d.data;
    } catch {
      showToast("Error de conexión", false);
      return null;
    } finally {
      setSavingDireccion(false);
    }
  };

  const confirmarPedido = async () => {
    if (!checkoutAction || !selectedDireccionId) return;
    setPlacingOrder(true);
    try {
      await comprar(
        checkoutAction.producto.id_producto,
        checkoutAction.producto.nombre,
        checkoutAction.variante?.id_variante ?? null,
        selectedDireccionId,
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const fetchComentarios = useCallback(async (id_producto: number) => {
    setLoadingComments(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/comentarios/${id_producto}`);
      const d = await r.json();
      if (d.success) setProductComments(d.data);
    } catch { /* ignore */ } finally { setLoadingComments(false); }
  }, []);

  // Cargar comentarios al abrir el modal de un producto real
  useEffect(() => {
    if (productModal && productModal.categoria === "real") {
      fetchComentarios(productModal.id_producto);
      setNewReview({ calificacion: 5, comentario: "" });
    } else {
      setProductComments([]);
    }
  }, [productModal, fetchComentarios]);

  // Reset edición de dirección cuando cambia el pedido abierto
  useEffect(() => {
    setEditingPedidoDireccion(false);
  }, [pedidoModal?.id_pedido]);

  const enviarReseña = async () => {
    if (!productModal) return;
    if (newReview.comentario.trim().length < 3) { showToast("El comentario es muy corto", false); return; }
    setSubmittingReview(true);
    try {
      const r = await fetch(`${API_URL}/api/tienda/comentarios`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: user.id_usuario,
          id_producto: productModal.id_producto,
          calificacion: newReview.calificacion,
          comentario: newReview.comentario.trim(),
        }),
      });
      const d = await r.json();
      if (d.success) {
        setProductComments(prev => [d.data, ...prev]);
        setNewReview({ calificacion: 5, comentario: "" });
        showToast("Reseña publicada", true);
      } else { showToast(d.error || "Error al publicar", false); }
    } catch { showToast("Error de conexión", false); }
    finally { setSubmittingReview(false); }
  };

  const eliminarReseña = async (id_comentario: number) => {
    try {
      const r = await fetch(`${API_URL}/api/tienda/comentarios/${id_comentario}?id_usuario=${user.id_usuario}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) {
        setProductComments(prev => prev.filter(c => c.id_comentario !== id_comentario));
        showToast("Reseña eliminada", true);
      } else { showToast(d.error || "Error", false); }
    } catch { showToast("Error de conexión", false); }
  };

  const iniciarEditarPedidoDireccion = () => {
    if (!pedidoModal) return;
    const s = pedidoModal.direccion_snapshot || {};
    setPedidoDireccionForm({
      alias: s.alias || "",
      nombre_destinatario: s.nombre_destinatario || "",
      telefono: s.telefono || "",
      calle: s.calle || "",
      ciudad: s.ciudad || "",
      estado: s.estado || "",
      codigo_postal: s.codigo_postal || "",
      pais: s.pais || "MX",
      lat: s.lat != null ? Number(s.lat) : (pedidoModal.lat_destino != null ? Number(pedidoModal.lat_destino) : null),
      lng: s.lng != null ? Number(s.lng) : (pedidoModal.lng_destino != null ? Number(pedidoModal.lng_destino) : null),
      es_predeterminada: false,
    });
    setEditingPedidoDireccion(true);
  };

  const guardarPedidoDireccion = async () => {
    if (!pedidoModal) return;
    const f = pedidoDireccionForm;
    if (!f.alias || !f.nombre_destinatario || !f.calle || !f.ciudad) {
      showToast("Completá alias, nombre, calle y ciudad", false); return;
    }
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
  const ProductCard = ({ p, badge }: { p: Producto; badge?: string }) => {
    const tieneVariantes = !!p.variantes && p.variantes.length > 0;
    const stockTotal = tieneVariantes
      ? (p.variantes ?? []).reduce((sum, v) => sum + v.stock, 0)
      : (p.stock ?? 0);
    return (
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
          {stockTotal === 0
            ? <span style={{ marginLeft: "0.4rem", background: "#fee2e2", color: "#dc2626", fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "4px" }}>Sin stock</span>
            : <span style={{ marginLeft: "0.4rem", color: "#84878F" }}>· {stockTotal} disp.</span>
          }
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#263a55" }}>{p.costo} pts</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (tieneVariantes) setProductModal(p);
              else setConfirmAction({ kind: "buy-product", producto: p, variante: null });
            }}
            disabled={stockTotal <= 0 || Number(p.costo) > saldo}
            style={{
              padding: "0.35rem 0.75rem",
              background: stockTotal > 0 && Number(p.costo) <= saldo ? "#E90052" : "#ddd",
              color: stockTotal > 0 && Number(p.costo) <= saldo ? "#fff" : "#999",
              border: "none", borderRadius: "6px",
              cursor: stockTotal > 0 && Number(p.costo) <= saldo ? "pointer" : "not-allowed",
              fontSize: "0.8rem", fontWeight: 600, transition: "background 0.2s",
            }}>{tieneVariantes ? "Ver tallas" : "Comprar"}</button>
        </div>
      </div>
    </div>
    );
  };

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
                Comprarás <strong style={{ color: "#263a55" }}>{confirmAction.producto.nombre}</strong>{confirmAction.variante ? <> (talla <strong style={{ color: "#263a55" }}>{confirmAction.variante.talla}</strong>)</> : null} por <strong style={{ color: "#E90052" }}>{Number(confirmAction.producto.costo).toLocaleString()} pts</strong>. Te quedarán <strong style={{ color: "#263a55" }}>{(saldo - Number(confirmAction.producto.costo)).toLocaleString()} pts</strong>.
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
                if (confirmAction.kind === "buy-product") comprar(confirmAction.producto.id_producto, confirmAction.producto.nombre, confirmAction.variante?.id_variante ?? null);
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
          onClick={() => { setSuccessMsg(null); setSuccessPedidoId(null); }}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "2rem", width: "380px", maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #E90052, #871d54)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <span style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 900 }}>✓</span>
            </div>
            <h3 style={{ color: "#263a55", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.45rem" }}>¡Operación exitosa!</h3>
            <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: successPedidoId ? "0.85rem" : "1.4rem" }}>{successMsg}</p>
            {successPedidoId && (
              <div style={{ background: "linear-gradient(135deg, rgba(233,0,82,0.08), rgba(135,29,84,0.08))", border: "1px solid rgba(233,0,82,0.2)", borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "1.4rem" }}>
                <p style={{ fontSize: "0.65rem", color: "#84878F", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "0.15rem" }}>Número de pedido</p>
                <p style={{ fontSize: "1.4rem", color: "#E90052", fontWeight: 900, letterSpacing: "0.02em" }}>#{successPedidoId}</p>
              </div>
            )}
            <button onClick={() => { setSuccessMsg(null); setSuccessPedidoId(null); }} style={{ padding: "0.65rem 2.5rem", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #263a55, #1a2a3f)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: detalle de producto */}
      {productModal && (() => {
        const isOwned = ownedIds.has(productModal.id_producto);
        const isRealItem = productModal.categoria === "real";
        const tieneVariantes = !!productModal.variantes && productModal.variantes.length > 0;
        const stockTotal = tieneVariantes
          ? (productModal.variantes ?? []).reduce((sum, v) => sum + v.stock, 0)
          : (productModal.stock ?? 0);
        const stockSeleccionable = tieneVariantes
          ? (selectedVariante ? selectedVariante.stock > 0 : false)
          : stockTotal > 0;
        // Real items: se pueden comprar múltiples veces (limitado por stock).
        // Perfil items: solo uno por usuario.
        const canBuyModal = isRealItem
          ? stockSeleccionable && Number(productModal.costo) <= saldo
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
                  {isOwned && !isRealItem && <span style={{ background: "#16a34a", color: "#fff", fontSize: "0.65rem", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 700 }}>EN TU PERFIL</span>}
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
                {/* Descripción (solo en modal) */}
                {productModal.descripcion && (
                  <p style={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.5, marginBottom: "0.85rem" }}>
                    {productModal.descripcion}
                  </p>
                )}
                {/* Stock info */}
                <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "0.6rem 0.85rem", marginBottom: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "#84878F", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.1rem" }}>Stock</p>
                    {isRealItem
                      ? <p style={{ fontSize: "0.82rem", color: stockTotal === 0 ? "#dc2626" : "#263a55", fontWeight: 600 }}>{stockTotal === 0 ? "Sin stock" : `${stockTotal} disponibles`}</p>
                      : <p style={{ fontSize: "0.82rem", color: "#871d54", fontWeight: 700 }}>Objeto único por usuario</p>
                    }
                  </div>
                  {isOwned && !isRealItem && (
                    <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "6px" }}>Ya lo tienes</div>
                  )}
                </div>
                {/* Selector de talla (solo si tiene variantes) */}
                {tieneVariantes && (
                  <div style={{ marginBottom: "0.9rem" }}>
                    <p style={{ fontSize: "0.65rem", color: "#84878F", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Talla</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {(productModal.variantes ?? []).map(v => {
                        const sinStock = v.stock <= 0;
                        const seleccionada = selectedVariante?.id_variante === v.id_variante;
                        return (
                          <button
                            key={v.id_variante}
                            disabled={sinStock}
                            onClick={() => setSelectedVariante(v)}
                            style={{
                              minWidth: "52px", padding: "0.45rem 0.7rem",
                              border: seleccionada ? "2px solid #E90052" : "1px solid #d1d5db",
                              borderRadius: "8px",
                              background: sinStock ? "#f3f4f6" : seleccionada ? "rgba(233,0,82,0.08)" : "#fff",
                              color: sinStock ? "#9ca3af" : seleccionada ? "#E90052" : "#263a55",
                              fontWeight: 700, fontSize: "0.85rem",
                              cursor: sinStock ? "not-allowed" : "pointer",
                              textDecoration: sinStock ? "line-through" : "none",
                              transition: "all 0.15s",
                            }}
                          >
                            {v.talla}
                            <span style={{ display: "block", fontSize: "0.6rem", fontWeight: 500, marginTop: "0.1rem", color: sinStock ? "#9ca3af" : "#84878F" }}>
                              {sinStock ? "agotada" : `${v.stock} disp.`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Price + buy */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: "0.9rem" }}>
                  <div>
                    <p style={{ fontSize: "0.68rem", color: "#84878F", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.05rem" }}>Precio</p>
                    <span style={{ fontSize: "1.45rem", fontWeight: 900, color: "#263a55" }}>{Number(productModal.costo).toLocaleString()}</span>
                    <span style={{ fontSize: "0.82rem", color: "#84878F", marginLeft: "0.25rem" }}>pts</span>
                  </div>
                  <button
                    disabled={!canBuyModal}
                    onClick={() => {
                      if (!canBuyModal) return;
                      const prod = productModal;
                      const vr = selectedVariante;
                      setProductModal(null);
                      if (isRealItem) {
                        abrirCheckout(prod, vr);
                      } else {
                        setConfirmAction({ kind: "buy-product", producto: prod, variante: vr });
                      }
                    }}
                    style={{ padding: "0.65rem 1.75rem", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem", cursor: canBuyModal ? "pointer" : "not-allowed", background: canBuyModal ? "#E90052" : "#e0e0e0", color: canBuyModal ? "#fff" : "#999" }}>
                    {isOwned && !isRealItem ? "Ya tienes este"
                      : isRealItem && stockTotal === 0 ? "Sin stock"
                      : tieneVariantes && !selectedVariante ? "Elegí una talla"
                      : Number(productModal.costo) > saldo ? "Saldo insuficiente"
                      : isRealItem ? "Continuar al envío"
                      : "Comprar ahora"}
                  </button>
                </div>

                {/* Reseñas (solo productos reales) */}
                {isRealItem && (() => {
                  const userComment = productComments.find(c => c.id_usuario === user.id_usuario);
                  const total = productComments.length;
                  const avg = total > 0 ? productComments.reduce((s, c) => s + c.calificacion, 0) / total : 0;
                  return (
                    <div style={{ marginTop: "1.25rem", borderTop: "1px solid #f0f0f0", paddingTop: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h4 style={{ color: "#263a55", fontSize: "0.95rem", fontWeight: 800 }}>Reseñas</h4>
                        {total > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ color: "#f59e0b", fontSize: "0.95rem", letterSpacing: "0.05em" }}>
                              {"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "#84878F", fontWeight: 600 }}>{avg.toFixed(1)} · {total} reseña{total === 1 ? "" : "s"}</span>
                          </div>
                        )}
                      </div>

                      {/* Form (solo si compró y no comentó aún) */}
                      {isOwned && !userComment && (
                        <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.85rem 1rem", marginBottom: "0.85rem" }}>
                          <p style={{ fontSize: "0.74rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Tu reseña</p>
                          <div style={{ display: "flex", gap: "0.15rem", marginBottom: "0.5rem" }}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <button key={n} onClick={() => setNewReview(r => ({ ...r, calificacion: n }))}
                                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1, padding: 0, color: n <= newReview.calificacion ? "#f59e0b" : "#d1d5db" }}>
                                {n <= newReview.calificacion ? "★" : "☆"}
                              </button>
                            ))}
                          </div>
                          <textarea value={newReview.comentario}
                            onChange={(e) => setNewReview(r => ({ ...r, comentario: e.target.value }))}
                            placeholder="Contá tu experiencia con el producto..."
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", marginBottom: "0.5rem" }} />
                          <button onClick={enviarReseña} disabled={submittingReview || newReview.comentario.trim().length < 3}
                            style={{
                              padding: "0.5rem 1.1rem", borderRadius: "8px", border: "none",
                              background: submittingReview || newReview.comentario.trim().length < 3 ? "#e0e0e0" : "#E90052",
                              color: submittingReview || newReview.comentario.trim().length < 3 ? "#999" : "#fff",
                              fontWeight: 700, fontSize: "0.8rem",
                              cursor: submittingReview || newReview.comentario.trim().length < 3 ? "not-allowed" : "pointer",
                            }}>
                            {submittingReview ? "Publicando..." : "Publicar reseña"}
                          </button>
                        </div>
                      )}
                      {!isOwned && (
                        <p style={{ fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.85rem", fontStyle: "italic" }}>
                          Tenés que comprar el producto para dejar una reseña.
                        </p>
                      )}

                      {/* Lista de reseñas */}
                      {loadingComments ? (
                        <p style={{ fontSize: "0.82rem", color: "#84878F" }}>Cargando reseñas...</p>
                      ) : productComments.length === 0 ? (
                        <p style={{ fontSize: "0.82rem", color: "#9ca3af", textAlign: "center", padding: "1rem 0" }}>
                          Aún no hay reseñas. {isOwned && !userComment ? "¡Sé el primero!" : ""}
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                          {productComments.map(c => {
                            const isMine = c.id_usuario === user.id_usuario;
                            const nick = c.usuario?.nickname || c.usuario?.nombre_usuario || `Usuario #${c.id_usuario}`;
                            return (
                              <div key={c.id_comentario} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "10px", padding: "0.75rem 0.9rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#263a55" }}>{nick}{isMine && <span style={{ marginLeft: "0.4rem", fontSize: "0.62rem", background: "#dbeafe", color: "#1e40af", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>TÚ</span>}</span>
                                    <span style={{ color: "#f59e0b", fontSize: "0.82rem", letterSpacing: "0.04em" }}>
                                      {"★".repeat(c.calificacion)}{"☆".repeat(5 - c.calificacion)}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{new Date(c.fecha_creacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                </div>
                                <p style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.5 }}>{c.comentario}</p>
                                {isMine && (
                                  <button onClick={() => eliminarReseña(c.id_comentario)}
                                    style={{ marginTop: "0.4rem", background: "transparent", border: "none", color: "#dc2626", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                                    Eliminar mi reseña
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: checkout (envío) — solo items reales */}
      {checkoutAction && (() => {
        const { producto, variante } = checkoutAction;
        const costo = Number(producto.costo);
        const saldoFinal = saldo - costo;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9004, padding: "1rem", overflowY: "auto" }}
            onClick={() => { if (!placingOrder) setCheckoutAction(null); }}>
            <div style={{ background: "#fff", borderRadius: "16px", width: "520px", maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}
              onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "#263a55", fontSize: "1.1rem", fontWeight: 800 }}>Finalizar compra</h3>
                <button onClick={() => { if (!placingOrder) setCheckoutAction(null); }} style={{ background: "transparent", border: "none", color: "#84878F", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
              </div>

              <div style={{ padding: "1.25rem 1.5rem" }}>
                {/* Resumen */}
                <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.9rem 1rem", marginBottom: "1rem", display: "flex", gap: "0.85rem", alignItems: "center" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "8px", background: producto.imagen ? `#fff url(${producto.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55, #871d54)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#263a55", marginBottom: "0.15rem" }}>{producto.nombre}</p>
                    <p style={{ fontSize: "0.72rem", color: "#84878F" }}>
                      {tipoLabel(producto.tipo)}{variante ? ` · talla ${variante.talla}` : ""}
                    </p>
                    <p style={{ fontSize: "0.95rem", color: "#E90052", fontWeight: 800, marginTop: "0.2rem" }}>{costo.toLocaleString()} pts</p>
                  </div>
                </div>

                {/* Direcciones */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h4 style={{ fontSize: "0.78rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dirección de envío</h4>
                    {!showNewDireccion && (
                      <button onClick={() => setShowNewDireccion(true)}
                        style={{ background: "transparent", border: "none", color: "#E90052", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                        + Nueva dirección
                      </button>
                    )}
                  </div>

                  {direcciones.length === 0 && !showNewDireccion && (
                    <p style={{ fontSize: "0.82rem", color: "#84878F", padding: "0.6rem 0" }}>No tienes direcciones guardadas. Agregá una para continuar.</p>
                  )}

                  {direcciones.length > 0 && !showNewDireccion && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {direcciones.map(dir => {
                        const sel = selectedDireccionId === dir.id_direccion;
                        return (
                          <label key={dir.id_direccion}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: "0.7rem",
                              padding: "0.75rem 0.9rem",
                              border: sel ? "2px solid #E90052" : "1.5px solid #e5e7eb",
                              borderRadius: "10px", cursor: "pointer",
                              background: sel ? "rgba(233,0,82,0.04)" : "#fff",
                            }}>
                            <input type="radio" name="direccion" checked={sel} onChange={() => setSelectedDireccionId(dir.id_direccion)}
                              style={{ marginTop: "0.2rem", accentColor: "#E90052" }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.1rem" }}>
                                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#263a55" }}>
                                  {dir.alias} {dir.es_predeterminada && <span style={{ fontSize: "0.65rem", background: "#dcfce7", color: "#16a34a", padding: "0.1rem 0.4rem", borderRadius: "4px", marginLeft: "0.4rem", fontWeight: 700 }}>PREDETERMINADA</span>}
                                </p>
                                <button type="button" onClick={(e) => { e.preventDefault(); eliminarDireccion(dir.id_direccion); }}
                                  style={{ background: "transparent", border: "none", color: "#dc2626", fontSize: "0.7rem", cursor: "pointer", fontWeight: 600 }}>
                                  Eliminar
                                </button>
                              </div>
                              <p style={{ fontSize: "0.78rem", color: "#374151" }}>{dir.nombre_destinatario}{dir.telefono ? ` · ${dir.telefono}` : ""}</p>
                              <p style={{ fontSize: "0.75rem", color: "#84878F" }}>{dir.calle}, {dir.ciudad}{dir.estado ? `, ${dir.estado}` : ""}{dir.codigo_postal ? ` ${dir.codigo_postal}` : ""}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Form nueva dirección */}
                  {showNewDireccion && (
                    <div style={{ border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                        <input placeholder="Alias (Casa, Oficina...)" value={newDireccion.alias}
                          onChange={(e) => setNewDireccion({ ...newDireccion, alias: e.target.value })}
                          style={inputStyle} />
                        <input placeholder="Nombre del destinatario" value={newDireccion.nombre_destinatario}
                          onChange={(e) => setNewDireccion({ ...newDireccion, nombre_destinatario: e.target.value })}
                          style={inputStyle} />
                      </div>
                      <input placeholder="Teléfono (opcional)" value={newDireccion.telefono}
                        onChange={(e) => setNewDireccion({ ...newDireccion, telefono: e.target.value })}
                        style={inputStyle} />
                      <input placeholder="Calle y número" value={newDireccion.calle}
                        onChange={(e) => setNewDireccion({ ...newDireccion, calle: e.target.value })}
                        style={inputStyle} />
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr", gap: "0.6rem" }}>
                        <input placeholder="Ciudad" value={newDireccion.ciudad}
                          onChange={(e) => setNewDireccion({ ...newDireccion, ciudad: e.target.value })}
                          style={inputStyle} />
                        <input placeholder="Estado" value={newDireccion.estado}
                          onChange={(e) => setNewDireccion({ ...newDireccion, estado: e.target.value })}
                          style={inputStyle} />
                        <input placeholder="CP" value={newDireccion.codigo_postal}
                          onChange={(e) => setNewDireccion({ ...newDireccion, codigo_postal: e.target.value })}
                          style={inputStyle} />
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                          <label style={{ fontSize: "0.72rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Ubicación en mapa</label>
                          <button type="button" onClick={() => {
                            if (!navigator.geolocation) { showToast("Geolocalización no disponible", false); return; }
                            navigator.geolocation.getCurrentPosition(
                              (pos) => setNewDireccion(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
                              () => showToast("No se pudo obtener tu ubicación", false),
                            );
                          }} style={{ background: "transparent", border: "none", color: "#E90052", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}>
                            Usar mi ubicación
                          </button>
                        </div>
                        <p style={{ fontSize: "0.7rem", color: "#84878F", marginBottom: "0.4rem" }}>Hacé click en el mapa para fijar la ubicación.</p>
                        <LocationPicker lat={newDireccion.lat} lng={newDireccion.lng}
                          onChange={(lat, lng) => setNewDireccion(prev => ({ ...prev, lat, lng }))} />
                        {newDireccion.lat != null && newDireccion.lng != null && (
                          <p style={{ fontSize: "0.7rem", color: "#84878F", marginTop: "0.3rem" }}>
                            {newDireccion.lat.toFixed(5)}, {newDireccion.lng.toFixed(5)}
                          </p>
                        )}
                      </div>

                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#374151" }}>
                        <input type="checkbox" checked={newDireccion.es_predeterminada}
                          onChange={(e) => setNewDireccion({ ...newDireccion, es_predeterminada: e.target.checked })}
                          style={{ accentColor: "#E90052" }} />
                        Usar como predeterminada
                      </label>

                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
                        <button onClick={() => { setShowNewDireccion(false); setNewDireccion(EMPTY_DIRECCION); }} disabled={savingDireccion}
                          style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
                          Cancelar
                        </button>
                        <button onClick={guardarDireccion} disabled={savingDireccion}
                          style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "none", background: "#263a55", color: "#fff", cursor: savingDireccion ? "wait" : "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
                          {savingDireccion ? "Guardando..." : "Guardar dirección"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Totales */}
                <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.85rem 1rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#374151" }}>
                    <span>Total</span><strong style={{ color: "#E90052" }}>{costo.toLocaleString()} pts</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#84878F", marginTop: "0.25rem" }}>
                    <span>Saldo después de la compra</span><span style={{ fontWeight: 700, color: "#263a55" }}>{saldoFinal.toLocaleString()} pts</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button onClick={() => setCheckoutAction(null)} disabled={placingOrder}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "10px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: placingOrder ? "wait" : "pointer", fontWeight: 600, fontSize: "0.88rem" }}>
                    Cancelar
                  </button>
                  <button onClick={confirmarPedido} disabled={!selectedDireccionId || placingOrder || showNewDireccion}
                    style={{ flex: 2, padding: "0.75rem", borderRadius: "10px", border: "none",
                      background: !selectedDireccionId || showNewDireccion ? "#e0e0e0" : "#E90052",
                      color: !selectedDireccionId || showNewDireccion ? "#999" : "#fff",
                      cursor: !selectedDireccionId || placingOrder || showNewDireccion ? "not-allowed" : "pointer",
                      fontWeight: 700, fontSize: "0.88rem" }}>
                    {placingOrder ? "Procesando..." : "Confirmar pedido"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: detalle de pedido (con mapa) */}
      {pedidoModal && (() => {
        const p = pedidoModal;
        const dirSnap = p.direccion_snapshot || {};
        const idx = ESTADO_FLOW.indexOf(p.estado as any);
        const color = ESTADO_PEDIDO_COLOR[p.estado] || ESTADO_PEDIDO_COLOR.procesando;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9005, padding: "1rem", overflowY: "auto" }}
            onClick={() => setPedidoModal(null)}>
            <div style={{ background: "#fff", borderRadius: "16px", width: "560px", maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ color: "#263a55", fontSize: "1.05rem", fontWeight: 800 }}>Pedido #{p.id_pedido}</h3>
                  <p style={{ color: "#84878F", fontSize: "0.76rem" }}>{new Date(p.fecha_pedido).toLocaleString("es-MX")}</p>
                </div>
                <button onClick={() => setPedidoModal(null)} style={{ background: "transparent", border: "none", color: "#84878F", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
              </div>

              <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Producto */}
                <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                  <div style={{ width: "72px", height: "72px", borderRadius: "8px", background: p.producto?.imagen ? `#f5f6f8 url(${p.producto.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55, #871d54)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#263a55" }}>{p.producto?.nombre || `Producto #${p.id_producto}`}</p>
                    <p style={{ fontSize: "0.78rem", color: "#84878F" }}>
                      {p.producto?.tipo ? tipoLabel(p.producto.tipo) : ""}{p.variante ? ` · talla ${p.variante.talla}` : ""}
                    </p>
                    <p style={{ fontSize: "0.92rem", color: "#E90052", fontWeight: 800, marginTop: "0.15rem" }}>{Number(p.costo).toLocaleString()} pts</p>
                  </div>
                  <span style={{ background: color.bg, color: color.fg, padding: "0.3rem 0.75rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {ESTADO_PEDIDO_LABEL[p.estado] || p.estado}
                  </span>
                </div>

                {/* Timeline */}
                {p.estado !== "cancelado" && (
                  <div>
                    <h4 style={{ fontSize: "0.74rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Estado del envío</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                      <div style={{ position: "absolute", top: "11px", left: "12px", right: "12px", height: "2px", background: "#e5e7eb", zIndex: 0 }} />
                      <div style={{ position: "absolute", top: "11px", left: "12px", height: "2px", background: "#E90052", zIndex: 1, width: idx > 0 ? `calc(${(idx / (ESTADO_FLOW.length - 1)) * 100}% - 24px)` : "0" }} />
                      {ESTADO_FLOW.map((est, i) => {
                        const reached = i <= idx;
                        return (
                          <div key={est} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", zIndex: 2, flex: 1 }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: reached ? "#E90052" : "#e5e7eb", color: reached ? "#fff" : "#84878F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700 }}>
                              {reached ? "✓" : i + 1}
                            </div>
                            <p style={{ fontSize: "0.68rem", color: reached ? "#263a55" : "#84878F", fontWeight: reached ? 700 : 500, textAlign: "center" }}>{ESTADO_PEDIDO_LABEL[est]}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dirección */}
                <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <h4 style={{ fontSize: "0.74rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dirección de entrega</h4>
                    {p.estado === "procesando" && !editingPedidoDireccion && (
                      <button onClick={iniciarEditarPedidoDireccion}
                        style={{ background: "transparent", border: "none", color: "#E90052", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}>
                        Editar
                      </button>
                    )}
                  </div>

                  {!editingPedidoDireccion ? (
                    <>
                      <p style={{ fontSize: "0.85rem", color: "#263a55", fontWeight: 600 }}>{dirSnap.nombre_destinatario || "—"}{dirSnap.telefono ? ` · ${dirSnap.telefono}` : ""}</p>
                      <p style={{ fontSize: "0.78rem", color: "#374151" }}>{dirSnap.calle || ""}{dirSnap.ciudad ? `, ${dirSnap.ciudad}` : ""}{dirSnap.estado ? `, ${dirSnap.estado}` : ""}{dirSnap.codigo_postal ? ` ${dirSnap.codigo_postal}` : ""}</p>
                      {p.estado !== "procesando" && (
                        <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.4rem", fontStyle: "italic" }}>Ya no podés editar la dirección porque el pedido salió de "procesando".</p>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <input placeholder="Alias" value={pedidoDireccionForm.alias}
                          onChange={(e) => setPedidoDireccionForm({ ...pedidoDireccionForm, alias: e.target.value })}
                          style={inputStyle} />
                        <input placeholder="Nombre del destinatario" value={pedidoDireccionForm.nombre_destinatario}
                          onChange={(e) => setPedidoDireccionForm({ ...pedidoDireccionForm, nombre_destinatario: e.target.value })}
                          style={inputStyle} />
                      </div>
                      <input placeholder="Teléfono (opcional)" value={pedidoDireccionForm.telefono}
                        onChange={(e) => setPedidoDireccionForm({ ...pedidoDireccionForm, telefono: e.target.value })}
                        style={inputStyle} />
                      <input placeholder="Calle y número" value={pedidoDireccionForm.calle}
                        onChange={(e) => setPedidoDireccionForm({ ...pedidoDireccionForm, calle: e.target.value })}
                        style={inputStyle} />
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr", gap: "0.5rem" }}>
                        <input placeholder="Ciudad" value={pedidoDireccionForm.ciudad}
                          onChange={(e) => setPedidoDireccionForm({ ...pedidoDireccionForm, ciudad: e.target.value })}
                          style={inputStyle} />
                        <input placeholder="Estado" value={pedidoDireccionForm.estado}
                          onChange={(e) => setPedidoDireccionForm({ ...pedidoDireccionForm, estado: e.target.value })}
                          style={inputStyle} />
                        <input placeholder="CP" value={pedidoDireccionForm.codigo_postal}
                          onChange={(e) => setPedidoDireccionForm({ ...pedidoDireccionForm, codigo_postal: e.target.value })}
                          style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                          <label style={{ fontSize: "0.7rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Ubicación en mapa</label>
                          <button type="button" onClick={() => {
                            if (!navigator.geolocation) { showToast("Geolocalización no disponible", false); return; }
                            navigator.geolocation.getCurrentPosition(
                              (pos) => setPedidoDireccionForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
                              () => showToast("No se pudo obtener tu ubicación", false),
                            );
                          }} style={{ background: "transparent", border: "none", color: "#E90052", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                            Usar mi ubicación
                          </button>
                        </div>
                        <LocationPicker lat={pedidoDireccionForm.lat} lng={pedidoDireccionForm.lng}
                          onChange={(lat, lng) => setPedidoDireccionForm(prev => ({ ...prev, lat, lng }))} />
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => setEditingPedidoDireccion(false)} disabled={savingPedidoDireccion}
                          style={{ flex: 1, padding: "0.55rem", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>
                          Cancelar
                        </button>
                        <button onClick={guardarPedidoDireccion} disabled={savingPedidoDireccion}
                          style={{ flex: 1, padding: "0.55rem", borderRadius: "8px", border: "none", background: "#E90052", color: "#fff", cursor: savingPedidoDireccion ? "wait" : "pointer", fontWeight: 700, fontSize: "0.8rem" }}>
                          {savingPedidoDireccion ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tracking info (si admin la cargó) */}
                {(p.tracking_numero || p.fecha_estimada || p.notas_admin) && (
                  <div style={{ background: "#f1f5f9", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                    <h4 style={{ fontSize: "0.74rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Información de envío</h4>
                    {p.tracking_numero && (
                      <p style={{ fontSize: "0.82rem", color: "#374151" }}>
                        <span style={{ color: "#84878F", fontWeight: 600 }}>Tracking: </span>
                        <span style={{ fontWeight: 700, color: "#263a55", letterSpacing: "0.02em" }}>{p.tracking_numero}</span>
                      </p>
                    )}
                    {p.fecha_estimada && (
                      <p style={{ fontSize: "0.82rem", color: "#374151" }}>
                        <span style={{ color: "#84878F", fontWeight: 600 }}>Entrega estimada: </span>
                        <span style={{ fontWeight: 700, color: "#263a55" }}>{new Date(p.fecha_estimada).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}</span>
                      </p>
                    )}
                    {p.notas_admin && (
                      <p style={{ fontSize: "0.78rem", color: "#374151", marginTop: "0.3rem", fontStyle: "italic" }}>
                        “{p.notas_admin}”
                      </p>
                    )}
                  </div>
                )}

                {/* Mapa de tracking */}
                {p.lat_destino != null && p.lng_destino != null && (
                  <div>
                    <h4 style={{ fontSize: "0.74rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                      {p.estado === "entregado" ? "Ubicación de entrega" : "Ruta del envío"}
                    </h4>
                    <TrackingMap
                      destLat={Number(p.lat_destino)}
                      destLng={Number(p.lng_destino)}
                      actualLat={p.lat_actual != null ? Number(p.lat_actual) : null}
                      actualLng={p.lng_actual != null ? Number(p.lng_actual) : null}
                      mostrarPaquete={p.estado !== "entregado" && p.estado !== "cancelado"}
                    />
                    {p.estado !== "entregado" && p.estado !== "cancelado" && p.lat_actual != null && p.lng_actual != null && (
                      <p style={{ fontSize: "0.7rem", color: "#84878F", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><span style={{ width: "10px", height: "10px", background: "#2563eb", borderRadius: "50%" }} /> Paquete</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><span style={{ width: "10px", height: "10px", background: "#E90052", borderRadius: "50%" }} /> Destino</span>
                      </p>
                    )}
                  </div>
                )}

                {p.fecha_entrega && (
                  <p style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>Entregado el {new Date(p.fecha_entrega).toLocaleString("es-MX")}</p>
                )}
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
          { key: "pedidos" as SubTab,      label: "Mis Pedidos"       },
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
      {subTab !== "perfil" && subTab !== "pedidos" && (subTab !== "marketplace" || marketView === "explorar") && (
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
                        onClick={e => { e.stopPropagation(); if (canBuy) setConfirmAction({ kind: "buy-product", producto: p, variante: null }); }}
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
                {productosFiltrados.map(p => <ProductCard key={p.id_producto} p={p} badge="OBJETO REAL" />)}
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
                      ) : item.categoria === "perfil" ? (
                        <button onClick={() => setPublishingItem({ item, precio: "" })}
                          style={{
                            padding: "0.3rem 0.6rem", background: "#E90052", color: "#fff",
                            border: "none", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                            cursor: "pointer", alignSelf: "flex-start",
                          }}>
                          Publicar
                        </button>
                      ) : null}
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

      {/* ── Sub-tab: Mis Pedidos ── */}
      {subTab === "pedidos" && (
        <div>
          {pedidos.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "3rem 1.5rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ color: "#84878F", fontSize: "0.95rem", marginBottom: "0.4rem" }}>Aún no tenés pedidos</p>
              <p style={{ color: "#9ca3af", fontSize: "0.82rem" }}>Comprá un objeto real desde la pestaña "Objetos Reales" y aparecerá acá.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pedidos.map(p => {
                const color = ESTADO_PEDIDO_COLOR[p.estado] || ESTADO_PEDIDO_COLOR.procesando;
                return (
                  <div key={p.id_pedido} onClick={() => setPedidoModal(p)}
                    style={{
                      background: "#fff", borderRadius: "12px", padding: "0.9rem 1.1rem",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer",
                      display: "flex", gap: "1rem", alignItems: "center",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.10)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
                  >
                    <div style={{ width: "64px", height: "64px", borderRadius: "8px", background: p.producto?.imagen ? `#f5f6f8 url(${p.producto.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55, #871d54)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "inline-block", background: "#263a55", color: "#fff", padding: "0.2rem 0.55rem", borderRadius: "6px", fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.02em" }}>#{p.id_pedido}</span>
                          <p style={{ fontSize: "0.92rem", color: "#263a55", fontWeight: 700, marginTop: "0.35rem" }}>{p.producto?.nombre || `Producto #${p.id_producto}`}</p>
                          <p style={{ fontSize: "0.74rem", color: "#84878F" }}>
                            {p.producto?.tipo ? tipoLabel(p.producto.tipo) : ""}{p.variante ? ` · talla ${p.variante.talla}` : ""}
                          </p>
                        </div>
                        <span style={{ background: color.bg, color: color.fg, padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                          {ESTADO_PEDIDO_LABEL[p.estado] || p.estado}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                        <p style={{ fontSize: "0.72rem", color: "#84878F" }}>{new Date(p.fecha_pedido).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        <p style={{ fontSize: "0.85rem", color: "#E90052", fontWeight: 800 }}>{Number(p.costo).toLocaleString()} pts</p>
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
