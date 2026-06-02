import { ESTADOS, ESTADO_LABEL } from "./constants";

type Props = {
  filtroEstado: string;
  onFiltroChange: (estado: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  count: number;
};

export default function EnviosFilters({ filtroEstado, onFiltroChange, search, onSearchChange, count }: Props) {
  return (
    <div className="adm-filters">
      <div className="adm-filters__chips">
        {["todos", ...ESTADOS].map((e) => (
          <button
            key={e}
            onClick={() => onFiltroChange(e)}
            className={`adm-chip${filtroEstado === e ? " adm-chip--active" : ""}`}
          >
            {e === "todos" ? "Todos" : ESTADO_LABEL[e]}
          </button>
        ))}
      </div>
      <input
        placeholder="Buscar por # de pedido o tracking..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="adm-input adm-search"
      />
      <span className="adm-count">{count} pedido{count === 1 ? "" : "s"}</span>
    </div>
  );
}
