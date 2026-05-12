import type { InventarioItem } from "../types";
import "../../../estilos/Tienda.css";

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
        <h3 style={{ color: "#263a55", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.2rem" }}>Publicar en Marketplace</h3>
        <p style={{ color: "#84878F", fontSize: "0.82rem", marginBottom: "1.25rem" }}>{item.nombre}</p>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#263a55", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio (pts)</label>
        <input type="number" min="1" value={precio} onChange={(e) => onPrecioChange(e.target.value)}
          style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", fontSize: "0.95rem", boxSizing: "border-box", marginBottom: "1.25rem", outline: "none" }}
          placeholder="Ej: 500" autoFocus />
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancelar</button>
          <button onClick={onContinue} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", border: "none", background: "#E90052", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
