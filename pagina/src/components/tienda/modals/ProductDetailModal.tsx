import type { Producto, Variante, Comentario, ConfirmAction } from "../types";
import { tipoLabel } from "../utils";
import ProductVisual from "../ProductVisual";
import "../../../estilos/Tienda.css";

interface ProductDetailModalProps {
  producto: Producto;
  saldo: number;
  isOwned: boolean;
  selectedVariante: Variante | null;
  onSelectVariante: (v: Variante) => void;
  productComments: Comentario[];
  loadingComments: boolean;
  userId: number;
  newReview: { calificacion: number; comentario: string };
  onReviewChange: (r: { calificacion: number; comentario: string }) => void;
  submittingReview: boolean;
  onSubmitReview: () => void;
  onDeleteReview: (id: number) => void;
  onClose: () => void;
  onConfirm: (action: ConfirmAction) => void;
  onCheckout: (p: Producto, v: Variante | null) => void;
}

// Detalle de producto: imagen, tallas, precio, compra. Si es real también muestra reseñas.
export default function ProductDetailModal({
  producto, saldo, isOwned, selectedVariante, onSelectVariante,
  productComments, loadingComments, userId, newReview, onReviewChange,
  submittingReview, onSubmitReview, onDeleteReview,
  onClose, onConfirm, onCheckout,
}: ProductDetailModalProps) {
  const isRealItem = producto.categoria === "real";
  const tieneVariantes = !!producto.variantes && producto.variantes.length > 0;
  const stockTotal = tieneVariantes
    ? (producto.variantes ?? []).reduce((sum, v) => sum + v.stock, 0)
    : (producto.stock ?? 0);
  const stockSeleccionable = tieneVariantes ? (selectedVariante ? selectedVariante.stock > 0 : false) : stockTotal > 0;
  const canBuy = isRealItem
    ? stockSeleccionable && Number(producto.costo) <= saldo
    : !isOwned && Number(producto.costo) <= saldo;

  const userComment = productComments.find(c => c.id_usuario === userId);
  const total = productComments.length;
  const avg = total > 0 ? productComments.reduce((s, c) => s + c.calificacion, 0) / total : 0;

  const buyLabel = isOwned && !isRealItem ? "Ya tienes este"
    : isRealItem && stockTotal === 0 ? "Sin stock"
    : tieneVariantes && !selectedVariante ? "Elige una talla"
    : Number(producto.costo) > saldo ? "Saldo insuficiente"
    : isRealItem ? "Continuar al envío"
    : "Comprar ahora";

  return (
    <div className="t-overlay" style={{ zIndex: 9000 }} onClick={onClose}>
      <div className="t-modal t-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div style={{ position: "relative" }}>
          <ProductVisual p={producto} height={240} />
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {producto.es_nuevo && <span style={{ background: "#E90052", color: "#fff", fontSize: "0.65rem", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 700 }}>NUEVO</span>}
            {isOwned && !isRealItem && <span style={{ background: "#16a34a", color: "#fff", fontSize: "0.65rem", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 700 }}>EN TU PERFIL</span>}
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1 }}>
          <h3 style={{ color: "#263a55", fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.3rem" }}>{producto.nombre}</h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.85rem" }}>
            <span style={{ background: "#f0f2f5", color: "#263a55", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "99px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{tipoLabel(producto.tipo)}</span>
            {producto.equipo && <span style={{ background: "#f0f2f5", color: "#263a55", fontSize: "0.68rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "99px" }}>{producto.equipo}</span>}
            {producto.temporada_nombre && <span style={{ background: "rgba(135,29,84,0.1)", color: "#871d54", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "99px" }}>Temporada: {producto.temporada_nombre}</span>}
            {producto.categoria === "evento" && <span style={{ background: "rgba(233,0,82,0.1)", color: "#E90052", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "99px" }}>DROP EXCLUSIVO</span>}
          </div>

          {producto.descripcion && (
            <p style={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.5, marginBottom: "0.85rem" }}>{producto.descripcion}</p>
          )}

          <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "0.6rem 0.85rem", marginBottom: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "0.65rem", color: "#84878F", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.1rem" }}>Stock</p>
              {isRealItem
                ? <p style={{ fontSize: "0.82rem", color: stockTotal === 0 ? "#dc2626" : "#263a55", fontWeight: 600 }}>{stockTotal === 0 ? "Sin stock" : `${stockTotal} disponibles`}</p>
                : <p style={{ fontSize: "0.82rem", color: "#871d54", fontWeight: 700 }}>Objeto único por usuario</p>
              }
            </div>
            {isOwned && !isRealItem && (
              <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "6px" }}>Ya lo tienes</div>
            )}
          </div>

          {tieneVariantes && (
            <div style={{ marginBottom: "0.9rem" }}>
              <p style={{ fontSize: "0.65rem", color: "#84878F", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Talla</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {(producto.variantes ?? []).map(v => {
                  const sinStock = v.stock <= 0;
                  const sel = selectedVariante?.id_variante === v.id_variante;
                  return (
                    <button key={v.id_variante} disabled={sinStock} onClick={() => onSelectVariante(v)}
                      style={{
                        minWidth: "52px", padding: "0.45rem 0.7rem",
                        border: sel ? "2px solid #E90052" : "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: sinStock ? "#f3f4f6" : sel ? "rgba(233,0,82,0.08)" : "#fff",
                        color: sinStock ? "#9ca3af" : sel ? "#E90052" : "#263a55",
                        fontWeight: 700, fontSize: "0.85rem",
                        cursor: sinStock ? "not-allowed" : "pointer",
                        textDecoration: sinStock ? "line-through" : "none",
                        transition: "all 0.15s",
                      }}>
                      {v.talla}
                      <span style={{ display: "block", fontSize: "0.6rem", fontWeight: 500, marginTop: "0.1rem", color: sinStock ? "#9ca3af" : "#84878F" }}>
                        {sinStock ? "agotada" : `${v.stock} disp.`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: "0.9rem" }}>
            <div>
              <p style={{ fontSize: "0.68rem", color: "#84878F", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.05rem" }}>Precio</p>
              <span style={{ fontSize: "1.45rem", fontWeight: 900, color: "#263a55" }}>{Number(producto.costo).toLocaleString()}</span>
              <span style={{ fontSize: "0.82rem", color: "#84878F", marginLeft: "0.25rem" }}>pts</span>
            </div>
            <button
              disabled={!canBuy}
              onClick={() => {
                if (!canBuy) return;
                onClose();
                if (isRealItem) onCheckout(producto, selectedVariante);
                else onConfirm({ kind: "buy-product", producto, variante: selectedVariante });
              }}
              style={{ padding: "0.65rem 1.75rem", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem", cursor: canBuy ? "pointer" : "not-allowed", background: canBuy ? "#E90052" : "#e0e0e0", color: canBuy ? "#fff" : "#999" }}>
              {buyLabel}
            </button>
          </div>

          {isRealItem && (
            <div style={{ marginTop: "1.25rem", borderTop: "1px solid #f0f0f0", paddingTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ color: "#263a55", fontSize: "0.95rem", fontWeight: 800 }}>Reseñas</h4>
                {total > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ color: "#f59e0b", fontSize: "0.95rem", letterSpacing: "0.05em" }}>
                      {"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#84878F", fontWeight: 600 }}>{avg.toFixed(1)} · {total} reseña{total === 1 ? "" : "s"}</span>
                  </div>
                )}
              </div>

              {isOwned && !userComment && (
                <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "0.85rem 1rem", marginBottom: "0.85rem" }}>
                  <p style={{ fontSize: "0.74rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Tu reseña</p>
                  <div style={{ display: "flex", gap: "0.15rem", marginBottom: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => onReviewChange({ ...newReview, calificacion: n })}
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1, padding: 0, color: n <= newReview.calificacion ? "#f59e0b" : "#d1d5db" }}>
                        {n <= newReview.calificacion ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                  <textarea value={newReview.comentario}
                    onChange={(e) => onReviewChange({ ...newReview, comentario: e.target.value })}
                    placeholder="Cuenta tu experiencia con el producto..."
                    rows={3}
                    style={{ padding: "0.6rem 0.7rem", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "0.85rem", outline: "none", width: "100%", boxSizing: "border-box", color: "#263a55", background: "#fff", resize: "vertical", fontFamily: "inherit", marginBottom: "0.5rem" }} />
                  <button onClick={onSubmitReview} disabled={submittingReview || newReview.comentario.trim().length < 3}
                    style={{
                      padding: "0.5rem 1.1rem", borderRadius: "8px", border: "none",
                      background: submittingReview || newReview.comentario.trim().length < 3 ? "#e0e0e0" : "#E90052",
                      color: submittingReview || newReview.comentario.trim().length < 3 ? "#999" : "#fff",
                      fontWeight: 700, fontSize: "0.8rem",
                      cursor: submittingReview || newReview.comentario.trim().length < 3 ? "not-allowed" : "pointer",
                    }}>
                    {submittingReview ? "Publicando..." : "Publicar reseña"}
                  </button>
                </div>
              )}
              {!isOwned && (
                <p style={{ fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.85rem", fontStyle: "italic" }}>
                  Tenés que comprar el producto para dejar una reseña.
                </p>
              )}

              {loadingComments ? (
                <p style={{ fontSize: "0.82rem", color: "#84878F" }}>Cargando reseñas...</p>
              ) : productComments.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "#9ca3af", textAlign: "center", padding: "1rem 0" }}>
                  Aún no hay reseñas. {isOwned && !userComment ? "¡Sé el primero!" : ""}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                  {productComments.map(c => {
                    const isMine = c.id_usuario === userId;
                    const nick = c.usuario?.nickname || c.usuario?.nombre_usuario || `Usuario #${c.id_usuario}`;
                    return (
                      <div key={c.id_comentario} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "10px", padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#263a55" }}>
                              {nick}{isMine && <span style={{ marginLeft: "0.4rem", fontSize: "0.62rem", background: "#dbeafe", color: "#1e40af", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>TÚ</span>}
                            </span>
                            <span style={{ color: "#f59e0b", fontSize: "0.82rem", letterSpacing: "0.04em" }}>
                              {"★".repeat(c.calificacion)}{"☆".repeat(5 - c.calificacion)}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                            {new Date(c.fecha_creacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.5 }}>{c.comentario}</p>
                        {isMine && (
                          <button onClick={() => onDeleteReview(c.id_comentario)}
                            style={{ marginTop: "0.4rem", background: "transparent", border: "none", color: "#dc2626", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                            Eliminar mi reseña
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
