import type { NewDireccionForm } from "./types";
import { inputStyle } from "./constants";
import LocationPicker from "./map/LocationPicker";

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
    <div style={{ border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        <input placeholder="Alias (Casa, Oficina...)" value={form.alias} onChange={(e) => set("alias", e.target.value)} style={inputStyle} />
        <input placeholder="Nombre del destinatario" value={form.nombre_destinatario} onChange={(e) => set("nombre_destinatario", e.target.value)} style={inputStyle} />
      </div>
      <input placeholder="Teléfono (opcional)" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} style={inputStyle} />
      <input placeholder="Calle y número" value={form.calle} onChange={(e) => set("calle", e.target.value)} style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr", gap: "0.6rem" }}>
        <input placeholder="Ciudad" value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} style={inputStyle} />
        <input placeholder="Estado" value={form.estado} onChange={(e) => set("estado", e.target.value)} style={inputStyle} />
        <input placeholder="CP" value={form.codigo_postal} onChange={(e) => set("codigo_postal", e.target.value)} style={inputStyle} />
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
          <label style={{ fontSize: "0.72rem", color: "#263a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Ubicación en mapa</label>
          <button type="button" onClick={handleGeolocate}
            style={{ background: "transparent", border: "none", color: "#E90052", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}>
            Usar mi ubicación
          </button>
        </div>
        <p style={{ fontSize: "0.7rem", color: "#84878F", marginBottom: "0.4rem" }}>Hacé click en el mapa para fijar la ubicación.</p>
        <LocationPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => onChange({ ...form, lat, lng })} />
        {form.lat != null && form.lng != null && (
          <p style={{ fontSize: "0.7rem", color: "#84878F", marginTop: "0.3rem" }}>{form.lat.toFixed(5)}, {form.lng.toFixed(5)}</p>
        )}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#374151" }}>
        <input type="checkbox" checked={form.es_predeterminada} onChange={(e) => set("es_predeterminada", e.target.checked)} style={{ accentColor: "#E90052" }} />
        Usar como predeterminada
      </label>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
        <button onClick={onCancel} disabled={saving}
          style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#84878F", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
          Cancelar
        </button>
        <button onClick={onSave} disabled={saving}
          style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "none", background: "#263a55", color: "#fff", cursor: saving ? "wait" : "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
          {saving ? "Guardando..." : "Guardar dirección"}
        </button>
      </div>
    </div>
  );
}
