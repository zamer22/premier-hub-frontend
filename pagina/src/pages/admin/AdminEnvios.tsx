import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./AdminEnvios.css";

const API_URL = import.meta.env.VITE_API_URL;

/* ── Tipos ── */
interface AdminPedido {
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
  producto?: { id_producto: number; nombre: string; imagen: string | null; tipo: string } | null;
  variante?: { id_variante: number; talla: string } | null;
  usuario?: { id_usuario: number; nickname: string | null; nombre_usuario: string | null; correo: string | null } | null;
}

interface AdminEnviosProps {
  user: { id_usuario: number; nickname: string; es_admin?: boolean; [k: string]: any };
  onLogout: () => void;
}

const ESTADOS: AdminPedido["estado"][] = ["procesando", "enviado", "en_camino", "entregado", "cancelado"];
const ESTADO_LABEL: Record<string, string> = {
  procesando: "Procesando", enviado: "Enviado", en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado",
};
const ESTADO_COLOR: Record<string, { bg: string; fg: string }> = {
  procesando: { bg: "#fef3c7", fg: "#92400e" },
  enviado:    { bg: "#dbeafe", fg: "#1e40af" },
  en_camino:  { bg: "#e0e7ff", fg: "#4338ca" },
  entregado:  { bg: "#dcfce7", fg: "var(--ph-green-600)" },
  cancelado:  { bg: "#fee2e2", fg: "var(--ph-danger-600)" },
};

