import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./OffseasonLab.css";
import TransferPredictor from "./TransferPredictor";
import SeasonSimulator from "./SeasonSimulator";
import MatchRewind from "./MatchRewind";
import { PageHeader } from "../../components/ui";
import type { PLClub } from "../../components/offseason/types";

const API_URL = import.meta.env.VITE_API_URL;

type Tab = "transfer" | "simulator" | "rewind";

// ── SVG visuals for each module card ─────────────────────────────────────────

function TransferVisual() {
  return (
    <svg viewBox="0 0 320 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {[50, 90, 130, 170].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(23,36,58,0.05)" strokeWidth="1" />
      ))}
      {[80, 160, 240].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="210" stroke="rgba(23,36,58,0.04)" strokeWidth="1" />
      ))}
      <path d="M 85 132 A 75 75 0 0 1 235 132"
        stroke="rgba(23,36,58,0.10)" strokeWidth="12" strokeLinecap="round" />
      <path d="M 85 132 A 75 75 0 0 1 218 72"
        stroke="#e90052" strokeWidth="12" strokeLinecap="round" />
      <circle cx="160" cy="132" r="56" stroke="rgba(23,36,58,0.07)" strokeWidth="1" strokeDasharray="4 6" />
      <circle cx="160" cy="132" r="38" stroke="rgba(23,36,58,0.04)" strokeWidth="1" />
      <text x="160" y="129" textAnchor="middle" fill="#17243a" fontSize="26" fontWeight="800" fontFamily="inherit" opacity="0.9">73%</text>
      <text x="160" y="148" textAnchor="middle" fill="#6b7280" fontSize="9" fontWeight="700" fontFamily="inherit" letterSpacing="2">PROB.</text>
      <circle cx="60" cy="178" r="18" fill="rgba(23,36,58,0.06)" stroke="rgba(23,36,58,0.14)" strokeWidth="1.5" />
      <circle cx="260" cy="178" r="18" fill="rgba(233,0,82,0.08)" stroke="#e90052" strokeWidth="1.5" />
      <line x1="81" y1="178" x2="238" y2="178" stroke="rgba(23,36,58,0.10)" strokeWidth="1.5" strokeDasharray="5 4" />
      <polyline points="231,171 240,178 231,185" stroke="rgba(23,36,58,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SimulatorVisual() {
  const heights = [52, 68, 82, 56, 96, 72, 42, 88, 64, 78, 50, 100, 66, 54, 44, 74, 88, 62, 40, 76];
  const affected = new Set([4, 11]);
  const barW = 10;
  const gap  = 5.5;
  const startX = 14;
  const baseY  = 178;

  return (
    <svg viewBox="0 0 320 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {[40, 80, 120].map((h) => (
        <line key={h} x1="10" y1={baseY - h} x2="310" y2={baseY - h} stroke="rgba(23,36,58,0.06)" strokeWidth="1" />
      ))}
      <line x1="10" y1={baseY} x2="310" y2={baseY} stroke="rgba(23,36,58,0.14)" strokeWidth="1" />
      {heights.map((h, i) => {
        const x = startX + i * (barW + gap);
        return (
          <rect
            key={i} x={x} y={baseY - h} width={barW} height={h} rx="2.5"
            fill={affected.has(i) ? "#e90052" : "rgba(23,36,58,0.12)"}
          />
        );
      })}
      <text
        x={startX + 4 * (barW + gap) + barW / 2}
        y={baseY - 102}
        textAnchor="middle" fill="#e90052" fontSize="9" fontWeight="800" fontFamily="inherit"
      >+12%</text>
      <circle
        cx={startX + 11 * (barW + gap) + barW / 2}
        cy={baseY - 110}
        r="7" fill="rgba(233,0,82,0.12)" stroke="#e90052" strokeWidth="1"
      />
    </svg>
  );
}

