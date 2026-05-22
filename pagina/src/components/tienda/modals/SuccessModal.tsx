import "../../../pages/tienda/Tienda.css";

interface SuccessModalProps {
  message: string;
  pedidoId: number | null;
  onClose: () => void;
}

export default function SuccessModal({ message, pedidoId, onClose }: SuccessModalProps) {
  return (
    <div className="t-overlay" style={{ zIndex: 9003 }} onClick={onClose}>
      <div className="t-modal t-modal--md t-modal--center" onClick={(e) => e.stopPropagation()}>
        <div className="t-success-icon">
          <span className="t-success-icon__check">✓</span>
        </div>
        <h3 className="t-modal-title">¡Operación exitosa!</h3>
        <p className="t-modal-text">{message}</p>
        {pedidoId && (
          <div className="t-success-pedido">
            <p className="t-success-pedido__label">Número de pedido</p>
            <p className="t-success-pedido__num">#{pedidoId}</p>
          </div>
        )}
        <button onClick={onClose} className="t-modal-btn t-modal-btn--dark t-modal-btn--wide">
          Cerrar
        </button>
      </div>
    </div>
  );
}
