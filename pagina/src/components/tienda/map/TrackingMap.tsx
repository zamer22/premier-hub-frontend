import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

export const destinoIcon = L.divIcon({
  html: `<div style="background:#E90052;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">🏠</div>`,
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});
export const paqueteIcon = L.divIcon({
  html: `<div style="background:#2563eb;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;">📦</div>`,
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView(points[0], 13); return; }
    map.fitBounds(points, { padding: [40, 40] });
  }, [JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

interface TrackingMapProps {
  destLat: number; destLng: number;
  actualLat?: number | null; actualLng?: number | null;
  mostrarPaquete: boolean;
}

export default function TrackingMap({ destLat, destLng, actualLat, actualLng, mostrarPaquete }: TrackingMapProps) {
  const tienePaquete = mostrarPaquete && actualLat != null && actualLng != null;
  const puntos: [number, number][] = tienePaquete
    ? [[actualLat as number, actualLng as number], [destLat, destLng]]
    : [[destLat, destLng]];
  return (
    <MapContainer center={[destLat, destLng]} zoom={5} style={{ height: "300px", width: "100%", borderRadius: "10px" }} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[destLat, destLng]} icon={destinoIcon} />
      {tienePaquete && (
        <>
          <Marker position={[actualLat as number, actualLng as number]} icon={paqueteIcon} />
          <Polyline positions={puntos} pathOptions={{ color: "#2563eb", dashArray: "8, 6", weight: 3 }} />
        </>
      )}
      <FitBounds points={puntos} />
    </MapContainer>
  );
}
