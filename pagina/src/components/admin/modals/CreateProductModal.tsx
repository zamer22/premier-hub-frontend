import type { NewProductForm } from "../types";
import { NEW_PRODUCT_TIPOS } from "../constants";
import { tipoLabel } from "../utils";

type Props = {
  form: NewProductForm;
  onChange: (next: NewProductForm) => void;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export default function CreateProductModal({ form, onChange, error, saving, onClose, onSubmit }: Props) {
  const patch = (p: Partial<NewProductForm>) => onChange({ ...form, ...p });

  return (
    <div className="adm-store-modal-backdrop">
      <div className="adm-store-modal">
        <div className="adm-store-modal-head">
          <div>
            <h3>Crear objeto</h3>
            <p>Agrega un objeto nuevo al catálogo base de la tienda.</p>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <div className="adm-store-form-grid">
          <label className="adm-store-field">
            <span>Nombre</span>
            <input
              value={form.nombre}
              onChange={(e) => patch({ nombre: e.target.value })}
              placeholder="Ej. Marco Campeón"
            />
          </label>

          <label className="adm-store-field">
            <span>Costo</span>
            <input
              type="number"
              value={form.costo}
              onChange={(e) => patch({ costo: e.target.value })}
              placeholder="1500"
            />
          </label>

          <label className="adm-store-field">
            <span>Categoría</span>
            <select
              value={form.categoria}
              onChange={(e) => patch({ categoria: e.target.value as "perfil" | "real" })}
            >
              <option value="perfil">Perfil</option>
              <option value="real">Objeto real</option>
            </select>
          </label>

          <label className="adm-store-field">
            <span>Tipo</span>
            <select value={form.tipo} onChange={(e) => patch({ tipo: e.target.value })}>
              <option value="">Seleccionar</option>
              {NEW_PRODUCT_TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>{tipoLabel(tipo)}</option>
              ))}
            </select>
          </label>

          <label className="adm-store-field">
            <span>Stock</span>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => patch({ stock: e.target.value })}
            />
          </label>

          <label className="adm-store-field">
            <span>Equipo</span>
            <input
              value={form.equipo}
              onChange={(e) => patch({ equipo: e.target.value })}
              placeholder="Opcional"
            />
          </label>

          <label className="adm-store-field">
            <span>Rareza</span>
            <input
              value={form.rareza}
              onChange={(e) => patch({ rareza: e.target.value })}
              placeholder="Común, Raro, Élite..."
            />
          </label>

          <label className="adm-store-field">
            <span>ID de temporada</span>
            <input
              type="number"
              value={form.id_temporada}
              onChange={(e) => patch({ id_temporada: e.target.value })}
              placeholder="Opcional"
            />
          </label>

          <label className="adm-store-field is-wide">
            <span>Descripción</span>
            <textarea
              value={form.descripcion}
              onChange={(e) => patch({ descripcion: e.target.value })}
              placeholder="Descripción visible en tienda"
            />
          </label>

          <label className="adm-store-field is-wide">
            <span>URL de imagen</span>
            <input
              value={form.imagen}
              onChange={(e) => patch({ imagen: e.target.value })}
              placeholder="https://..."
            />
          </label>

          <div className="adm-store-checks is-wide">
            <label>
              <input
                type="checkbox"
                checked={form.es_nuevo}
                onChange={(e) => patch({ es_nuevo: e.target.checked })}
              />
              Nuevo
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.es_de_liga}
                onChange={(e) => patch({ es_de_liga: e.target.checked })}
              />
              De liga
            </label>
          </div>
        </div>

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
            {saving ? "Creando..." : "Crear objeto"}
          </button>
        </div>
      </div>
    </div>
  );
}
