import type { Pedido, NewDireccionForm } from "../types";
import { tipoLabel } from "../utils";
import { ESTADO_PEDIDO_LABEL, ESTADO_PEDIDO_COLOR, ESTADO_FLOW } from "../constants";
import TrackingMap from "../map/TrackingMap";
import LocationPicker from "../map/LocationPicker";
import "../../../estilos/Tienda.css";

interface PedidoModalProps {
  pedido: Pedido;
  editingDireccion: boolean;
  direccionForm: NewDireccionForm;
  onDireccionFormChange: (f: NewDireccionForm) => void;
  savingDireccion: boolean;
  onIniciarEditar: () => void;
  onGuardarDireccion: () => void;
  onCancelarEditar: () => void;
  onClose: () => void;
  showToast: (msg: string, ok: boolean) => void;
}

// Timeline de estados + mapa de tracking (TrackingMap) + edición de dirección (solo en procesando).
export default function PedidoModal({
  pedido, editingDireccion, direccionForm, onDireccionFormChange,
  savingDireccion, onIniciarEditar, onGuardarDireccion, onCancelarEditar,
  onClose, showToast,
}: PedidoModalProps) {
  const p = pedido;
  const dirSnap = p.direccion_snapshot || {};
  const idx = ESTADO_FLOW.indexOf(p.estado as any);
  const color = ESTADO_PEDIDO_COLOR[p.estado] || ESTADO_PEDIDO_COLOR.procesando;

  const set = (field: keyof NewDireccionForm, value: any) =>
    onDireccionFormChange({ ...direccionForm, [field]: value });

  const handleGeolocate = () => {
    if (!navigator.geolocation) { showToast("Geolocalización no disponible", false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => onDireccionFormChange({ ...direccionForm, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => showToast("No se pudo obtener tu ubicación", false),
    );
  };

  return (
    <div className="t-overlay t-overlay--scroll" style={{ zIndex: 9005 }} onClick={onClose}>
      <div className="t-modal t-modal--xxl" onClick={(e) => e.stopPropagation()}>
        <div className="t-modal-header">
          <div>
            <h3 className="t-modal-header__title">Pedido #{p.id_pedido}</h3>
            <p className="t-modal-header__sub">{new Date(p.fecha_pedido).toLocaleString("es-MX")}</p>
          </div>
          <button onClick={onClose} className="t-modal-close">✕</button>
        </div>

        <div className="t-modal-body t-modal-body--col">
          <div className="t-pedido-row">
            <div
              className="t-pedido-img"
              style={{ background: p.producto?.imagen ? `#f5f6f8 url(${p.producto.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55, #871d54)" }}
            />
            <div className="t-pedido-info">
              <p className="t-pedido-info__name">{p.producto?.nombre || `Producto #${p.id_producto}`}</p>
              <p className="t-pedido-info__meta">
                {p.producto?.tipo ? tipoLabel(p.producto.tipo) : ""}{p.variante ? ` · talla ${p.variante.talla}` : ""}
              </p>
              <p className="t-pedido-info__price">{Number(p.costo).toLocaleString()} pts</p>
            </div>
            <span className="t-status-badge" style={{ background: color.bg, color: color.fg }}>
              {ESTADO_PEDIDO_LABEL[p.estado] || p.estado}
            </span>
          </div>

          {p.estado !== "cancelado" && (
            <div>
              <h4 className="t-section-title t-section-title--mb">Estado del envío</h4>
              <div className="t-timeline-wrap">
                <div className="t-timeline-bar-bg" />
                <div
                  className="t-timeline-bar-bg"
                  style={{
                    background: "#E90052",
                    right: "auto",
                    zIndex: 1,
                    width: idx > 0 ? `calc(${(idx / (ESTADO_FLOW.length - 1)) * 100}% - 24px)` : "0",
                  }}
                />
                {ESTADO_FLOW.map((est, i) => {
                  const reached = i <= idx;
                  return (
                    <div key={est} className="t-timeline-step">
                      <div className={`t-timeline-dot${reached ? " t-timeline-dot--done" : " t-timeline-dot--todo"}`}>
                        {reached ? "✓" : i + 1}
                      </div>
                      <p className={`t-timeline-label${reached ? "" : " t-timeline-label--todo"}`}>
                        {ESTADO_PEDIDO_LABEL[est]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="t-box">
            <div className="t-section-header">
              <h4 className="t-section-title">Dirección de entrega</h4>
              {p.estado === "procesando" && !editingDireccion && (
                <button onClick={onIniciarEditar} className="t-link-btn">Editar</button>
              )}
            </div>

            {!editingDireccion ? (
              <>
                <p className="t-addr-name">
                  {dirSnap.nombre_destinatario || "—"}{dirSnap.telefono ? ` · ${dirSnap.telefono}` : ""}
                </p>
                <p className="t-addr-text">
                  {dirSnap.calle || ""}{dirSnap.ciudad ? `, ${dirSnap.ciudad}` : ""}{dirSnap.estado ? `, ${dirSnap.estado}` : ""}{dirSnap.codigo_postal ? ` ${dirSnap.codigo_postal}` : ""}
                </p>
                {p.estado !== "procesando" && (
                  <p className="t-locked-note">Ya no puedes editar la dirección porque el pedido salió de "procesando".</p>
                )}
              </>
            ) : (
              <div className="t-dir-edit-form">
                <div className="t-dir-form-grid">
                  <input placeholder="Alias" value={direccionForm.alias}
                    onChange={(e) => set("alias", e.target.value)} className="t-input" />
                  <input placeholder="Nombre del destinatario" value={direccionForm.nombre_destinatario}
                    onChange={(e) => set("nombre_destinatario", e.target.value)} className="t-input" />
                </div>
                <input placeholder="Teléfono (opcional)" value={direccionForm.telefono}
                  onChange={(e) => set("telefono", e.target.value)} className="t-input" />
                <input placeholder="Calle y número" value={direccionForm.calle}
                  onChange={(e) => set("calle", e.target.value)} className="t-input" />
                <div className="t-dir-form-grid--3">
                  <input placeholder="Ciudad" value={direccionForm.ciudad}
                    onChange={(e) => set("ciudad", e.target.value)} className="t-input" />
                  <input placeholder="Estado" value={direccionForm.estado}
                    onChange={(e) => set("estado", e.target.value)} className="t-input" />
                  <input placeholder="CP" value={direccionForm.codigo_postal}
                    onChange={(e) => set("codigo_postal", e.target.value)} className="t-input" />
                </div>
                <div>
                  <div className="t-dir-map-header">
                    <label className="t-section-title">Ubicación en mapa</label>
                    <button type="button" onClick={handleGeolocate} className="t-dir-geo-btn">
                      Usar mi ubicación
                    </button>
                  </div>
                  <LocationPicker
                    lat={direccionForm.lat} lng={direccionForm.lng}
                    onChange={(lat, lng) => onDireccionFormChange({ ...direccionForm, lat, lng })}
                  />
                </div>
                <div className="t-btn-row">
                  <button onClick={onCancelarEditar} disabled={savingDireccion} className="t-modal-btn t-modal-btn--cancel">
                    Cancelar
                  </button>
                  <button onClick={onGuardarDireccion} disabled={savingDireccion} className="t-modal-btn t-modal-btn--primary">
                    {savingDireccion ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {(p.tracking_numero || p.fecha_estimada || p.notas_admin) && (
            <div className="t-box t-box--info">
              <h4 className="t-section-title t-section-title--mb-sm">Información de envío</h4>
              {p.tracking_numero && (
                <p className="t-tracking-row">
                  <span className="t-tracking-key">Tracking: </span>
                  <span className="t-tracking-val">{p.tracking_numero}</span>
                </p>
              )}
              {p.fecha_estimada && (
                <p className="t-tracking-row">
                  <span className="t-tracking-key">Entrega estimada: </span>
                  <span className="t-tracking-date">
                    {new Date(p.fecha_estimada).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </p>
              )}
              {p.notas_admin && <p className="t-tracking-note">"{p.notas_admin}"</p>}
            </div>
          )}

          {p.lat_destino != null && p.lng_destino != null && (
            <div>
              <h4 className="t-map-header">
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
                <p className="t-map-legend">
                  <span className="t-map-legend__item">
                    <span className="t-map-legend__dot t-map-legend__dot--pkg" /> Paquete
                  </span>
                  <span className="t-map-legend__item">
                    <span className="t-map-legend__dot t-map-legend__dot--dest" /> Destino
                  </span>
                </p>
              )}
            </div>
          )}

          {p.fecha_entrega && (
            <p className="t-delivered-date">
              Entregado el {new Date(p.fecha_entrega).toLocaleString("es-MX")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
