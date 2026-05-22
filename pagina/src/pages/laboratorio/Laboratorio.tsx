import { useEffect, useState } from "react";
import "./Laboratorio.css";
import type { PLClub } from "../../components/offseason/types";
import TransferPredictor from "./TransferPredictor";
import SeasonSimulator from "./SeasonSimulator";
import MatchRewind from "./MatchRewind";

const API_URL = import.meta.env.VITE_API_URL;

type Tab = "transfer" | "simulator" | "rewind";

const TABS: { key: Tab; label: string }[] = [
  { key: "transfer", label: "Transfer Predictor" },
  { key: "simulator", label: "Season Simulator" },
  { key: "rewind", label: "Match Rewind" },
];

export default function Laboratorio() {
  const [tab, setTab] = useState<Tab>("transfer");
  const [clubs, setClubs] = useState<PLClub[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/ml/clubs`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setClubs(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className={`lab-root lab-root--${tab}`}>
      <div className="lab-noise" />
      <div className="lab-orb-1" />
      <div className="lab-orb-2" />

      <div className="lab-inner">
        <div className="lab-header">
          <div className="lab-badge">
            <span className="lab-badge-dot" />
            Powered by ML
          </div>
          <h1 className="lab-title">Laboratorio Premier</h1>
          <p className="lab-subtitle">Explora escenarios hipotéticos de la Premier League</p>
        </div>

        <nav className="lab-tabs" aria-label="Módulos">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`lab-tab${tab === t.key ? " lab-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="lab-content">
          {tab === "transfer" && <TransferPredictor clubs={clubs} />}
          {tab === "simulator" && <SeasonSimulator clubs={clubs} />}
          {tab === "rewind" && <MatchRewind />}
        </div>
      </div>
    </div>
  );
}
