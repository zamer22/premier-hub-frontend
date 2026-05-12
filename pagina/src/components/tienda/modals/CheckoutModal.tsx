import type { Producto, Variante, Direccion, NewDireccionForm } from "../types";
import { tipoLabel } from "../utils";
import { EMPTY_DIRECCION } from "../constants";
import DireccionForm from "../DireccionForm";
import "../../../estilos/Tienda.css";

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
// Al confirmar llama onConfirmar que dispara POST /api/tienda/comprar con id_direccion.
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
    <div className="t-overlay" style={{ zIndex: 9004, overflowY: "auto" }}
      onClick={() => { if (!placingOrder) onClose(); }}>
      <div className="t-modal t-modal--xl" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ color: "#263a55", fontSize: "1.1rem", fontWeight: 800 }}>Finalizar compra</h3>
          <button onClick={() => { if (!placingOrder) onClose(); }} style={{ background: "transparent", border: "none", color: "#84878F", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.9rem 1rem", marginBottom: "1rem", display: "flex", gap: "0.85rem", alignItems: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "8px", background: producto.imagen ? `#fff url(${producto.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55, #871d54)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#263a55", marginBottom: "0.15rem" }}>{producto.nombre}</p>
              <p style={{ fontSize: "0.72rem", color: "#84878F" }}>
                {tipoLabel(producto.tipo)}{variante ? ` · talla ${variante.talla}` : ""}
              </p>
              <p style={{ fontSize: "0.95rem", color: "#E90052", fontWeight: 800, marginTop: "0.2rem" }}>{costo.toLocaleString()} pts</p>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h4 style={{ fontSize: "0.78rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dirección de envío</h4>
              {!showNewDireccion && (
                <button onClick={() => onShowNewDireccion(true)}
                  style={{ background: "transparent", border: "none", color: "#E90052", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                  + Nueva dirección
                </button>
              )}
            </div>

            {direcciones.length === 0 && !showNewDireccion && (
              <p style={{ fontSize: "0.82rem", color: "#84878F", padding: "0.6rem 0" }}>No tienes direcciones guardadas. Agregá una para continuar.</p>
            )}

            {direcciones.length > 0 && !showNewDireccion && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {direcciones.map(dir => {
                  const sel = selectedDireccionId === dir.id_direccion;
                  return (
                    <label key={dir.id_direccion}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "0.7rem",
                        padding: "0.75rem 0.9rem",
                        border: sel ? "2px solid #E90052" : "1.5px solid #e5e7eb",
                        borderRadius: "10px", cursor: "pointer",
                        background: sel ? "rgba(233,0,82,0.04)" : "#fff",
                      }}>
                      <input type="radio" name="direccion" checked={sel} onChange={() => onSelectDireccion(dir.id_direccion)}
                        style={{ marginTop: "0.2rem", accentColor: "#E90052" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.1rem" }}>
                          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#263a55" }}>
                            {dir.alias}{dir.es_predeterminada && <span style={{ fontSize: "0.65rem", background: "#dcfce7", color: "#16a34a", padding: "0.1rem 0.4rem", borderRadius: "4px", marginLeft: "0.4rem", fontWeight: 700 }}>PREDETERMINADA</span>}
                          </p>
                          <button type="button" onClick={(e) => { e.preventDefault(); onEliminarDireccion(dir.id_direccion); }}
                            style={{ background: "transparent", border: "none", color: "#dc2626", fontSize: "0.7rem", cursor: "pointer", fontWeight: 600 }}>
                            Eliminar
                          </button>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "#374151" }}>{dir.nombre_destinatario}{dir.telefono ? ` · ${dir.telefono}` : ""}</p>
                        <p style={{ fontSize: "0.75rem", color: "#84878F" }}>{dir.calle}, {dir.ciudad}{dir.estado ? `, ${dir.estado}` : ""}{dir.codigo_postal ? ` ${dir.codigo_postal}` : ""}</p>
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

          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.85rem 1rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#374151" }}>
              <span>Total</span><strong style={{ color: "#E90052" }}>{costo.toLocaleString()} pts</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#84878F", marginTop: "0.25rem" }}>
              <span>Saldo después de la compra</span>
              <span style={{ fontWeight: 700, color: "#263a55" }}>{saldoFinal.toLocaleString()} pts</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button onClick={onClose} disabled={placingOrder}
              style={{ flex: 1, padding: "0.75rem", borderRadius: "10px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: placingOrder ? "wait" : "pointer", fontWeight: 600, fontSize: "0.88rem" }}>
              Cancelar
            </button>
            <button onClick={onConfirmar} disabled={!canConfirm}
              style={{
                flex: 2, padding: "0.75rem", borderRadius: "10px", border: "none",
                background: canConfirm ? "#E90052" : "#e0e0e0",
                color: canConfirm ? "#fff" : "#999",
                cursor: canConfirm ? "pointer" : "not-allowed",
                fontWeight: 700, fontSize: "0.88rem",
              }}>
              {placingOrder ? "Procesando..." : "Confirmar pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
