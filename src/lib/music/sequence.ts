import type { DegreeId } from './degrees';
import { DEGREE_IDS } from './degrees';

/** Characters allowed between degree numbers: spaces, dashes, dots, commas, slashes, arrows. */
const SEPARATORS = /[\s\-–—·.,/|>→←]/u;
/** Quality marks people may type out of habit; the scale already decides the quality. */
const QUALITY_MARKS = /[m°o]/iu;

export type SequenceError = 'empty' | 'invalid';

export type SequenceResult =
  | { ok: true; degrees: DegreeId[]; hadDuplicates: boolean }
  | { ok: false; error: SequenceError; invalid: string[] };

/**
 * Parses a typed degree sequence such as `1-6-4-5`, `1 6 4 5` or `1645` into degree ids in
 * the order typed. Each digit 1–7 is one degree (6 → 6m, 7 → 7°). Repeats are kept once.
 */
export const parseDegreeSequence = (text: string): SequenceResult => {
  const degrees: DegreeId[] = [];
  const invalid: string[] = [];
  let hadDuplicates = false;

  for (const char of text) {
    if (SEPARATORS.test(char) || QUALITY_MARKS.test(char)) continue;
    const step = /^[1-7]$/u.test(char) ? Number(char) : NaN;
    const id = DEGREE_IDS[step - 1];
    if (id === undefined) {
      if (!invalid.includes(char)) invalid.push(char);
      continue;
    }
    if (degrees.includes(id)) hadDuplicates = true;
    else degrees.push(id);
  }

  if (invalid.length > 0) return { ok: false, error: 'invalid', invalid };
  if (degrees.length === 0) return { ok: false, error: 'empty', invalid: [] };
  return { ok: true, degrees, hadDuplicates };
};

/** The sequence as digits for display in the input, e.g. ['1', '6m', '4'] → `1-6-4`. */
export const formatDegreeSequence = (degrees: readonly DegreeId[]): string =>
  degrees.map((id) => String(DEGREE_IDS.indexOf(id) + 1)).join('-');

export type SuggestionId = 'all' | 'pop' | 'fifties' | 'sensitive' | 'jazz' | 'blues';

export interface SequenceSuggestion {
  id: SuggestionId;
  /** Degrees in playing order. */
  degrees: readonly DegreeId[];
}

/** Common progressions, offered next to the sequence input in playing order. */
export const SEQUENCE_SUGGESTIONS: readonly SequenceSuggestion[] = [
  { id: 'all', degrees: DEGREE_IDS },
  { id: 'pop', degrees: ['1', '5', '6m', '4'] },
  { id: 'fifties', degrees: ['1', '6m', '4', '5'] },
  { id: 'sensitive', degrees: ['6m', '4', '1', '5'] },
  { id: 'jazz', degrees: ['2m', '5', '1'] },
  { id: 'blues', degrees: ['1', '4', '5'] },
];
