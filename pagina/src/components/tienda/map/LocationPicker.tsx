import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { DEFAULT_MAP_CENTER } from "../constants";
import "../../../estilos/Tienda.css";

interface GeoResult { display_name: string; lat: string; lon: string; place_id: number }

function RecenterMap({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const justSelected = useRef(false);

  const center: [number, number] = lat != null && lng != null ? [lat, lng] : DEFAULT_MAP_CENTER;

  // Nominatim: geocoding sin API key. Accept-Language: es para resultados en español.
  const buscar = async (q: string, manual: boolean) => {
    const term = q.trim();
    if (!term) return;
    setSearching(true); setSearchError(null);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1&q=${encodeURIComponent(term)}`,
        { headers: { "Accept-Language": "es" } }
      );
      const data: GeoResult[] = await r.json();
      if (!Array.isArray(data) || data.length === 0) {
        setResults([]);
        if (manual) setSearchError("Sin resultados. Intentá con más detalle o menos términos.");
      } else {
        setResults(data);
      }
    } catch {
      if (manual) setSearchError("Error al buscar");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (justSelected.current) { justSelected.current = false; return; }
    const term = search.trim();
    if (term.length < 3) { setResults([]); setSearchError(null); return; }
    const t = setTimeout(() => buscar(term, false), 500);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const elegir = (r: GeoResult) => {
    onChange(Number(r.lat), Number(r.lon));
    setResults([]);
    justSelected.current = true;
    setSearch(r.display_name);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", gap: "0.4rem", position: "relative" }}>
        <input
          type="text" value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(search, true); } }}
          placeholder="Buscar dirección o lugar (ej. Av. Reforma 222, CDMX)"
          style={{ flex: 1, padding: "0.5rem 0.7rem", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "0.82rem", outline: "none", color: "#263a55", background: "#fff" }}
        />
        <button type="button" onClick={() => buscar(search, true)} disabled={searching || !search.trim()}
          style={{
            padding: "0.5rem 0.95rem", borderRadius: "8px", border: "none",
            background: searching || !search.trim() ? "#e0e0e0" : "#263a55",
            color: searching || !search.trim() ? "#999" : "#fff",
            fontSize: "0.78rem", fontWeight: 700,
            cursor: searching || !search.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}>
          {searching ? "..." : "Buscar"}
        </button>
        {results.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem",
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 1000, maxHeight: "200px", overflowY: "auto",
          }}>
            {results.map(r => (
              <button key={r.place_id} type="button" onClick={() => elegir(r)} className="t-geo-item">
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
      {searchError && <p style={{ fontSize: "0.72rem", color: "#dc2626" }}>{searchError}</p>}
      <MapContainer center={center} zoom={11} style={{ height: "200px", width: "100%", borderRadius: "8px" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {lat != null && lng != null && <Marker position={[lat, lng]} />}
        <RecenterMap lat={lat} lng={lng} />
        <ClickHandler onChange={onChange} />
      </MapContainer>
    </div>
  );
}