function RewindVisual() {
  return (
    <svg viewBox="0 0 320 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="28" y="26" width="88" height="52" rx="10"
        fill="rgba(23,36,58,0.04)" stroke="rgba(23,36,58,0.14)" strokeWidth="1.5" />
      <text x="72" y="47" textAnchor="middle" fill="#6b7280" fontSize="10" fontWeight="700" fontFamily="inherit" letterSpacing="1">REAL</text>
      <text x="72" y="70" textAnchor="middle" fill="#17243a" fontSize="22" fontWeight="900" fontFamily="inherit">2 – 1</text>
      <line x1="120" y1="52" x2="172" y2="52" stroke="rgba(23,36,58,0.12)" strokeWidth="1.5" strokeDasharray="4 3" />
      <polyline points="165,45 174,52 165,59" stroke="rgba(23,36,58,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="178" y="26" width="88" height="52" rx="10"
        fill="rgba(233,0,82,0.06)" stroke="#e90052" strokeWidth="1.5" />
      <text x="222" y="47" textAnchor="middle" fill="rgba(233,0,82,0.7)" fontSize="10" fontWeight="700" fontFamily="inherit" letterSpacing="1">ALT.</text>
      <text x="222" y="70" textAnchor="middle" fill="#17243a" fontSize="22" fontWeight="900" fontFamily="inherit">1 – 1</text>
      <line x1="40" y1="122" x2="280" y2="122" stroke="rgba(23,36,58,0.10)" strokeWidth="1.5" />
      <circle cx="80" cy="122" r="8" fill="rgba(23,36,58,0.06)" stroke="rgba(23,36,58,0.18)" strokeWidth="1.5" />
      <text x="80" y="144" textAnchor="middle" fill="#9ca3af" fontSize="9" fontWeight="700" fontFamily="inherit">23'</text>
      <circle cx="160" cy="122" r="8" fill="rgba(233,0,82,0.10)" stroke="#e90052" strokeWidth="1.5" />
      <line x1="155.5" y1="117.5" x2="164.5" y2="126.5" stroke="#e90052" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="164.5" y1="117.5" x2="155.5" y2="126.5" stroke="#e90052" strokeWidth="1.5" strokeLinecap="round" />
      <text x="160" y="144" textAnchor="middle" fill="#e90052" fontSize="9" fontWeight="700" fontFamily="inherit">67'</text>
      <circle cx="222" cy="122" r="8" fill="rgba(233,0,82,0.10)" stroke="#e90052" strokeWidth="1.5" />
      <line x1="217.5" y1="117.5" x2="226.5" y2="126.5" stroke="#e90052" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="226.5" y1="117.5" x2="217.5" y2="126.5" stroke="#e90052" strokeWidth="1.5" strokeLinecap="round" />
      <text x="222" y="144" textAnchor="middle" fill="#e90052" fontSize="9" fontWeight="700" fontFamily="inherit">78'</text>
      <circle cx="272" cy="122" r="8" fill="rgba(23,36,58,0.06)" stroke="rgba(23,36,58,0.18)" strokeWidth="1.5" />
      <text x="272" y="144" textAnchor="middle" fill="#9ca3af" fontSize="9" fontWeight="700" fontFamily="inherit">90'</text>
      <text x="160" y="184" textAnchor="middle" fill="#9ca3af" fontSize="9" fontWeight="700" fontFamily="inherit" letterSpacing="2">EVENTOS ELIMINADOS</text>
    </svg>
  );
}

// ── Module card data ──────────────────────────────────────────────────────────

// ── PL facts overlay ──────────────────────────────────────────────────────────