/* ── Map helpers ── */
const destinoIcon = L.divIcon({
  html: `<div style="background:var(--ph-red-600);color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">🏠</div>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 17],
});
const paqueteIcon = L.divIcon({
  html: `<div style="background:var(--ph-blue-600);color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">📦</div>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 17],
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

function AdminTrackingMap({
  destLat, destLng, actualLat, actualLng, onMovePackage,
}: {
  destLat: number; destLng: number;
  actualLat: number | null; actualLng: number | null;
  onMovePackage: (lat: number, lng: number) => void;
}) {
  function ClickHandler() {
    useMapEvents({ click: (e) => onMovePackage(e.latlng.lat, e.latlng.lng) });
    return null;
  }
  const tienePaquete = actualLat != null && actualLng != null;
  const puntos: [number, number][] = tienePaquete
    ? [[actualLat as number, actualLng as number], [destLat, destLng]]
    : [[destLat, destLng]];
  return (
    <MapContainer center={[destLat, destLng]} zoom={4} style={{ height: "320px", width: "100%", borderRadius: "10px", border: "1px solid var(--ph-border)" }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[destLat, destLng]} icon={destinoIcon} />
      {tienePaquete && (
        <>
          <Marker position={[actualLat as number, actualLng as number]} icon={paqueteIcon} />
          <Polyline positions={puntos} pathOptions={{ color: "var(--ph-blue-600)", dashArray: "8, 6", weight: 3 }} />
        </>
      )}
      <FitBounds points={puntos} />
      <ClickHandler />
    </MapContainer>
  );
}

const inputBase: React.CSSProperties = {
  padding: "0.55rem 0.7rem", border: "1.5px solid #e0e0e0", borderRadius: "8px",
  fontSize: "0.85rem", outline: "none", width: "100%", boxSizing: "border-box",
  color: "var(--ph-navy-700)", background: "#fff",
};

/* ── Component ── */
export default function AdminEnvios({ user, onLogout }: AdminEnviosProps) {
  const [pedidos, setPedidos] = useState<AdminPedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminPedido | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form local del pedido seleccionado (cambios pendientes)
  const [estadoPendiente, setEstadoPendiente] = useState<AdminPedido["estado"] | null>(null);
  const [tracking, setTracking] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");
  const [notas, setNotas] = useState("");
  const [latActual, setLatActual] = useState<number | null>(null);
  const [lngActual, setLngActual] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Buscador de lugar para ubicar el paquete
  const [geoSearch, setGeoSearch] = useState("");
  const [geoResults, setGeoResults] = useState<{ display_name: string; lat: string; lon: string; place_id: number }[]>([]);
  const [geoSearching, setGeoSearching] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const geoJustSelected = useRef(false);

  const buscarLugar = async (q: string, manual: boolean) => {
    const term = q.trim();
    if (!term) return;
    setGeoSearching(true);
    setGeoError(null);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1&q=${encodeURIComponent(term)}`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await r.json();
      if (!Array.isArray(data) || data.length === 0) {
        setGeoResults([]);
        if (manual) setGeoError("Sin resultados. Intentá con más detalle o menos términos.");
      } else {
        setGeoResults(data);
      }
    } catch {
      if (manual) setGeoError("Error al buscar");
    } finally {
      setGeoSearching(false);
    }
  };

  // Búsqueda en vivo (debounced) a partir de 3 caracteres
  useEffect(() => {
    if (geoJustSelected.current) { geoJustSelected.current = false; return; }
    const term = geoSearch.trim();
    if (term.length < 3) { setGeoResults([]); setGeoError(null); return; }
    const t = setTimeout(() => buscarLugar(term, false), 500);
    return () => clearTimeout(t);
  }, [geoSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const elegirLugar = (r: { display_name: string; lat: string; lon: string }) => {
    setLatActual(Number(r.lat));
    setLngActual(Number(r.lon));
    setGeoResults([]);
    geoJustSelected.current = true;
    setGeoSearch(r.display_name);
  };

  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const adminQS = useCallback((extra: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams({ id_usuario: String(user.id_usuario) });
    Object.entries(extra).forEach(([k, v]) => { if (v !== undefined && v !== "") params.set(k, String(v)); });
    return params.toString();
  }, [user.id_usuario]);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const qs = adminQS({
        estado: filtroEstado !== "todos" ? filtroEstado : undefined,
        q: search.trim() || undefined,
      });
      const r = await fetch(`${API_URL}/api/admin/pedidos?${qs}`);
      const d = await r.json();
      if (d.success) setPedidos(d.data);
      else showToast(d.error || "Error", false);
    } catch { showToast("Error de conexión", false); }
    finally { setLoading(false); }
  }, [filtroEstado, search, adminQS]);

  useEffect(() => {
    const t = setTimeout(fetchPedidos, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchPedidos, search]);

  // Cuando cambia el seleccionado, populate form
  useEffect(() => {
    if (!selected) return;
    setEstadoPendiente(selected.estado);
    setTracking(selected.tracking_numero || "");
    setFechaEstimada(selected.fecha_estimada ? selected.fecha_estimada.slice(0, 10) : "");
    setNotas(selected.notas_admin || "");
    setLatActual(selected.lat_actual != null ? Number(selected.lat_actual) : null);
    setLngActual(selected.lng_actual != null ? Number(selected.lng_actual) : null);
    setGeoSearch("");
    setGeoResults([]);
    setGeoError(null);
  }, [selected?.id_pedido]); // eslint-disable-line react-hooks/exhaustive-deps

  const aplicarUpdate = async (body: Record<string, any>) => {
    if (!selected) return null;
    const r = await fetch(`${API_URL}/api/admin/pedido/${selected.id_pedido}?${adminQS()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!d.success) { showToast(d.error || "Error", false); return null; }
    setSelected(d.data);
    setPedidos(prev => prev.map(p => p.id_pedido === d.data.id_pedido ? d.data : p));
    return { pedido: d.data as AdminPedido, refunded: d.refunded as number | undefined, warning: d.warning as string | undefined };
  };

  const estadoCambio = useMemo(() => {
    if (!selected) return false;
    return estadoPendiente != null && estadoPendiente !== selected.estado;
  }, [selected, estadoPendiente]);

  const ubicacionCambio = useMemo(() => {
    if (!selected) return false;
    const origLat = selected.lat_actual != null ? Number(selected.lat_actual) : null;
    const origLng = selected.lng_actual != null ? Number(selected.lng_actual) : null;
    return origLat !== latActual || origLng !== lngActual;
  }, [selected, latActual, lngActual]);

  const infoCambio = useMemo(() => {
    if (!selected) return false;
    return (selected.tracking_numero || "") !== tracking
      || (selected.fecha_estimada ? selected.fecha_estimada.slice(0, 10) : "") !== fechaEstimada
      || (selected.notas_admin || "") !== notas;
  }, [selected, tracking, fechaEstimada, notas]);

  const hayCambios = estadoCambio || ubicacionCambio || infoCambio;

  const guardarTodo = async () => {
    if (!selected || !hayCambios) return;
    const body: Record<string, any> = {};
    if (estadoCambio && estadoPendiente) body.estado = estadoPendiente;
    if (ubicacionCambio) {
      body.lat_actual = latActual;
      body.lng_actual = lngActual;
    }
    if (infoCambio) {
      body.tracking_numero = tracking.trim() || null;
      body.fecha_estimada = fechaEstimada || null;
      body.notas_admin = notas.trim() || null;
    }
    setSaving(true);
    const result = await aplicarUpdate(body);
    setSaving(false);
    if (!result) return;
    if (result.warning) {
      showToast(result.warning, false);
    } else if (result.refunded != null) {
      showToast(`Cancelado · ${Number(result.refunded).toLocaleString()} pts devueltos al usuario`, true);
    } else {
      showToast("Cambios guardados", true);
    }
  };

  const descartarCambios = () => {
    if (!selected) return;
    setEstadoPendiente(selected.estado);
    setTracking(selected.tracking_numero || "");
    setFechaEstimada(selected.fecha_estimada ? selected.fecha_estimada.slice(0, 10) : "");
    setNotas(selected.notas_admin || "");
    setLatActual(selected.lat_actual != null ? Number(selected.lat_actual) : null);
    setLngActual(selected.lng_actual != null ? Number(selected.lng_actual) : null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ph-surface)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, var(--ph-navy-700), #1a2a3f)", color: "#fff", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            <span style={{ color: "var(--ph-red-600)" }}>PREMIER</span>
            <span style={{ color: "#fff" }}>HUB</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, marginLeft: "0.6rem", fontSize: "0.95rem" }}>· Admin Envíos</span>
          </h1>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>Gestión manual de pedidos</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{user.nickname}</span>
          <button
            onClick={onLogout}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", color: "#fff", padding: "0.4rem 0.95rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "80px", right: "2rem", padding: "0.75rem 1.25rem", background: toast.ok ? "var(--ph-green-600)" : "var(--ph-danger-600)", color: "#fff", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 9999 }}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* Filtros */}
      <div style={{ padding: "1.25rem 2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid var(--ph-border)", background: "#fff" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {["todos", ...ESTADOS].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              style={{
                padding: "0.4rem 0.85rem", borderRadius: "20px",
                border: "1px solid", borderColor: filtroEstado === e ? "var(--ph-navy-700)" : "#e0e0e0",
                background: filtroEstado === e ? "var(--ph-navy-700)" : "#fff",
                color: filtroEstado === e ? "#fff" : "var(--ph-muted)",
                fontSize: "0.78rem", fontWeight: filtroEstado === e ? 700 : 500,
                cursor: "pointer", textTransform: "capitalize",
              }}>
              {e === "todos" ? "Todos" : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
        <input
          placeholder="Buscar por # de pedido o tracking..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputBase, flex: "1", minWidth: "240px", maxWidth: "360px" }}
        />
        <span style={{ fontSize: "0.78rem", color: "var(--ph-muted)", fontWeight: 600 }}>
          {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 380px) 1fr", gap: "1.25rem", padding: "1.25rem 2rem", alignItems: "start" }}>
        {/* Lista */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "calc(100vh - 220px)", overflowY: "auto", paddingRight: "0.4rem" }}>
          {loading && pedidos.length === 0 && <p style={{ color: "var(--ph-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>Cargando...</p>}
          {!loading && pedidos.length === 0 && (
            <p style={{ color: "var(--ph-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem", background: "#fff", borderRadius: "10px" }}>Sin pedidos para los filtros aplicados</p>
          )}
          {pedidos.map(p => {
            const isSel = selected?.id_pedido === p.id_pedido;
            const color = ESTADO_COLOR[p.estado] || ESTADO_COLOR.procesando;
            return (
              <div key={p.id_pedido} onClick={() => setSelected(p)}
                style={{
                  background: "#fff", borderRadius: "10px", padding: "0.85rem 1rem",
                  border: isSel ? "2px solid var(--ph-red-600)" : "1px solid var(--ph-border)",
                  boxShadow: isSel ? "0 4px 12px rgba(233,0,82,0.15)" : "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.3rem",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ background: "var(--ph-navy-700)", color: "#fff", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800 }}>#{p.id_pedido}</span>
                  <span style={{ background: color.bg, color: color.fg, padding: "0.18rem 0.55rem", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {ESTADO_LABEL[p.estado]}
                  </span>
                </div>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ph-navy-700)" }}>{p.producto?.nombre || `Producto #${p.id_producto}`}</p>
                <p style={{ fontSize: "0.74rem", color: "var(--ph-muted)" }}>
                  {p.usuario?.nickname || p.usuario?.correo || `User #${p.id_usuario}`}
                  {p.variante ? ` · talla ${p.variante.talla}` : ""}
                </p>
                <p style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{new Date(p.fecha_pedido).toLocaleString("es-MX")}</p>
              </div>
            );
          })}
        </div>

        {/* Detalle */}
        {!selected ? (
          <div style={{ background: "#fff", borderRadius: "12px", padding: "4rem 2rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "var(--ph-muted)", fontSize: "0.9rem" }}>Seleccioná un pedido para gestionarlo</p>
          </div>
        ) : (() => {
          const dirSnap = selected.direccion_snapshot || {};
          const color = ESTADO_COLOR[selected.estado] || ESTADO_COLOR.procesando;
          const isLocked = selected.estado === "entregado" || selected.estado === "cancelado";
          return (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Encabezado */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", borderBottom: "1px solid #f0f0f0", paddingBottom: "1rem" }}>
                <div>
                  <span style={{ background: "var(--ph-navy-700)", color: "#fff", padding: "0.25rem 0.7rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 800 }}>#{selected.id_pedido}</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ph-navy-700)", marginTop: "0.5rem" }}>{selected.producto?.nombre || `Producto #${selected.id_producto}`}</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--ph-muted)" }}>
                    Cliente: <strong style={{ color: "#374151" }}>{selected.usuario?.nickname || selected.usuario?.nombre_usuario || `#${selected.id_usuario}`}</strong>
                    {selected.usuario?.correo && <span style={{ color: "var(--ph-muted)" }}> · {selected.usuario.correo}</span>}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--ph-muted)" }}>
                    {selected.variante ? `Talla ${selected.variante.talla} · ` : ""}
                    {Number(selected.costo).toLocaleString()} pts · {new Date(selected.fecha_pedido).toLocaleString("es-MX")}
                  </p>
                </div>
                <span style={{ background: color.bg, color: color.fg, padding: "0.3rem 0.85rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  {ESTADO_LABEL[selected.estado]}
                </span>
              </div>

              {/* Banner: pedido finalizado (no editable) */}
              {isLocked && (
                <div style={{
                  background: selected.estado === "entregado" ? "#dcfce7" : "#fee2e2",
                  border: `1px solid ${selected.estado === "entregado" ? "#86efac" : "#fecaca"}`,
                  borderRadius: "10px", padding: "0.85rem 1rem",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                }}>
                  <span style={{ fontSize: "1.1rem" }}>{selected.estado === "entregado" ? "✓" : "✕"}</span>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 700, color: selected.estado === "entregado" ? "#166534" : "#991b1b" }}>
                      Pedido {ESTADO_LABEL[selected.estado].toLowerCase()}
                    </p>
                    <p style={{ fontSize: "0.74rem", color: selected.estado === "entregado" ? "#166534" : "#991b1b" }}>
                      Este pedido ya está cerrado y no puede modificarse.
                    </p>
                  </div>
                </div>
              )}

              {/* Estado: botones */}
              {!isLocked && (
                <div>
                  <h4 style={{ fontSize: "0.74rem", color: "var(--ph-navy-700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                    Cambiar estado
                    {estadoCambio && (
                      <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--ph-red-600)", textTransform: "none", letterSpacing: 0 }}>
                        · pendiente de guardar
                      </span>
                    )}
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                    {ESTADOS.map(est => {
                      const sel = estadoPendiente === est;
                      const original = selected.estado === est;
                      const c = ESTADO_COLOR[est];
                      return (
                        <button key={est} disabled={sel} onClick={() => setEstadoPendiente(est)}
                          style={{
                            padding: "0.45rem 0.95rem", borderRadius: "8px",
                            border: sel ? "2px solid var(--ph-navy-700)" : original ? "1px dashed var(--ph-muted)" : "1px solid var(--ph-border)",
                            background: sel ? c.bg : "#fff",
                            color: sel ? c.fg : "#374151",
                            fontSize: "0.78rem", fontWeight: sel ? 800 : 600,
                            cursor: sel ? "default" : "pointer",
                            textTransform: "capitalize",
                          }}>
                          {ESTADO_LABEL[est]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dirección */}
              <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                <h4 style={{ fontSize: "0.74rem", color: "var(--ph-navy-700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Dirección de entrega</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--ph-navy-700)", fontWeight: 600 }}>{dirSnap.nombre_destinatario || "—"}{dirSnap.telefono ? ` · ${dirSnap.telefono}` : ""}</p>
                <p style={{ fontSize: "0.78rem", color: "#374151" }}>{dirSnap.calle || ""}{dirSnap.ciudad ? `, ${dirSnap.ciudad}` : ""}{dirSnap.estado ? `, ${dirSnap.estado}` : ""}{dirSnap.codigo_postal ? ` ${dirSnap.codigo_postal}` : ""}{dirSnap.pais ? ` · ${dirSnap.pais}` : ""}</p>
              </div>

              {/* Mapa */}
              {selected.lat_destino != null && selected.lng_destino != null && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <h4 style={{ fontSize: "0.74rem", color: "var(--ph-navy-700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Ubicación del paquete
                    </h4>
                    {!isLocked && (
                      <p style={{ fontSize: "0.7rem", color: "var(--ph-muted)", fontStyle: "italic" }}>Busca un lugar o haz click en el mapa</p>
                    )}
                  </div>
                  {!isLocked && (
                  <div style={{ display: "flex", gap: "0.4rem", position: "relative", marginBottom: "0.5rem" }}>
                    <input
                      type="text"
                      value={geoSearch}
                      onChange={(e) => setGeoSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarLugar(geoSearch, true); } }}
                      placeholder="Buscar lugar (ej. FedEx Polanco 222, CDMX)"
                      style={{ ...inputBase, flex: 1 }}
                    />
                    <button type="button" onClick={() => buscarLugar(geoSearch, true)} disabled={geoSearching || !geoSearch.trim()}
                      style={{
                        padding: "0.5rem 0.95rem", borderRadius: "8px", border: "none",
                        background: geoSearching || !geoSearch.trim() ? "#e0e0e0" : "var(--ph-navy-700)",
                        color: geoSearching || !geoSearch.trim() ? "#999" : "#fff",
                        fontSize: "0.78rem", fontWeight: 700,
                        cursor: geoSearching || !geoSearch.trim() ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                      }}>
                      {geoSearching ? "..." : "Buscar"}
                    </button>
                    {geoResults.length > 0 && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem",
                        background: "#fff", border: "1px solid var(--ph-border)", borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 1000, maxHeight: "200px", overflowY: "auto",
                      }}>
                        {geoResults.map(r => (
                          <button key={r.place_id} type="button" onClick={() => elegirLugar(r)}
                            style={{
                              display: "block", width: "100%", textAlign: "left",
                              padding: "0.55rem 0.75rem", border: "none", background: "transparent",
                              fontSize: "0.78rem", color: "var(--ph-navy-700)", cursor: "pointer",
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
                  )}
                  {!isLocked && geoError && <p style={{ fontSize: "0.72rem", color: "var(--ph-danger-600)", marginBottom: "0.5rem" }}>{geoError}</p>}
                  <AdminTrackingMap
                    destLat={Number(selected.lat_destino)}
                    destLng={Number(selected.lng_destino)}
                    actualLat={latActual}
                    actualLng={lngActual}
                    onMovePackage={isLocked ? () => {} : (la, ln) => { setLatActual(la); setLngActual(ln); }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <p style={{ fontSize: "0.72rem", color: "var(--ph-muted)" }}>
                      {latActual != null && lngActual != null
                        ? `${latActual.toFixed(4)}, ${lngActual.toFixed(4)}`
                        : "Paquete sin ubicación"}
                    </p>
                    {ubicacionCambio && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--ph-red-600)" }}>
                        · pendiente de guardar
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Info de envío */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <h4 style={{ fontSize: "0.74rem", color: "var(--ph-navy-700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Información de envío
                  {infoCambio && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--ph-red-600)", textTransform: "none", letterSpacing: 0 }}>
                      · pendiente de guardar
                    </span>
                  )}
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                  <input placeholder="Número de tracking" value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    disabled={isLocked}
                    style={{ ...inputBase, background: isLocked ? "var(--ph-surface)" : "#fff", color: isLocked ? "var(--ph-muted)" : "var(--ph-navy-700)" }} />
                  <input type="date" value={fechaEstimada}
                    onChange={(e) => setFechaEstimada(e.target.value)}
                    disabled={isLocked}
                    style={{ ...inputBase, background: isLocked ? "var(--ph-surface)" : "#fff", color: isLocked ? "var(--ph-muted)" : "var(--ph-navy-700)" }} />
                </div>
                <textarea placeholder="Notas para el cliente (opcional)" rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  disabled={isLocked}
                  style={{ ...inputBase, resize: "vertical", fontFamily: "inherit", background: isLocked ? "var(--ph-surface)" : "#fff", color: isLocked ? "var(--ph-muted)" : "var(--ph-navy-700)" }} />
              </div>

              {/* Barra de guardado global */}
              {!isLocked && (
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.6rem", borderTop: "1px solid #f0f0f0", paddingTop: "1rem" }}>
                  <button onClick={descartarCambios} disabled={!hayCambios || saving}
                    style={{
                      padding: "0.55rem 1.2rem", borderRadius: "8px",
                      border: "1px solid var(--ph-border)", background: "#fff",
                      color: !hayCambios || saving ? "#bbb" : "#374151",
                      fontWeight: 600, fontSize: "0.82rem",
                      cursor: !hayCambios || saving ? "not-allowed" : "pointer",
                    }}>
                    Descartar
                  </button>
                  <button onClick={guardarTodo} disabled={!hayCambios || saving}
                    style={{
                      padding: "0.55rem 1.5rem", borderRadius: "8px", border: "none",
                      background: !hayCambios || saving ? "#e0e0e0" : "var(--ph-red-600)",
                      color: !hayCambios || saving ? "#999" : "#fff",
                      fontWeight: 700, fontSize: "0.85rem",
                      cursor: !hayCambios || saving ? "not-allowed" : "pointer",
                    }}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
