import { useEffect, useState } from "react";
import "./OffseasonLab.css";
import TransferPredictor from "./TransferPredictor";
import SeasonSimulator from "./SeasonSimulator";
import MatchRewind from "./MatchRewind";
import type { PLClub } from "../../components/offseason/types";

const API_URL = import.meta.env.VITE_API_URL;

type Tab = "transfer" | "simulator" | "rewind";

const TABS: { key: Tab; label: string }[] = [
  { key: "transfer", label: "Transfer Predictor 💸" },
  { key: "simulator", label: "Season Simulator 🏆" },
  { key: "rewind", label: "Classic Match Rewind ⏪" },
];

export default function OffseasonLab({ user }: { user: any }) {
  const [tab, setTab] = useState<Tab>("transfer");
  const [clubs, setClubs] = useState<PLClub[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/ml/clubs`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setClubs(data.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="ol-root">
      <div className="ol-header">
        <div className="ol-header-text">
          <h1 className="ol-title">Offseason Lab</h1>
          <p className="ol-subtitle">
            Explora escenarios hipotéticos de la Premier League con modelos de ML.
          </p>
        </div>
        <nav className="ol-tabs" aria-label="Módulos">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`ol-tab${tab === t.key ? " ol-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === "transfer" && <TransferPredictor clubs={clubs} />}
      {tab === "simulator" && <SeasonSimulator clubs={clubs} />}
      {tab === "rewind" && <MatchRewind />}
    </div>
  );
}
