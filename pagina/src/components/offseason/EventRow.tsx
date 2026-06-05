import type { EventKind, MatchEvent } from "./types";

// Abreviatura textual por tipo de evento — sin emojis para mantener look uniforme.
export const KIND_ABBR: Record<EventKind, string> = {
  goal:           "GOL",
  penalty:        "PEN",
  own_goal:       "PPG",
  red_card:       "ROJA",
  missed_penalty: "FALLO",
  yellow_card:    "AMA",
  substitution:   "CAM",
  var:            "VAR",
};

type Props = {
  event: MatchEvent;
  selected: boolean;
  onToggle: (id: string) => void;
};

export default function EventRow({ event, selected, onToggle }: Props) {
  const inner = (
    <>
      <span className="ol-event-minute">{event.minute}'</span>
      <span className="ol-event-icon">{KIND_ABBR[event.kind]}</span>
      <div className="ol-event-info">
        <span className="ol-event-player">{event.player_name}</span>
        <span className="ol-event-type">
          {event.label}{event.detail ? ` · ${event.detail}` : ""}
        </span>
      </div>
      {event.removable && (
        <span className="ol-event-check">{selected ? "✕" : "+"}</span>
      )}
    </>
  );

  // Eventos no-removibles solo se muestran como contexto del timeline (sin click).
  if (!event.removable) {
    return <div className="ol-event-card ol-event-card--context">{inner}</div>;
  }

  return (
    <button
      type="button"
      className={`ol-event-card${selected ? " ol-event-card--selected" : ""}`}
      onClick={() => onToggle(event.id)}
    >
      {inner}
    </button>
  );
}
