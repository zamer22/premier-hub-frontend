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
        <div className="t-detail-header">
          <ProductVisual p={producto} height={240} />
          <div className="t-detail-badges">
            {producto.es_nuevo && <span className="t-detail-badge t-detail-badge--nuevo">NUEVO</span>}
            {isOwned && !isRealItem && <span className="t-detail-badge t-detail-badge--owned">EN TU PERFIL</span>}
          </div>
          <button onClick={onClose} className="t-detail-close">✕</button>
        </div>

        <div className="t-detail-body">
          <h3 className="t-detail-title">{producto.nombre}</h3>

          <div className="t-detail-tags">
            <span className="t-detail-tag t-detail-tag--base">{tipoLabel(producto.tipo)}</span>
            {producto.equipo && <span className="t-detail-tag t-detail-tag--team">{producto.equipo}</span>}
            {producto.temporada_nombre && <span className="t-detail-tag t-detail-tag--season">Temporada: {producto.temporada_nombre}</span>}
            {producto.categoria === "evento" && <span className="t-detail-tag t-detail-tag--event">DROP EXCLUSIVO</span>}
          </div>

          {producto.descripcion && <p className="t-detail-desc">{producto.descripcion}</p>}

          <div className="t-detail-stock">
            <div>
              <p className="t-detail-stock__label">Stock</p>
              {isRealItem
                ? <p className={`t-detail-stock__val${stockTotal === 0 ? " t-detail-stock__val--none" : ""}`}>
                    {stockTotal === 0 ? "Sin stock" : `${stockTotal} disponibles`}
                  </p>
                : <p className="t-detail-stock__unique">Objeto único por usuario</p>
              }
            </div>
            {isOwned && !isRealItem && <div className="t-detail-owned-badge">Ya lo tienes</div>}
          </div>

          {tieneVariantes && (
            <div>
              <p className="t-detail-sizes-title">Talla</p>
              <div className="t-detail-sizes">
                {(producto.variantes ?? []).map(v => {
                  const sinStock = v.stock <= 0;
                  const sel = selectedVariante?.id_variante === v.id_variante;
                  return (
                    <button
                      key={v.id_variante}
                      disabled={sinStock}
                      onClick={() => onSelectVariante(v)}
                      className={`t-size-btn${sel ? " t-size-btn--sel" : sinStock ? " t-size-btn--out" : ""}`}
                    >
                      {v.talla}
                      <span className={`t-size-stock${sinStock ? " t-size-stock--out" : ""}`}>
                        {sinStock ? "agotada" : `${v.stock} disp.`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="t-detail-buy-row">
            <div>
              <p className="t-detail-price-label">Precio</p>
              <span className="t-detail-price">{Number(producto.costo).toLocaleString()}</span>
              <span className="t-detail-price__unit">pts</span>
            </div>
            <button
              disabled={!canBuy}
              onClick={() => {
                if (!canBuy) return;
                onClose();
                if (isRealItem) onCheckout(producto, selectedVariante);
                else onConfirm({ kind: "buy-product", producto, variante: selectedVariante });
              }}
              className={`t-detail-buy-btn${canBuy ? " t-detail-buy-btn--on" : " t-detail-buy-btn--off"}`}
            >
              {buyLabel}
            </button>
          </div>

          {isRealItem && (
            <div className="t-reviews">
              <div className="t-reviews__header">
                <h4 className="t-reviews__title">Reseñas</h4>
                {total > 0 && (
                  <div className="t-reviews__rating">
                    <span className="t-reviews__stars">
                      {"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}
                    </span>
                    <span className="t-reviews__count">{avg.toFixed(1)} · {total} reseña{total === 1 ? "" : "s"}</span>
                  </div>
                )}
              </div>

              {isOwned && !userComment && (
                <div className="t-review-form">
                  <p className="t-review-form__label">Tu reseña</p>
                  <div className="t-review-stars">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => onReviewChange({ ...newReview, calificacion: n })}
                        className="t-review-star"
                        style={{ color: n <= newReview.calificacion ? "#f59e0b" : "#d1d5db" }}
                      >
                        {n <= newReview.calificacion ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newReview.comentario}
                    onChange={(e) => onReviewChange({ ...newReview, comentario: e.target.value })}
                    placeholder="Cuenta tu experiencia con el producto..."
                    rows={3}
                    className="t-textarea t-textarea--mb"
                  />
                  <button
                    onClick={onSubmitReview}
                    disabled={submittingReview || newReview.comentario.trim().length < 3}
                    className={`t-review-submit${submittingReview || newReview.comentario.trim().length < 3 ? " t-review-submit--off" : " t-review-submit--on"}`}
                  >
                    {submittingReview ? "Publicando..." : "Publicar reseña"}
                  </button>
                </div>
              )}
              {!isOwned && (
                <p className="t-review-login-note">
                  Tenés que comprar el producto para dejar una reseña.
                </p>
              )}

              {loadingComments ? (
                <p className="t-review-loading">Cargando reseñas...</p>
              ) : productComments.length === 0 ? (
                <p className="t-review-empty">
                  Aún no hay reseñas. {isOwned && !userComment ? "¡Sé el primero!" : ""}
                </p>
              ) : (
                <div className="t-review-list">
                  {productComments.map(c => {
                    const isMine = c.id_usuario === userId;
                    const nick = c.usuario?.nickname || c.usuario?.nombre_usuario || `Usuario #${c.id_usuario}`;
                    return (
                      <div key={c.id_comentario} className="t-review-card">
                        <div className="t-review-card__header">
                          <div className="t-review-card__user">
                            <span className="t-review-card__name">
                              {nick}
                              {isMine && <span className="t-review-card__you">TÚ</span>}
                            </span>
                            <span className="t-review-card__stars">
                              {"★".repeat(c.calificacion)}{"☆".repeat(5 - c.calificacion)}
                            </span>
                          </div>
                          <span className="t-review-card__date">
                            {new Date(c.fecha_creacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="t-review-card__text">{c.comentario}</p>
                        {isMine && (
                          <button onClick={() => onDeleteReview(c.id_comentario)} className="t-review-card__delete">
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
