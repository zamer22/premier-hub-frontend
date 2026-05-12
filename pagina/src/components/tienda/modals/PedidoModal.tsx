import type { Pedido, NewDireccionForm } from "../types";
import { tipoLabel } from "../utils";
import { ESTADO_PEDIDO_LABEL, ESTADO_PEDIDO_COLOR, ESTADO_FLOW, inputStyle } from "../constants";
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
    <div className="t-overlay" style={{ zIndex: 9005, overflowY: "auto" }} onClick={onClose}>
      <div className="t-modal t-modal--xxl" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ color: "#263a55", fontSize: "1.05rem", fontWeight: 800 }}>Pedido #{p.id_pedido}</h3>
            <p style={{ color: "#84878F", fontSize: "0.76rem" }}>{new Date(p.fecha_pedido).toLocaleString("es-MX")}</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#84878F", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
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

          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.85rem 1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <h4 style={{ fontSize: "0.74rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dirección de entrega</h4>
              {p.estado === "procesando" && !editingDireccion && (
                <button onClick={onIniciarEditar}
                  style={{ background: "transparent", border: "none", color: "#E90052", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}>
                  Editar
                </button>
              )}
            </div>

            {!editingDireccion ? (
              <>
                <p style={{ fontSize: "0.85rem", color: "#263a55", fontWeight: 600 }}>{dirSnap.nombre_destinatario || "—"}{dirSnap.telefono ? ` · ${dirSnap.telefono}` : ""}</p>
                <p style={{ fontSize: "0.78rem", color: "#374151" }}>{dirSnap.calle || ""}{dirSnap.ciudad ? `, ${dirSnap.ciudad}` : ""}{dirSnap.estado ? `, ${dirSnap.estado}` : ""}{dirSnap.codigo_postal ? ` ${dirSnap.codigo_postal}` : ""}</p>
                {p.estado !== "procesando" && (
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.4rem", fontStyle: "italic" }}>Ya no puedes editar la dirección porque el pedido salió de "procesando".</p>
                )}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <input placeholder="Alias" value={direccionForm.alias}
                    onChange={(e) => set("alias", e.target.value)} style={inputStyle} />
                  <input placeholder="Nombre del destinatario" value={direccionForm.nombre_destinatario}
                    onChange={(e) => set("nombre_destinatario", e.target.value)} style={inputStyle} />
                </div>
                <input placeholder="Teléfono (opcional)" value={direccionForm.telefono}
                  onChange={(e) => set("telefono", e.target.value)} style={inputStyle} />
                <input placeholder="Calle y número" value={direccionForm.calle}
                  onChange={(e) => set("calle", e.target.value)} style={inputStyle} />
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr", gap: "0.5rem" }}>
                  <input placeholder="Ciudad" value={direccionForm.ciudad}
                    onChange={(e) => set("ciudad", e.target.value)} style={inputStyle} />
                  <input placeholder="Estado" value={direccionForm.estado}
                    onChange={(e) => set("estado", e.target.value)} style={inputStyle} />
                  <input placeholder="CP" value={direccionForm.codigo_postal}
                    onChange={(e) => set("codigo_postal", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <label style={{ fontSize: "0.7rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Ubicación en mapa</label>
                    <button type="button" onClick={handleGeolocate}
                      style={{ background: "transparent", border: "none", color: "#E90052", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                      Usar mi ubicación
                    </button>
                  </div>
                  <LocationPicker lat={direccionForm.lat} lng={direccionForm.lng}
                    onChange={(lat, lng) => onDireccionFormChange({ ...direccionForm, lat, lng })} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={onCancelarEditar} disabled={savingDireccion}
                    style={{ flex: 1, padding: "0.55rem", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>
                    Cancelar
                  </button>
                  <button onClick={onGuardarDireccion} disabled={savingDireccion}
                    style={{ flex: 1, padding: "0.55rem", borderRadius: "8px", border: "none", background: "#E90052", color: "#fff", cursor: savingDireccion ? "wait" : "pointer", fontWeight: 700, fontSize: "0.8rem" }}>
                    {savingDireccion ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            )}
          </div>

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
                  <span style={{ fontWeight: 700, color: "#263a55" }}>
                    {new Date(p.fecha_estimada).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </p>
              )}
              {p.notas_admin && (
                <p style={{ fontSize: "0.78rem", color: "#374151", marginTop: "0.3rem", fontStyle: "italic" }}>"{p.notas_admin}"</p>
              )}
            </div>
          )}

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
            <p style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>
              Entregado el {new Date(p.fecha_entrega).toLocaleString("es-MX")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
