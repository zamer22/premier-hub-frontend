import type { ConfirmAction } from "../types";
import "../../../estilos/Tienda.css";

interface ConfirmModalProps {
  action: ConfirmAction;
  saldo: number;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({ action, saldo, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <div className="t-overlay" style={{ zIndex: 9002 }}>
      <div className="t-modal t-modal--md" onClick={(e) => e.stopPropagation()}>
        <h3 className="t-modal-title">¿Confirmar acción?</h3>

        {action.kind === "buy-product" && (
          <p className="t-modal-text">
            Comprarás <strong className="t-text-dark">{action.producto.nombre}</strong>
            {action.variante ? <> (talla <strong className="t-text-dark">{action.variante.talla}</strong>)</> : null}
            {" "}por <strong className="t-text-accent">{Number(action.producto.costo).toLocaleString()} pts</strong>.
            Te quedarán <strong className="t-text-dark">{(saldo - Number(action.producto.costo)).toLocaleString()} pts</strong>.
          </p>
        )}
        {action.kind === "buy-listing" && (
          <p className="t-modal-text">
            Comprarás <strong className="t-text-dark">{action.listado.nombre}</strong> por{" "}
            <strong className="t-text-accent">{Number(action.listado.precio).toLocaleString()} pts</strong>.
            Te quedarán <strong className="t-text-dark">{(saldo - Number(action.listado.precio)).toLocaleString()} pts</strong>.
          </p>
        )}
        {action.kind === "publish" && (
          <p className="t-modal-text">
            Publicarás <strong className="t-text-dark">{action.item.nombre}</strong> en el marketplace por{" "}
            <strong className="t-text-accent">{action.precio.toLocaleString()} pts</strong>.
          </p>
        )}

        <div className="t-btn-row">
          <button onClick={onClose} className="t-modal-btn t-modal-btn--cancel">Cancelar</button>
          <button onClick={onConfirm} className="t-modal-btn t-modal-btn--primary">
            {action.kind === "publish" ? "Publicar" : "Confirmar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}
