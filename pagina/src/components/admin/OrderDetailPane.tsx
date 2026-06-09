import type { AdminPedido } from "./types";
import { ESTADOS, ESTADO_LABEL } from "./constants";
import AdminTrackingMap from "./map/AdminTrackingMap";
import GeoSearchBox from "./GeoSearchBox";

type Props = {
  pedido: AdminPedido;
  estadoPendiente: AdminPedido["estado"] | null;
  onEstadoChange: (e: AdminPedido["estado"]) => void;
  tracking: string;
  onTrackingChange: (v: string) => void;
  fechaEstimada: string;
  onFechaEstimadaChange: (v: string) => void;
  notas: string;
  onNotasChange: (v: string) => void;
  latActual: number | null;
  lngActual: number | null;
  onUbicacionChange: (lat: number | null, lng: number | null) => void;
  estadoCambio: boolean;
  ubicacionCambio: boolean;
  infoCambio: boolean;
  hayCambios: boolean;
  saving: boolean;
  onDescartar: () => void;
  onGuardar: () => void;
};

export default function OrderDetailPane({
  pedido, estadoPendiente, onEstadoChange,
  tracking, onTrackingChange, fechaEstimada, onFechaEstimadaChange, notas, onNotasChange,
  latActual, lngActual, onUbicacionChange,
  estadoCambio, ubicacionCambio, infoCambio, hayCambios, saving,
  onDescartar, onGuardar,
}: Props) {
  const dirSnap = pedido.direccion_snapshot || {};
  const isLocked = pedido.estado === "entregado" || pedido.estado === "cancelado";

  return (
    <div className="adm-detail">
      <div className="adm-detail__header">
        <div>
          <span className="adm-detail__id">#{pedido.id_pedido}</span>
          <p className="adm-detail__name">{pedido.producto?.nombre || `Producto #${pedido.id_producto}`}</p>
          <p className="adm-detail__client">
            Cliente: <strong className="adm-text-mid">{pedido.usuario?.nickname || pedido.usuario?.nombre_usuario || `#${pedido.id_usuario}`}</strong>
            {pedido.usuario?.correo && <span className="adm-text-soft"> · {pedido.usuario.correo}</span>}
          </p>
          <p className="adm-detail__meta">
            {pedido.variante ? `Talla ${pedido.variante.talla} · ` : ""}
            {Number(pedido.costo).toLocaleString()} pts · {new Date(pedido.fecha_pedido).toLocaleString("es-MX")}
          </p>
        </div>
        <span className="adm-detail__status" data-estado={pedido.estado}>
          {ESTADO_LABEL[pedido.estado]}
        </span>
      </div>

      {isLocked && (
        <div className={`adm-locked${pedido.estado === "entregado" ? " adm-locked--delivered" : " adm-locked--canceled"}`}>
          <span className="adm-locked__icon">{pedido.estado === "entregado" ? "✓" : "✕"}</span>
          <div>
            <p className="adm-locked__title">Pedido {ESTADO_LABEL[pedido.estado].toLowerCase()}</p>
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
            {ESTADOS.map((est) => {
              const sel = estadoPendiente === est;
              const original = pedido.estado === est;
              return (
                <button
                  key={est}
                  disabled={sel}
                  onClick={() => onEstadoChange(est)}
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
        <p className="adm-dir-addr">
          {dirSnap.calle || ""}
          {dirSnap.ciudad ? `, ${dirSnap.ciudad}` : ""}
          {dirSnap.estado ? `, ${dirSnap.estado}` : ""}
          {dirSnap.codigo_postal ? ` ${dirSnap.codigo_postal}` : ""}
          {dirSnap.pais ? ` · ${dirSnap.pais}` : ""}
        </p>
      </div>

      {pedido.lat_destino != null && pedido.lng_destino != null && (
        <div>
          <div className="adm-map-header">
            <h4 className="adm-section-title">Ubicación del paquete</h4>
            {!isLocked && <p className="adm-map-hint">Busca un lugar o haz clic en el mapa</p>}
          </div>

          {!isLocked && (
            <GeoSearchBox
              resetKey={pedido.id_pedido}
              onPick={(lat, lng) => onUbicacionChange(lat, lng)}
            />
          )}

          <AdminTrackingMap
            destLat={Number(pedido.lat_destino)}
            destLng={Number(pedido.lng_destino)}
            actualLat={latActual}
            actualLng={lngActual}
            onMovePackage={isLocked ? () => {} : (la, ln) => onUbicacionChange(la, ln)}
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
            placeholder="Número de seguimiento"
            value={tracking}
            onChange={(e) => onTrackingChange(e.target.value)}
            disabled={isLocked}
            className="adm-input"
          />
          <input
            type="date"
            value={fechaEstimada}
            onChange={(e) => onFechaEstimadaChange(e.target.value)}
            disabled={isLocked}
            className="adm-input"
          />
        </div>

        <textarea
          placeholder="Notas para el cliente (opcional)"
          rows={3}
          value={notas}
          onChange={(e) => onNotasChange(e.target.value)}
          disabled={isLocked}
          className="adm-input adm-textarea"
        />
      </div>

      {!isLocked && (
        <div className="adm-actions">
          <button
            onClick={onDescartar}
            disabled={!hayCambios || saving}
            className="adm-btn adm-btn--discard"
          >
            Descartar
          </button>
          <button
            onClick={onGuardar}
            disabled={!hayCambios || saving}
            className="adm-btn adm-btn--save"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}
