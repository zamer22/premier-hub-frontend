import { useEffect, useRef, useState } from "react";

type GeoResult = { display_name: string; lat: string; lon: string; place_id: number };

type Props = {
  resetKey: number | string;
  onPick: (lat: number, lng: number) => void;
};

// Encapsula búsqueda de lugares vía Nominatim (OpenStreetMap, sin API key).
// El padre solo se entera de la coordenada elegida.
export default function GeoSearchBox({ resetKey, onPick }: Props) {
  const [search, setSearch]       = useState("");
  const [results, setResults]     = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const justSelected = useRef(false);

  // Cuando cambia el pedido seleccionado en el padre, limpiamos el estado del buscador.
  useEffect(() => {
    setSearch("");
    setResults([]);
    setError(null);
  }, [resetKey]);

  const buscar = async (q: string, manual: boolean) => {
    const term = q.trim();
    if (!term) return;
    setSearching(true);
    setError(null);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1&q=${encodeURIComponent(term)}`,
        { headers: { "Accept-Language": "es" } },
      );
      const data = await r.json();
      if (!Array.isArray(data) || data.length === 0) {
        setResults([]);
        if (manual) setError("Sin resultados. Intentá con más detalle o menos términos.");
      } else {
        setResults(data);
      }
    } catch {
      if (manual) setError("Error al buscar");
    } finally {
      setSearching(false);
    }
  };

  // Debounce búsqueda automática mientras tipea (mínimo 3 chars).
  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    const term = search.trim();
    if (term.length < 3) {
      setResults([]);
      setError(null);
      return;
    }
    const t = setTimeout(() => buscar(term, false), 500);
    return () => clearTimeout(t);
  }, [search]);

  const elegir = (r: GeoResult) => {
    onPick(Number(r.lat), Number(r.lon));
    setResults([]);
    justSelected.current = true;
    setSearch(r.display_name);
  };

  return (
    <>
      <div className="adm-geo-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              buscar(search, true);
            }
          }}
          placeholder="Buscar lugar (ej. FedEx Polanco 222, CDMX)"
          className="adm-input adm-geo-input"
        />
        <button
          type="button"
          onClick={() => buscar(search, true)}
          disabled={searching || !search.trim()}
          className={`adm-geo-btn${searching || !search.trim() ? " adm-geo-btn--off" : " adm-geo-btn--active"}`}
        >
          {searching ? "..." : "Buscar"}
        </button>

        {results.length > 0 && (
          <div className="adm-geo-dropdown">
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => elegir(r)}
                className="adm-geo-item"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="adm-geo-error">{error}</p>}
    </>
  );
}
