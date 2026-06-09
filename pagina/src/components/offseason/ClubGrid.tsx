import type { PLClub } from "./types";

export const crestUrl = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;

type Props = {
  clubs: PLClub[];
  selectedId: number | "";
  onSelect: (id: number) => void;
  disabled?: boolean;
};

export default function ClubGrid({ clubs, selectedId, onSelect, disabled }: Props) {
  if (clubs.length === 0) {
    return <p className="lab-club-grid-empty">Cargando clubes...</p>;
  }

  return (
    <div className="lab-club-grid">
      {clubs.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={disabled}
          className={`lab-club-card${selectedId === c.id ? " lab-club-card--active" : ""}`}
          onClick={() => onSelect(c.id)}
        >
          <img src={crestUrl(c.id)} alt={c.name} className="lab-club-crest" loading="lazy" />
          <span className="lab-club-name">{c.name}</span>
        </button>
      ))}
    </div>
  );
}
