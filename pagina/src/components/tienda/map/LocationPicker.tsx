import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { DEFAULT_MAP_CENTER } from "../constants";
import "../../../pages/tienda/Tienda.css";

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
        if (manual) setSearchError("Sin resultados. Intenta con más detalle o menos términos.");
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
    <div className="t-loc-picker">
      <div className="t-loc-picker__row">
        <input
          type="text" value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(search, true); } }}
          placeholder="Buscar dirección o lugar (ej. Av. Reforma 222, CDMX)"
          className="t-loc-picker__input"
        />
        <button
          type="button" onClick={() => buscar(search, true)}
          disabled={searching || !search.trim()}
          className={`t-loc-picker__btn${searching || !search.trim() ? " t-loc-picker__btn--off" : " t-loc-picker__btn--on"}`}
        >
          {searching ? "..." : "Buscar"}
        </button>
        {results.length > 0 && (
          <div className="t-loc-picker__dropdown">
            {results.map(r => (
              <button key={r.place_id} type="button" onClick={() => elegir(r)} className="t-geo-item">
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
      {searchError && <p className="t-geo-error">{searchError}</p>}
      <MapContainer center={center} zoom={11} className="t-map-sm">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {lat != null && lng != null && <Marker position={[lat, lng]} />}
        <RecenterMap lat={lat} lng={lng} />
        <ClickHandler onChange={onChange} />
      </MapContainer>
    </div>
  );
}
