import type { AdminListado } from "../types";

type Props = {
  listado: AdminListado;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmCancelModal({ listado, saving, onClose, onConfirm }: Props) {
  return (
    <div className="adm-store-modal-backdrop">
      <div className="adm-store-modal is-small">
        <div className="adm-store-modal-head">
          <div>
            <h3>Cancelar listado</h3>
            <p>¿Seguro que quieres cancelar “{listado.nombre}”?</p>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <div className="adm-store-modal-actions">
          <button type="button" className="adm-store-btn is-ghost" onClick={onClose}>
            Volver
          </button>
          <button
            type="button"
            className="adm-store-btn is-danger"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? "Cancelando..." : "Cancelar listado"}
          </button>
        </div>
      </div>
    </div>
  );
}
