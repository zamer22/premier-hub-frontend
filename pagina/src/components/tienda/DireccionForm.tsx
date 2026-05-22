import type { NewDireccionForm } from "./types";
import LocationPicker from "./map/LocationPicker";
import "../../pages/tienda/Tienda.css";

interface DireccionFormProps {
  form: NewDireccionForm;
  onChange: (form: NewDireccionForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  showToast: (msg: string, ok: boolean) => void;
}

export default function DireccionForm({ form, onChange, onSave, onCancel, saving, showToast }: DireccionFormProps) {
  const set = (field: keyof NewDireccionForm, value: any) => onChange({ ...form, [field]: value });

  const handleGeolocate = () => {
    if (!navigator.geolocation) { showToast("Geolocalización no disponible", false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ ...form, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => showToast("No se pudo obtener tu ubicación", false),
    );
  };

  return (
    <div className="t-dir-form">
      <div className="t-dir-form-grid">
        <input placeholder="Alias (Casa, Oficina...)" value={form.alias} onChange={(e) => set("alias", e.target.value)} className="t-input" />
        <input placeholder="Nombre del destinatario" value={form.nombre_destinatario} onChange={(e) => set("nombre_destinatario", e.target.value)} className="t-input" />
      </div>
      <input placeholder="Teléfono (opcional)" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} className="t-input" />
      <input placeholder="Calle y número" value={form.calle} onChange={(e) => set("calle", e.target.value)} className="t-input" />
      <div className="t-dir-form-grid--3">
        <input placeholder="Ciudad" value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} className="t-input" />
        <input placeholder="Estado" value={form.estado} onChange={(e) => set("estado", e.target.value)} className="t-input" />
        <input placeholder="CP" value={form.codigo_postal} onChange={(e) => set("codigo_postal", e.target.value)} className="t-input" />
      </div>
      <div>
        <div className="t-dir-map-header">
          <label className="t-section-title">Ubicación en mapa</label>
          <button type="button" onClick={handleGeolocate} className="t-dir-geo-btn">Usar mi ubicación</button>
        </div>
        <p className="t-dir-hint">Hacé click en el mapa para fijar la ubicación.</p>
        <LocationPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => onChange({ ...form, lat, lng })} />
        {form.lat != null && form.lng != null && (
          <p className="t-dir-coords">{form.lat.toFixed(5)}, {form.lng.toFixed(5)}</p>
        )}
      </div>
      <label className="t-dir-checkbox">
        <input type="checkbox" checked={form.es_predeterminada} onChange={(e) => set("es_predeterminada", e.target.checked)} />
        Usar como predeterminada
      </label>
      <div className="t-btn-row t-btn-row--mt">
        <button onClick={onCancel} disabled={saving} className="t-modal-btn t-modal-btn--cancel">Cancelar</button>
        <button onClick={onSave} disabled={saving} className="t-modal-btn t-modal-btn--dark">
          {saving ? "Guardando..." : "Guardar dirección"}
        </button>
      </div>
    </div>
  );
}
