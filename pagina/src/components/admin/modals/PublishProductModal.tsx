import type { AdminProduct } from "../types";
import { tipoLabel, categoriaLabel } from "../utils";
import ProductThumb from "../ProductThumb";

type Props = {
  productos: AdminProduct[];
  search: string;
  onSearchChange: (q: string) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  precio: string;
  onPrecioChange: (p: string) => void;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export default function PublishProductModal({
  productos, search, onSearchChange, selectedId, onSelect,
  precio, onPrecioChange, error, saving, onClose, onSubmit,
}: Props) {
  return (
    <div className="adm-store-modal-backdrop">
      <div className="adm-store-modal">
        <div className="adm-store-modal-head">
          <div>
            <h3>Publicar producto</h3>
            <p>Selecciona cualquier objeto del catálogo y publícalo en marketplace.</p>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="adm-store-input"
          placeholder="Buscar producto..."
        />

        <div className="adm-store-picker">
          {productos.map((p) => (
            <button
              key={p.id_producto}
              type="button"
              onClick={() => onSelect(p.id_producto)}
              className={selectedId === p.id_producto ? "adm-store-pick is-selected" : "adm-store-pick"}
            >
              <ProductThumb item={p} />
              <span>
                <b>{p.nombre}</b>
                <small>{tipoLabel(p.tipo)} · {categoriaLabel(p.categoria)}</small>
              </span>
              <strong>{Number(p.costo).toLocaleString()} pts</strong>
            </button>
          ))}
        </div>

        <label className="adm-store-field">
          <span>Precio en marketplace</span>
          <input
            type="number"
            value={precio}
            onChange={(e) => onPrecioChange(e.target.value)}
            placeholder="Ej. 2500"
          />
        </label>

        {error && <p className="adm-store-error">{error}</p>}

        <div className="adm-store-modal-actions">
          <button type="button" className="adm-store-btn is-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="adm-store-btn is-primary"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
