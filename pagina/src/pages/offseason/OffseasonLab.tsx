import { useEffect, useState, useCallback } from "react";
import "./OffseasonLab.css";
import TransferPredictor from "./TransferPredictor";
import SeasonSimulator from "./SeasonSimulator";
import MatchRewind from "./MatchRewind";
import type { OffseasonTab, PLClub } from "../../components/offseason/types";
import LabHome from "../../components/offseason/LabHome";
import ComputingModal from "../../components/offseason/ComputingModal";

const API_URL = import.meta.env.VITE_API_URL;

const MODULE_LABELS: Record<OffseasonTab, string> = {
  transfer:  "Transfer Predictor",
  simulator: "Season Simulator",
  rewind:    "Match Rewind",
};

export default function OffseasonLab({ user: _user }: { user: any }) {
  const [activeModule, setActiveModule] = useState<OffseasonTab | null>(null);
  const [clubs, setClubs]               = useState<PLClub[]>([]);
  const [isComputing, setIsComputing]   = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/ml/clubs`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setClubs(data.data); })
      .catch(() => {});
  }, []);

  const handleLoadingChange = useCallback((v: boolean) => setIsComputing(v), []);

  // Bloqueamos el botón Volver mientras corre la inferencia ML para evitar estado inconsistente.
  const handleBack = () => {
    if (isComputing) return;
    setActiveModule(null);
    setIsComputing(false);
  };

  if (!activeModule) {
    return <LabHome onSelect={setActiveModule} />;
  }

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
          <h1 className="ph-title">{MODULE_LABELS[activeModule]}</h1>
        </div>
      </div>

      {isComputing && <ComputingModal />}

      {/* Los 3 módulos se mantienen montados (ol-pane--hidden los oculta) para preservar
          estado de formularios al alternar entre ellos. */}
      <div className={activeModule !== "transfer" ? "ol-pane--hidden" : undefined}>
        <TransferPredictor clubs={clubs} onLoadingChange={handleLoadingChange} />
      </div>
      <div className={activeModule !== "simulator" ? "ol-pane--hidden" : undefined}>
        <SeasonSimulator clubs={clubs} onLoadingChange={handleLoadingChange} />
      </div>
      <div className={activeModule !== "rewind" ? "ol-pane--hidden" : undefined}>
        <MatchRewind onLoadingChange={handleLoadingChange} />
      </div>
    </main>
  );
}
