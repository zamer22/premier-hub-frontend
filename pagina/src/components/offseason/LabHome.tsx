import type { ReactNode } from "react";
import { PageHeader } from "../ui";
import TransferVisual from "./visuals/TransferVisual";
import SimulatorVisual from "./visuals/SimulatorVisual";
import RewindVisual from "./visuals/RewindVisual";
import type { OffseasonTab } from "./types";

type ModuleCard = {
  key: OffseasonTab;
  title: string;
  description: string;
  meta: string;
  visual: ReactNode;
};

const MODULE_CARDS: ModuleCard[] = [
  {
    key: "transfer",
    title: "Transfer Predictor",
    description: "Predice la probabilidad de que un jugador sea fichado por un club de la Premier League, considerando su valor de mercado, estadísticas y la posición del club destino.",
    meta: "XGBoost · 73% de precisión · Transfermarkt",
    visual: <TransferVisual />,
  },
  {
    key: "simulator",
    title: "Season Simulator",
    description: "Diseña una ventana de fichajes hipotética — hasta 5 traspasos — y simula cómo cambiaría la tabla de posiciones de la Premier League temporada completa.",
    meta: "Monte Carlo · 1 000 iteraciones · Poisson",
    visual: <SimulatorVisual />,
  },
  {
    key: "rewind",
    title: "Match Rewind",
    description: "Elige un partido histórico, elimina goles o expulsiones clave y descubre cómo habría terminado si esos eventos nunca hubieran ocurrido.",
    meta: "xG Proxy · Poisson 5 000 iter. · API-Football",
    visual: <RewindVisual />,
  },
];

type Props = {
  onSelect: (tab: OffseasonTab) => void;
};

export default function LabHome({ onSelect }: Props) {
  return (
    <main className="ph-page">
      <PageHeader
        eyebrow="Laboratorio"
        title="Laboratorio Premier"
        subtitle="Explora escenarios hipotéticos de la Premier League con modelos de ML. Predice fichajes, simula temporadas completas y revive partidos históricos."
      />

      <div className="ol-module-grid">
        {MODULE_CARDS.map((m) => (
          <button
            key={m.key}
            type="button"
            className="ol-module-card"
            onClick={() => onSelect(m.key)}
          >
            <div className="ol-module-visual">{m.visual}</div>
            <div className="ol-module-body">
              <h2 className="ol-module-title">{m.title}</h2>
              <p className="ol-module-desc">{m.description}</p>
              <p className="ol-module-meta">{m.meta}</p>
              <div className="ol-module-cta-row">
                <div className="ol-module-cta">Abrir módulo</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
