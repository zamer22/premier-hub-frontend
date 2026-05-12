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
        <h3 style={{ color: "#263a55", fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.4rem" }}>¿Confirmar acción?</h3>

        {action.kind === "buy-product" && (
          <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.4rem" }}>
            Comprarás <strong style={{ color: "#263a55" }}>{action.producto.nombre}</strong>
            {action.variante ? <> (talla <strong style={{ color: "#263a55" }}>{action.variante.talla}</strong>)</> : null}
            {" "}por <strong style={{ color: "#E90052" }}>{Number(action.producto.costo).toLocaleString()} pts</strong>.
            Te quedarán <strong style={{ color: "#263a55" }}>{(saldo - Number(action.producto.costo)).toLocaleString()} pts</strong>.
          </p>
        )}
        {action.kind === "buy-listing" && (
          <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.4rem" }}>
            Comprarás <strong style={{ color: "#263a55" }}>{action.listado.nombre}</strong> por{" "}
            <strong style={{ color: "#E90052" }}>{Number(action.listado.precio).toLocaleString()} pts</strong>.
            Te quedarán <strong style={{ color: "#263a55" }}>{(saldo - Number(action.listado.precio)).toLocaleString()} pts</strong>.
          </p>
        )}
        {action.kind === "publish" && (
          <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.4rem" }}>
            Publicarás <strong style={{ color: "#263a55" }}>{action.item.nombre}</strong> en el marketplace por{" "}
            <strong style={{ color: "#E90052" }}>{action.precio.toLocaleString()} pts</strong>.
          </p>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "none", background: "#E90052", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
            {action.kind === "publish" ? "Publicar" : "Confirmar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}
