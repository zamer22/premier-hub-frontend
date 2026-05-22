import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "../../../pages/admin/AdminEnvios.css";

const destinoIcon = L.divIcon({
  html: `<div style="background:#E90052;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">🏠</div>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 17],
});

const paqueteIcon = L.divIcon({
  html: `<div style="background:#2563eb;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">📦</div>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 17],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView(points[0], 13); return; }
    map.fitBounds(points, { padding: [40, 40] });
  }, [JSON.stringify(points)]); 
  return null;
}

interface AdminTrackingMapProps {
  destLat: number;
  destLng: number;
  actualLat: number | null;
  actualLng: number | null;
  onMovePackage: (lat: number, lng: number) => void;
}

// Mapa interactivo de admin. Click en cualquier punto llama onMovePackage para actualizar lat/lng del paquete.
export default function AdminTrackingMap({
  destLat, destLng, actualLat, actualLng, onMovePackage,
}: AdminTrackingMapProps) {
  function ClickHandler() {
    useMapEvents({ click: (e) => onMovePackage(e.latlng.lat, e.latlng.lng) });
    return null;
  }
  const tienePaquete = actualLat != null && actualLng != null;
  const puntos: [number, number][] = tienePaquete
    ? [[actualLat as number, actualLng as number], [destLat, destLng]]
    : [[destLat, destLng]];
  return (
    <MapContainer center={[destLat, destLng]} zoom={4} className="t-map-lg">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[destLat, destLng]} icon={destinoIcon} />
      {tienePaquete && (
        <>
          <Marker position={[actualLat as number, actualLng as number]} icon={paqueteIcon} />
          <Polyline positions={puntos} pathOptions={{ color: "#2563eb", dashArray: "8, 6", weight: 3 }} />
        </>
      )}
      <FitBounds points={puntos} />
      <ClickHandler />
    </MapContainer>
  );
}
