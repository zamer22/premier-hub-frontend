import type { ReactNode } from "react";
import { PageHeader } from "../ui";
import TransferVisual from "./visuals/TransferVisual";
import SimulatorVisual from "./visuals/SimulatorVisual";
import RewindVisual from "./visuals/RewindVisual";
import type { OffseasonTab } from "./types";
import LabDesafiosBanner from "./LabDesafiosBanner";

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
    title: "Predictor de Fichajes",
    description: "Predice la probabilidad de que un jugador sea fichado por un club de la Premier League, considerando su valor de mercado, estadísticas y la posición del club destino.",
    meta: "Basado en fichajes reales de la Premier",
    visual: <TransferVisual />,
  },
  {
    key: "simulator",
    title: "Simulador de Temporada",
    description: "Diseña una ventana de fichajes hipotética — hasta 5 traspasos — y simula cómo cambiaría la tabla de posiciones de la Premier League durante una temporada completa.",
    meta: "Simula la temporada completa miles de veces",
    visual: <SimulatorVisual />,
  },
  {
    key: "rewind",
    title: "Rebobina el Partido",
    description: "Elige un partido histórico, elimina goles o expulsiones clave y descubre cómo habría terminado si esos eventos nunca hubieran ocurrido.",
    meta: "Revive partidos históricos y cambia la historia",
    visual: <RewindVisual />,
  },
];

type Props = {
  onSelect: (tab: OffseasonTab | "desafios") => void;
  refreshKey?: number;
};

export default function LabHome({ onSelect, refreshKey = 0 }: Props) {
  return (
    <main className="ph-page">
      <PageHeader
        eyebrow="Laboratorio"
        title="Laboratorio Premier"
        subtitle="Explora escenarios hipotéticos de la Premier League. Predice fichajes, simula temporadas completas y revive partidos históricos."
        actions={<LabDesafiosBanner onOpen={() => onSelect("desafios")} refreshKey={refreshKey} />}
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
