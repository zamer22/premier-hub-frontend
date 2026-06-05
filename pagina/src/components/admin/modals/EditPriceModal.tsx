import type { AdminListado } from "../types";

type Props = {
  listado: AdminListado;
  precio: string;
  onPrecioChange: (p: string) => void;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export default function EditPriceModal({
  listado, precio, onPrecioChange, error, saving, onClose, onSubmit,
}: Props) {
  return (
    <div className="adm-store-modal-backdrop">
      <div className="adm-store-modal is-small">
        <div className="adm-store-modal-head">
          <div>
            <h3>Editar precio</h3>
            <p>{listado.nombre}</p>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <label className="adm-store-field">
          <span>Nuevo precio</span>
          <input
            type="number"
            value={precio}
            onChange={(e) => onPrecioChange(e.target.value)}
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
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
