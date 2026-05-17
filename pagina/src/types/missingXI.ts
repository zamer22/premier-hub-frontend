export type LetterResult = "correct" | "present" | "absent";

export interface AttemptRow {
  letters: string[];
  results: LetterResult[];
}

export interface MissingXIPlayer {
  id: number;
  firstName: string;
  lastName: string;
  answer: string;
  number: number;
  position: string;
  line: "goalkeeper" | "defense" | "midfield" | "attack";
  xPercent: number;
  yPercent: number;
  photoUrl?: string;
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
