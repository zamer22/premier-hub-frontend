import "../../../estilos/Tienda.css";

interface SuccessModalProps {
  message: string;
  pedidoId: number | null;
  onClose: () => void;
}

export default function SuccessModal({ message, pedidoId, onClose }: SuccessModalProps) {
  return (
    <div className="t-overlay" style={{ zIndex: 9003 }} onClick={onClose}>
      <div className="t-modal t-modal--md" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #E90052, #871d54)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
          <span style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 900 }}>✓</span>
        </div>
        <h3 style={{ color: "#263a55", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.45rem" }}>¡Operación exitosa!</h3>
        <p style={{ color: "#84878F", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: pedidoId ? "0.85rem" : "1.4rem" }}>{message}</p>
        {pedidoId && (
          <div style={{ background: "linear-gradient(135deg, rgba(233,0,82,0.08), rgba(135,29,84,0.08))", border: "1px solid rgba(233,0,82,0.2)", borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "1.4rem" }}>
            <p style={{ fontSize: "0.65rem", color: "#84878F", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "0.15rem" }}>Número de pedido</p>
            <p style={{ fontSize: "1.4rem", color: "#E90052", fontWeight: 900, letterSpacing: "0.02em" }}>#{pedidoId}</p>
          </div>
        )}
        <button onClick={onClose} style={{ padding: "0.65rem 2.5rem", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #263a55, #1a2a3f)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
