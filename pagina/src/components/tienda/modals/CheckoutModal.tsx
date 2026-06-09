import type { Producto, Variante, Direccion, NewDireccionForm } from "../types";
import { tipoLabel } from "../utils";
import { EMPTY_DIRECCION } from "../constants";
import DireccionForm from "../DireccionForm";
import "../../../pages/tienda/Tienda.css";

interface CheckoutModalProps {
  producto: Producto;
  variante: Variante | null;
  saldo: number;
  direcciones: Direccion[];
  selectedDireccionId: number | null;
  onSelectDireccion: (id: number) => void;
  onEliminarDireccion: (id: number) => void;
  showNewDireccion: boolean;
  onShowNewDireccion: (v: boolean) => void;
  newDireccion: NewDireccionForm;
  onDireccionChange: (f: NewDireccionForm) => void;
  savingDireccion: boolean;
  onGuardarDireccion: () => void;
  placingOrder: boolean;
  onConfirmar: () => void;
  onClose: () => void;
  showToast: (msg: string, ok: boolean) => void;
}

// Muestra direcciones guardadas (radio) o el form de nueva (DireccionForm).
// Al confirmar, llama onConfirmar, que dispara POST /api/tienda/comprar con id_direccion.
export default function CheckoutModal({
  producto, variante, saldo,
  direcciones, selectedDireccionId, onSelectDireccion, onEliminarDireccion,
  showNewDireccion, onShowNewDireccion, newDireccion, onDireccionChange,
  savingDireccion, onGuardarDireccion,
  placingOrder, onConfirmar, onClose, showToast,
}: CheckoutModalProps) {
  const costo = Number(producto.costo);
  const saldoFinal = saldo - costo;
  const canConfirm = !!selectedDireccionId && !placingOrder && !showNewDireccion;

  return (
    <div
      className="t-overlay t-overlay--scroll"
      style={{ zIndex: 9004 }}
      onClick={() => { if (!placingOrder) onClose(); }}
    >
      <div className="t-modal t-modal--xl" onClick={(e) => e.stopPropagation()}>
        <div className="t-modal-header">
          <h3 className="t-modal-header__title">Finalizar compra</h3>
          <button onClick={() => { if (!placingOrder) onClose(); }} className="t-modal-close">✕</button>
        </div>

        <div className="t-modal-body">
          <div className="t-checkout-product">
            <div
              className="t-checkout-img"
              style={{ background: producto.imagen ? `#fff url(${producto.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55, #871d54)" }}
            />
            <div className="t-checkout-info">
              <p className="t-checkout-info__name">{producto.nombre}</p>
              <p className="t-checkout-info__meta">
                {tipoLabel(producto.tipo)}{variante ? ` · talla ${variante.talla}` : ""}
              </p>
              <p className="t-checkout-info__price">{costo.toLocaleString()} pts</p>
            </div>
          </div>

          <div className="t-checkout-addresses">
            <div className="t-section-header t-section-header--mb">

              <h4 className="t-checkout-section-title">Dirección de envío</h4>
              {!showNewDireccion && (
                <button onClick={() => onShowNewDireccion(true)} className="t-link-btn">
                  + Nueva dirección
                </button>
              )}
            </div>

            {direcciones.length === 0 && !showNewDireccion && (
              <p className="t-empty-hint">No tienes direcciones guardadas. Agrega una para continuar.</p>
            )}

            {direcciones.length > 0 && !showNewDireccion && (
              <div className="t-dir-list">
                {direcciones.map(dir => {
                  const sel = selectedDireccionId === dir.id_direccion;
                  return (
                    <label
                      key={dir.id_direccion}
                      className={`t-dir-option${sel ? " t-dir-option--sel" : ""}`}
                    >
                      <input
                        type="radio" name="direccion" checked={sel}
                        onChange={() => onSelectDireccion(dir.id_direccion)}
                      />
                      <div className="t-dir-option__body">
                        <div className="t-dir-option__header">
                          <p className="t-dir-option__alias">
                            {dir.alias}
                            {dir.es_predeterminada && <span className="t-badge-default">PREDETERMINADA</span>}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); onEliminarDireccion(dir.id_direccion); }}
                            className="t-dir-option__delete"
                          >
                            Eliminar
                          </button>
                        </div>
                        <p className="t-dir-option__name">{dir.nombre_destinatario}{dir.telefono ? ` · ${dir.telefono}` : ""}</p>
                        <p className="t-dir-option__addr">{dir.calle}, {dir.ciudad}{dir.estado ? `, ${dir.estado}` : ""}{dir.codigo_postal ? ` ${dir.codigo_postal}` : ""}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {showNewDireccion && (
              <DireccionForm
                form={newDireccion}
                onChange={onDireccionChange}
                onSave={onGuardarDireccion}
                onCancel={() => { onShowNewDireccion(false); onDireccionChange(EMPTY_DIRECCION); }}
                saving={savingDireccion}
                showToast={showToast}
              />
            )}
          </div>

          <div className="t-checkout-summary">
            <div className="t-checkout-row">
              <span>Total</span>
              <strong className="t-text-accent">{costo.toLocaleString()} pts</strong>
            </div>
            <div className="t-checkout-row t-checkout-row--sub">
              <span>Saldo después de la compra</span>
              <span className="t-text-dark-bold">{saldoFinal.toLocaleString()} pts</span>
            </div>
          </div>

          <div className="t-btn-row">
            <button onClick={onClose} disabled={placingOrder} className="t-modal-btn t-modal-btn--cancel t-modal-btn--lg">
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={!canConfirm}
              className={`t-modal-btn t-modal-btn--lg t-checkout-confirm${canConfirm ? " t-modal-btn--primary" : ""}`}
            >
              {placingOrder ? "Procesando..." : "Confirmar pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
