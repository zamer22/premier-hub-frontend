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
const estadoClass = (estado: AdminPedido["estado"]) => `admin-envios__status admin-envios__status--${estado}`;

/* ── Map helpers ── */
const destinoIcon = L.divIcon({
  html: `<div class="admin-envios__map-icon admin-envios__map-icon--home">🏠</div>`,
  className: "admin-envios__map-icon-wrapper leaflet-div-icon", iconSize: [34, 34], iconAnchor: [17, 17],
});
const paqueteIcon = L.divIcon({
  html: `<div class="admin-envios__map-icon admin-envios__map-icon--package">📦</div>`,
  className: "admin-envios__map-icon-wrapper leaflet-div-icon", iconSize: [34, 34], iconAnchor: [17, 17],
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
    <MapContainer center={[destLat, destLng]} zoom={4} className="admin-envios__map">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[destLat, destLng]} icon={destinoIcon} />
      {tienePaquete && (
        <>
          <Marker position={[actualLat as number, actualLng as number]} icon={paqueteIcon} />
          <Polyline positions={puntos} pathOptions={{ color: "#2563eb", dashArray: "8, 6", weight: 3 }} />
        </>
      )}
      <FitBounds points={puntos} />
      <ClickHandler />
    </MapContainer>
  );
}

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
    <div className="admin-envios">
      {/* Header */}
      <div className="admin-envios__header">
        <div>
          <h1 className="admin-envios__title">
            <span className="admin-envios__brand">PREMIER</span>
            <span className="admin-envios__brand-light">HUB</span>
            <span className="admin-envios__subtitle">· Admin Envíos</span>
          </h1>
          <p className="admin-envios__tagline">Gestión manual de pedidos</p>
        </div>
        <div className="admin-envios__user">
          <span className="admin-envios__user-name">{user.nickname}</span>
          <button
            onClick={onLogout}
            className="admin-envios__logout"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`admin-envios__toast ${toast.ok ? "is-ok" : "is-error"}`}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* Filtros */}
      <div className="admin-envios__filters">
        <div className="admin-envios__filter-list">
          {["todos", ...ESTADOS].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`admin-envios__filter-btn ${filtroEstado === e ? "is-active" : ""}`}>
              {e === "todos" ? "Todos" : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
        <input
          placeholder="Buscar por # de pedido o tracking..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-envios__input admin-envios__search"
        />
        <span className="admin-envios__count">
          {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Layout */}
      <div className="admin-envios__layout">
        {/* Lista */}
        <div className="admin-envios__list">
          {loading && pedidos.length === 0 && <p className="admin-envios__empty">Cargando...</p>}
          {!loading && pedidos.length === 0 && (
            <p className="admin-envios__empty admin-envios__empty--boxed">Sin pedidos para los filtros aplicados</p>
          )}
          {pedidos.map(p => {
            const isSel = selected?.id_pedido === p.id_pedido;
            return (
              <div key={p.id_pedido} onClick={() => setSelected(p)}
                className={`admin-envios__card ${isSel ? "is-selected" : ""}`}>
                <div className="admin-envios__card-header">
                  <span className="admin-envios__order-id">#{p.id_pedido}</span>
                  <span className={estadoClass(p.estado)}>
                    {ESTADO_LABEL[p.estado]}
                  </span>
                </div>
                <p className="admin-envios__card-title">{p.producto?.nombre || `Producto #${p.id_producto}`}</p>
                <p className="admin-envios__card-meta">
                  {p.usuario?.nickname || p.usuario?.correo || `User #${p.id_usuario}`}
                  {p.variante ? ` · talla ${p.variante.talla}` : ""}
                </p>
                <p className="admin-envios__card-date">{new Date(p.fecha_pedido).toLocaleString("es-MX")}</p>
              </div>
            );
          })}
        </div>

        {/* Detalle */}
        {!selected ? (
          <div className="admin-envios__empty-detail">
            <p className="admin-envios__empty-detail-text">Seleccioná un pedido para gestionarlo</p>
          </div>
        ) : (() => {
          const dirSnap = selected.direccion_snapshot || {};
          const isLocked = selected.estado === "entregado" || selected.estado === "cancelado";
          return (
            <div className="admin-envios__detail">
              {/* Encabezado */}
              <div className="admin-envios__detail-header">
                <div>
                  <span className="admin-envios__order-id admin-envios__order-id--large">#{selected.id_pedido}</span>
                  <p className="admin-envios__detail-title">{selected.producto?.nombre || `Producto #${selected.id_producto}`}</p>
                  <p className="admin-envios__detail-meta">
                    Cliente: <strong className="admin-envios__detail-strong">{selected.usuario?.nickname || selected.usuario?.nombre_usuario || `#${selected.id_usuario}`}</strong>
                    {selected.usuario?.correo && <span className="admin-envios__detail-email"> · {selected.usuario.correo}</span>}
                  </p>
                  <p className="admin-envios__detail-sub">
                    {selected.variante ? `Talla ${selected.variante.talla} · ` : ""}
                    {Number(selected.costo).toLocaleString()} pts · {new Date(selected.fecha_pedido).toLocaleString("es-MX")}
                  </p>
                </div>
                <span className={estadoClass(selected.estado)}>
                  {ESTADO_LABEL[selected.estado]}
                </span>
              </div>

              {/* Banner: pedido finalizado (no editable) */}
              {isLocked && (
                <div className={`admin-envios__locked-banner ${selected.estado === "entregado" ? "is-delivered" : "is-cancelled"}`}>
                  <span className="admin-envios__locked-icon">{selected.estado === "entregado" ? "✓" : "✕"}</span>
                  <div>
                    <p className="admin-envios__locked-title">
                      Pedido {ESTADO_LABEL[selected.estado].toLowerCase()}
                    </p>
                    <p className="admin-envios__locked-sub">
                      Este pedido ya está cerrado y no puede modificarse.
                    </p>
                  </div>
                </div>
              )}

              {/* Estado: botones */}
              {!isLocked && (
                <div>
                  <h4 className="admin-envios__section-title">
                    Cambiar estado
                    {estadoCambio && (
                      <span className="admin-envios__pending">
                        · pendiente de guardar
                      </span>
                    )}
                  </h4>
                  <div className="admin-envios__state-buttons">
                    {ESTADOS.map(est => {
                      const sel = estadoPendiente === est;
                      const original = selected.estado === est;
                      return (
                        <button key={est} disabled={sel} onClick={() => setEstadoPendiente(est)}
                          className={`admin-envios__state-btn admin-envios__state-btn--${est} ${sel ? "is-selected" : ""} ${original ? "is-original" : ""}`}>
                          {ESTADO_LABEL[est]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dirección */}
              <div className="admin-envios__address">
                <h4 className="admin-envios__section-title admin-envios__section-title--compact">Dirección de entrega</h4>
                <p className="admin-envios__address-name">{dirSnap.nombre_destinatario || "—"}{dirSnap.telefono ? ` · ${dirSnap.telefono}` : ""}</p>
                <p className="admin-envios__address-line">{dirSnap.calle || ""}{dirSnap.ciudad ? `, ${dirSnap.ciudad}` : ""}{dirSnap.estado ? `, ${dirSnap.estado}` : ""}{dirSnap.codigo_postal ? ` ${dirSnap.codigo_postal}` : ""}{dirSnap.pais ? ` · ${dirSnap.pais}` : ""}</p>
              </div>

              {/* Mapa */}
              {selected.lat_destino != null && selected.lng_destino != null && (
                <div>
                  <div className="admin-envios__map-header">
                    <h4 className="admin-envios__section-title admin-envios__section-title--compact">
                      Ubicación del paquete
                    </h4>
                    {!isLocked && (
                      <p className="admin-envios__map-hint">Busca un lugar o haz click en el mapa</p>
                    )}
                  </div>
                  {!isLocked && (
                  <div className="admin-envios__geo-search">
                    <input
                      type="text"
                      value={geoSearch}
                      onChange={(e) => setGeoSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarLugar(geoSearch, true); } }}
                      placeholder="Buscar lugar (ej. FedEx Polanco 222, CDMX)"
                      className="admin-envios__input admin-envios__geo-input"
                    />
                    <button type="button" onClick={() => buscarLugar(geoSearch, true)} disabled={geoSearching || !geoSearch.trim()}
                      className="admin-envios__geo-btn">
                      {geoSearching ? "..." : "Buscar"}
                    </button>
                    {geoResults.length > 0 && (
                      <div className="admin-envios__geo-results">
                        {geoResults.map(r => (
                          <button key={r.place_id} type="button" onClick={() => elegirLugar(r)}
                            className="admin-envios__geo-item">
                            {r.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                  {!isLocked && geoError && <p className="admin-envios__geo-error">{geoError}</p>}
                  <AdminTrackingMap
                    destLat={Number(selected.lat_destino)}
                    destLng={Number(selected.lng_destino)}
                    actualLat={latActual}
                    actualLng={lngActual}
                    onMovePackage={isLocked ? () => {} : (la, ln) => { setLatActual(la); setLngActual(ln); }}
                  />
                  <div className="admin-envios__coords">
                    <p className="admin-envios__coords-text">
                      {latActual != null && lngActual != null
                        ? `${latActual.toFixed(4)}, ${lngActual.toFixed(4)}`
                        : "Paquete sin ubicación"}
                    </p>
                    {ubicacionCambio && (
                      <span className="admin-envios__pending">
                        · pendiente de guardar
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Info de envío */}
              <div className="admin-envios__info">
                <h4 className="admin-envios__section-title admin-envios__section-title--compact">
                  Información de envío
                  {infoCambio && (
                    <span className="admin-envios__pending">
                      · pendiente de guardar
                    </span>
                  )}
                </h4>
                <div className="admin-envios__info-grid">
                  <input placeholder="Número de tracking" value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    disabled={isLocked}
                    className="admin-envios__input" />
                  <input type="date" value={fechaEstimada}
                    onChange={(e) => setFechaEstimada(e.target.value)}
                    disabled={isLocked}
                    className="admin-envios__input" />
                </div>
                <textarea placeholder="Notas para el cliente (opcional)" rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  disabled={isLocked}
                  className="admin-envios__textarea" />
              </div>

              {/* Barra de guardado global */}
              {!isLocked && (
                <div className="admin-envios__actions">
                  <button onClick={descartarCambios} disabled={!hayCambios || saving}
                    className="admin-envios__btn admin-envios__btn--secondary">
                    Descartar
                  </button>
                  <button onClick={guardarTodo} disabled={!hayCambios || saving}
                    className="admin-envios__btn admin-envios__btn--primary">
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
