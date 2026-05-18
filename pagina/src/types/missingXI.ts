export type LetterResult = "correct" | "present" | "absent";

export interface AttemptRow {
  letters: string[];
  results: LetterResult[];
}

export interface MissingXIPlayer {
  id: string;
  apiPlayerId?: number;
  apiTeamId?: number;
  firstName: string;
  lastName: string;
  displayName: string;
  answer: string;
  number: number | null;
  position: string;
  line: "goalkeeper" | "defense" | "midfield" | "attack";
  xPercent: number;
  yPercent: number;
  photoUrl: string | null;
  guessed: boolean;
  failed: boolean;
  usedHint: boolean;
  attempts: AttemptRow[];
}

export interface MissingXIMatch {
  id: string;
  league: string;
  season: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: string;
  formation: string;
  players: MissingXIPlayer[];
}
