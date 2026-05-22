import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";

import type { AdminPedido, AdminEnviosProps } from "../../components/admin/types";
import { ESTADOS, ESTADO_LABEL } from "../../components/admin/constants";
import AdminTrackingMap from "../../components/admin/map/AdminTrackingMap";
import "./AdminEnvios.css";

const API_URL = import.meta.env.VITE_API_URL;

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

  // Llama Nominatim (OpenStreetMap) para geocoding sin API key.
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

  // Arma el query string con id_usuario (requerido por verificarAdmin) + params extra.
  const adminQS = useCallback((extra: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams({ id_usuario: String(user.id_usuario) });
    Object.entries(extra).forEach(([k, v]) => { if (v !== undefined && v !== "") params.set(k, String(v)); });
    return params.toString();
  }, [user.id_usuario]);

  // GET /api/admin/pedidos — re-corre cuando cambia filtro o search (debounced 300ms).
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
  }, [selected?.id_pedido]);

  // PUT /api/admin/pedido/:id — manda todos los cambios pendientes del form de una vez.
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
    <div className="adm-page">
      <div className="adm-header">
        <div className="adm-header__left">
          <h1 className="adm-header__brand">
            <span className="adm-header__brand-accent">PREMIER</span>
            <span className="adm-header__brand-name">HUB</span>
            <span className="adm-header__brand-section">· Admin Envíos</span>
          </h1>
          <p className="adm-header__sub">Gestión manual de pedidos</p>
        </div>
        <div className="adm-header__right">
          <span className="adm-header__user">{user.nickname}</span>
          <button onClick={onLogout} className="adm-header__logout">Salir</button>
        </div>
      </div>

      {toast && (
        <div className={`adm-toast${toast.ok ? " adm-toast--ok" : " adm-toast--err"}`}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      <div className="adm-filters">
        <div className="adm-filters__chips">
          {["todos", ...ESTADOS].map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`adm-chip${filtroEstado === e ? " adm-chip--active" : ""}`}
            >
              {e === "todos" ? "Todos" : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
        <input
          placeholder="Buscar por # de pedido o tracking..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="adm-input adm-search"
        />
        <span className="adm-count">{pedidos.length} pedido{pedidos.length === 1 ? "" : "s"}</span>
      </div>

      <div className="adm-layout">
        <div className="adm-list">
          {loading && pedidos.length === 0 && <p className="adm-list__loading">Cargando...</p>}
          {!loading && pedidos.length === 0 && (
            <p className="adm-list__empty">Sin pedidos para los filtros aplicados</p>
          )}
          {pedidos.map(p => {
            const isSel = selected?.id_pedido === p.id_pedido;
            return (
              <div
                key={p.id_pedido}
                onClick={() => setSelected(p)}
                className={`adm-order${isSel ? " adm-order--sel" : ""}`}
              >
                <div className="adm-order__top">
                  <span className="adm-order__id">#{p.id_pedido}</span>
                  <span className="adm-order__status" data-estado={p.estado}>
                    {ESTADO_LABEL[p.estado]}
                  </span>
                </div>
                <p className="adm-order__name">{p.producto?.nombre || `Producto #${p.id_producto}`}</p>
                <p className="adm-order__user">
                  {p.usuario?.nickname || p.usuario?.correo || `User #${p.id_usuario}`}
                  {p.variante ? ` · talla ${p.variante.talla}` : ""}
                </p>
                <p className="adm-order__date">{new Date(p.fecha_pedido).toLocaleString("es-MX")}</p>
              </div>
            );
          })}
        </div>

        {!selected ? (
          <div className="adm-detail--empty">
            <p className="adm-detail__empty-text">Seleccioná un pedido para gestionarlo</p>
          </div>
        ) : (() => {
          const dirSnap = selected.direccion_snapshot || {};
          const isLocked = selected.estado === "entregado" || selected.estado === "cancelado";
          return (
            <div className="adm-detail">
              <div className="adm-detail__header">
                <div>
                  <span className="adm-detail__id">#{selected.id_pedido}</span>
                  <p className="adm-detail__name">{selected.producto?.nombre || `Producto #${selected.id_producto}`}</p>
                  <p className="adm-detail__client">
                    Cliente: <strong className="adm-text-mid">{selected.usuario?.nickname || selected.usuario?.nombre_usuario || `#${selected.id_usuario}`}</strong>
                    {selected.usuario?.correo && <span className="adm-text-soft"> · {selected.usuario.correo}</span>}
                  </p>
                  <p className="adm-detail__meta">
                    {selected.variante ? `Talla ${selected.variante.talla} · ` : ""}
                    {Number(selected.costo).toLocaleString()} pts · {new Date(selected.fecha_pedido).toLocaleString("es-MX")}
                  </p>
                </div>
                <span className="adm-detail__status" data-estado={selected.estado}>
                  {ESTADO_LABEL[selected.estado]}
                </span>
              </div>

              {isLocked && (
                <div className={`adm-locked${selected.estado === "entregado" ? " adm-locked--delivered" : " adm-locked--canceled"}`}>
                  <span className="adm-locked__icon">{selected.estado === "entregado" ? "✓" : "✕"}</span>
                  <div>
                    <p className="adm-locked__title">Pedido {ESTADO_LABEL[selected.estado].toLowerCase()}</p>
                    <p className="adm-locked__text">Este pedido ya está cerrado y no puede modificarse.</p>
                  </div>
                </div>
              )}

              {!isLocked && (
                <div>
                  <h4 className="adm-section-title">
                    Cambiar estado
                    {estadoCambio && <span className="adm-pending-tag">· pendiente de guardar</span>}
                  </h4>
                  <div className="adm-estado-btns">
                    {ESTADOS.map(est => {
                      const sel = estadoPendiente === est;
                      const original = selected.estado === est;
                      return (
                        <button
                          key={est}
                          disabled={sel}
                          onClick={() => setEstadoPendiente(est)}
                          className={`adm-estado-btn${sel ? " adm-estado-btn--sel" : original ? " adm-estado-btn--orig" : ""}`}
                          data-estado={sel ? est : undefined}
                        >
                          {ESTADO_LABEL[est]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="adm-dir-box">
                <h4 className="adm-dir-title">Dirección de entrega</h4>
                <p className="adm-dir-name">{dirSnap.nombre_destinatario || "—"}{dirSnap.telefono ? ` · ${dirSnap.telefono}` : ""}</p>
                <p className="adm-dir-addr">{dirSnap.calle || ""}{dirSnap.ciudad ? `, ${dirSnap.ciudad}` : ""}{dirSnap.estado ? `, ${dirSnap.estado}` : ""}{dirSnap.codigo_postal ? ` ${dirSnap.codigo_postal}` : ""}{dirSnap.pais ? ` · ${dirSnap.pais}` : ""}</p>
              </div>

              {selected.lat_destino != null && selected.lng_destino != null && (
                <div>
                  <div className="adm-map-header">
                    <h4 className="adm-section-title">Ubicación del paquete</h4>
                    {!isLocked && <p className="adm-map-hint">Busca un lugar o haz click en el mapa</p>}
                  </div>
                  {!isLocked && (
                    <div className="adm-geo-row">
                      <input
                        type="text"
                        value={geoSearch}
                        onChange={(e) => setGeoSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarLugar(geoSearch, true); } }}
                        placeholder="Buscar lugar (ej. FedEx Polanco 222, CDMX)"
                        className="adm-input adm-geo-input"
                      />
                      <button
                        type="button"
                        onClick={() => buscarLugar(geoSearch, true)}
                        disabled={geoSearching || !geoSearch.trim()}
                        className={`adm-geo-btn${geoSearching || !geoSearch.trim() ? " adm-geo-btn--off" : " adm-geo-btn--active"}`}
                      >
                        {geoSearching ? "..." : "Buscar"}
                      </button>
                      {geoResults.length > 0 && (
                        <div className="adm-geo-dropdown">
                          {geoResults.map(r => (
                            <button
                              key={r.place_id}
                              type="button"
                              onClick={() => elegirLugar(r)}
                              className="adm-geo-item"
                            >
                              {r.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!isLocked && geoError && <p className="adm-geo-error">{geoError}</p>}
                  <AdminTrackingMap
                    destLat={Number(selected.lat_destino)}
                    destLng={Number(selected.lng_destino)}
                    actualLat={latActual}
                    actualLng={lngActual}
                    onMovePackage={isLocked ? () => {} : (la, ln) => { setLatActual(la); setLngActual(ln); }}
                  />
                  <div className="adm-map-coords-row">
                    <p className="adm-map-coords">
                      {latActual != null && lngActual != null
                        ? `${latActual.toFixed(4)}, ${lngActual.toFixed(4)}`
                        : "Paquete sin ubicación"}
                    </p>
                    {ubicacionCambio && <span className="adm-map-pending">· pendiente de guardar</span>}
                  </div>
                </div>
              )}

              <div className="adm-info-section">
                <h4 className="adm-section-title">
                  Información de envío
                  {infoCambio && <span className="adm-pending-tag">· pendiente de guardar</span>}
                </h4>
                <div className="adm-info-grid">
                  <input
                    placeholder="Número de tracking"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    disabled={isLocked}
                    className="adm-input"
                  />
                  <input
                    type="date"
                    value={fechaEstimada}
                    onChange={(e) => setFechaEstimada(e.target.value)}
                    disabled={isLocked}
                    className="adm-input"
                  />
                </div>
                <textarea
                  placeholder="Notas para el cliente (opcional)"
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  disabled={isLocked}
                  className="adm-input adm-textarea"
                />
              </div>

              {!isLocked && (
                <div className="adm-actions">
                  <button
                    onClick={descartarCambios}
                    disabled={!hayCambios || saving}
                    className="adm-btn adm-btn--discard"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={guardarTodo}
                    disabled={!hayCambios || saving}
                    className="adm-btn adm-btn--save"
                  >
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
