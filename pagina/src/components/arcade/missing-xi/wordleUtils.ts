import type { LetterResult, AttemptRow } from "../../../types/missingXI";

export function evaluateAttempt(letters: string[], answer: string): LetterResult[] {
  const result: LetterResult[] = Array(letters.length).fill("absent");
  const remaining: (string | null)[] = answer.split("");

  for (let i = 0; i < letters.length; i++) {
    if (letters[i] === remaining[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }

  for (let i = 0; i < letters.length; i++) {
    if (result[i] === "correct") continue;
    const idx = remaining.indexOf(letters[i]);
    if (idx !== -1) {
      result[i] = "present";
      remaining[idx] = null;
    }
  }

  return result;
}

const PRIORITY: Record<LetterResult, number> = { correct: 3, present: 2, absent: 1 };

export function getKeyboardStates(
  attempts: AttemptRow[]
): Record<string, LetterResult | undefined> {
  const state: Record<string, LetterResult | undefined> = {};

  for (const row of attempts) {
    for (let i = 0; i < row.letters.length; i++) {
      const letter = row.letters[i];
      const res = row.results[i];
      const current = state[letter];
      if (!current || PRIORITY[res] > PRIORITY[current]) {
        state[letter] = res;
      }
    }
  }

  return state;
}
