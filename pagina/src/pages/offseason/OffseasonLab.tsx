import { useEffect, useState, useCallback } from "react";
import "./OffseasonLab.css";
import TransferPredictor from "./TransferPredictor";
import SeasonSimulator from "./SeasonSimulator";
import MatchRewind from "./MatchRewind";
import type { OffseasonTab, PLClub } from "../../components/offseason/types";
import LabHome from "../../components/offseason/LabHome";
import LabDesafios from "../../components/offseason/LabDesafios";
import ComputingModal from "../../components/offseason/ComputingModal";

const API_URL = import.meta.env.VITE_API_URL;

// La vista activa puede ser uno de los 3 módulos ML o la pantalla de Desafíos.
type LabView = OffseasonTab | "desafios";

const MODULE_LABELS: Record<OffseasonTab, string> = {
  transfer:  "Transfer Predictor",
  simulator: "Season Simulator",
  rewind:    "Match Rewind",
};

type Props = {
  user: any;
  onSaldoChange?: (dinero: number) => void;
};

export default function OffseasonLab({ user: _user, onSaldoChange }: Props) {
  const [activeModule, setActiveModule] = useState<LabView | null>(null);
  const [clubs, setClubs]               = useState<PLClub[]>([]);
  const [isComputing, setIsComputing]   = useState(false);
  const [labRefreshKey, setLabRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/ml/clubs`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setClubs(data.data); })
      .catch(() => {});
  }, []);

  const handleLoadingChange = useCallback((v: boolean) => setIsComputing(v), []);

  const handleActionSuccess = useCallback(async (accion: string, resultado?: Record<string, unknown>) => {
    try {
      const res  = await fetch(`${API_URL}/api/lab/desafios/progreso`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ accion, resultado }),
      });
      const data = await res.json();
      if (data.success && data.data.nuevo_dinero !== undefined) {
        onSaldoChange?.(data.data.nuevo_dinero);
      }
    } catch {}
    setLabRefreshKey((k) => k + 1);
  }, [onSaldoChange]);

  // Bloqueamos el botón Volver mientras corre la inferencia ML para evitar estado inconsistente.
  const handleBack = () => {
    if (isComputing) return;
    setActiveModule(null);
    setIsComputing(false);
  };

  if (!activeModule) {
    return <LabHome onSelect={setActiveModule} refreshKey={labRefreshKey} />;
  }

  const esDesafios = activeModule === "desafios";

  return (
    <main className="ph-page">
      <div className="mb-4 grid justify-items-start gap-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={isComputing}
          className="w-fit text-base font-bold text-[#263a55] transition-colors hover:text-[#e90052] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Volver
        </button>
        <div>
          <p className="ph-eyebrow">Laboratorio</p>
          <h1 className="ph-title">{esDesafios ? "Desafíos del Laboratorio" : MODULE_LABELS[activeModule]}</h1>
          {esDesafios && (
            <p className="ph-subtitle">
              Completa acciones en los módulos del Laboratorio y gana puntos para tu saldo.
            </p>
          )}
        </div>
      </div>

      {isComputing && <ComputingModal />}

      {esDesafios ? (
        <LabDesafios refreshKey={labRefreshKey} onSaldoChange={onSaldoChange} showTitle={false} />
      ) : (
        <>
          {/* Los 3 módulos se mantienen montados (ol-pane--hidden los oculta) para preservar
              estado de formularios al alternar entre ellos. */}
          <div className={activeModule !== "transfer" ? "ol-pane--hidden" : undefined}>
            <TransferPredictor clubs={clubs} onLoadingChange={handleLoadingChange} onActionSuccess={handleActionSuccess} />
          </div>
          <div className={activeModule !== "simulator" ? "ol-pane--hidden" : undefined}>
            <SeasonSimulator clubs={clubs} onLoadingChange={handleLoadingChange} onActionSuccess={handleActionSuccess}  />
          </div>
          <div className={activeModule !== "rewind" ? "ol-pane--hidden" : undefined}>
            <MatchRewind onLoadingChange={handleLoadingChange} onActionSuccess={handleActionSuccess} />
          </div>
        </>
      )}
    </main>
  );
}