const PL_FACTS = [
  {
    badge: "https://media.api-sports.io/football/teams/34.png",
    club: "Newcastle United",
    label: "Máximo goleador histórico",
    stat: "260", unit: "goles",
    detail: "Alan Shearer marcó 260 goles con Newcastle y Blackburn. Ningún jugador ha superado esa cifra en la era Premier.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/33.png",
    club: "Manchester United",
    label: "Más títulos en la Premier League",
    stat: "13", unit: "títulos",
    detail: "Manchester United dominó la era Premier bajo Alex Ferguson, ganando 13 de los primeros 21 títulos disputados.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/42.png",
    club: "Arsenal",
    label: "Los Invencibles — 2003/04",
    stat: "49", unit: "partidos sin perder",
    detail: "El Arsenal de Wenger fue invicto durante toda la temporada 2003/04. Ningún equipo ha repetido esa hazaña.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/50.png",
    club: "Manchester City",
    label: "Temporada perfecta — 2017/18",
    stat: "100", unit: "puntos",
    detail: "El City de Guardiola alcanzó los 100 puntos en una sola temporada, el récord máximo de la Premier League.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/40.png",
    club: "Liverpool",
    label: "30 años de espera — 2019/20",
    stat: "99", unit: "puntos",
    detail: "Liverpool ganó su primera Premier League en 30 años con 99 puntos, rompiéndole el dominio al City.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/41.png",
    club: "Southampton",
    label: "El gol más rápido de la historia",
    stat: "7.69", unit: "segundos",
    detail: "Shane Long anotó a los 7.69 segundos del pitido inicial ante Watford en 2019. El gol más veloz de la PL.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/50.png",
    club: "Manchester City",
    label: "Récord de asistencias — 2019/20",
    stat: "20", unit: "asistencias",
    detail: "Kevin De Bruyne igualó el récord histórico de Thierry Henry con 20 asistencias en una sola temporada.",
  },
];

function ComputingModal() {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const iv = setInterval(() => setFactIndex((p) => (p + 1) % PL_FACTS.length), 4200);
    return () => {
      document.body.style.overflow = "";
      clearInterval(iv);
    };
  }, []);

  const fact = PL_FACTS[factIndex];

  return createPortal(
    <div className="ol-overlay">
      <div className="ol-overlay-card" onClick={(e) => e.stopPropagation()}>
        <div className="ol-overlay-header">
          <span className="ol-spinner ol-spinner--sm" />
          <span className="ol-overlay-status">Calculando modelo…</span>
        </div>

        <div className="ol-overlay-fact" key={factIndex}>
          <img
            src={fact.badge}
            alt={fact.club}
            className="ol-overlay-badge"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="ol-overlay-stat-row">
            <span className="ol-overlay-stat">{fact.stat}</span>
            <span className="ol-overlay-unit">{fact.unit}</span>
          </div>
          <p className="ol-overlay-label">{fact.label}</p>
          <p className="ol-overlay-detail">{fact.detail}</p>
        </div>

        <div className="ol-overlay-dots">
          {PL_FACTS.map((_, i) => (
            <span key={i} className={`ol-overlay-dot${i === factIndex ? " ol-overlay-dot--active" : ""}`} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Module card data ──────────────────────────────────────────────────────────

type ModuleCard = { key: Tab; title: string; description: string; meta: string; visual: React.ReactNode };

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

const MODULE_LABELS: Record<Tab, string> = {
  transfer:  "Transfer Predictor",
  simulator: "Season Simulator",
  rewind:    "Match Rewind",
};

// ── Home screen ───────────────────────────────────────────────────────────────

function LabHome({ onSelect }: { onSelect: (t: Tab) => void }) {
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

// ── Root ──────────────────────────────────────────────────────────────────────

export default function OffseasonLab({ user }: { user: any }) {
  const [activeModule, setActiveModule] = useState<Tab | null>(null);
  const [clubs, setClubs]               = useState<PLClub[]>([]);
  const [isComputing, setIsComputing]   = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/ml/clubs`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setClubs(data.data); })
      .catch(() => {});
  }, []);

  const handleLoadingChange = useCallback((v: boolean) => setIsComputing(v), []);

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
