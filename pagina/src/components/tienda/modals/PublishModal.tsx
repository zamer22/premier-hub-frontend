import type { InventarioItem } from "../types";
import "../../../pages/tienda/Tienda.css";

interface PublishModalProps {
  item: InventarioItem;
  precio: string;
  onPrecioChange: (v: string) => void;
  onContinue: () => void;
  onClose: () => void;
}

export default function PublishModal({ item, precio, onPrecioChange, onContinue, onClose }: PublishModalProps) {
  return (
    <div className="t-overlay" style={{ zIndex: 9001 }} onClick={onClose}>
      <div className="t-modal t-modal--sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="t-modal-title t-modal-title--mb-sm">Publicar en marketplace</h3>
        <p className="t-modal-subtitle">{item.nombre}</p>
        <label className="t-publish-label">Precio (pts)</label>
        <input
          type="number" min="1" value={precio}
          onChange={(e) => onPrecioChange(e.target.value)}
          className="t-publish-input"
          placeholder="Ej: 500"
          autoFocus
        />
        <div className="t-btn-row">
          <button onClick={onClose} className="t-modal-btn t-modal-btn--cancel">Cancelar</button>
          <button onClick={onContinue} className="t-modal-btn t-modal-btn--primary">Continuar</button>
        </div>
      </div>
    </div>
  );
}
