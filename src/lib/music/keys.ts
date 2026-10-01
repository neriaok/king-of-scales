import type { Degree, DegreeId } from './degrees';
import { DEGREES, sortDegrees } from './degrees';
import type { Accidental, Letter } from './notes';
import {
  LETTER_PITCH_CLASS,
  accidentalFor,
  chordSymbol,
  formatNote,
  letterAbove,
  mod12,
} from './notes';

export interface MusicalKey {
  /** ASCII name, e.g. `Db`. */
  name: string;
  /** Display name, e.g. `D♭`. */
  displayName: string;
  letter: Letter;
  accidental: Accidental;
  pitchClass: number;
  /** Easy to play with open chords (no barre). */
  isEasy: boolean;
  /** Capo fret for playing this key with C shapes (0 = no capo). */
  capoFromC: number;
}

/** The 12 major keys, a half step apart starting from C, with conventional spellings. */
const KEY_ROOTS: readonly (readonly [Letter, Accidental])[] = [
  ['C', 0],
  ['D', -1],
  ['D', 0],
  ['E', -1],
  ['E', 0],
  ['F', 0],
  ['F', 1],
  ['G', 0],
  ['A', -1],
  ['A', 0],
  ['B', -1],
  ['B', 0],
];

const EASY_KEYS = new Set(['C', 'D', 'E', 'G', 'A']);

export const KEYS: readonly MusicalKey[] = KEY_ROOTS.map(([letter, accidental], index) => {
  const name = chordSymbol(letter, accidental, 'major');
  return {
    name,
    displayName: formatNote(letter, accidental),
    letter,
    accidental,
    pitchClass: mod12(LETTER_PITCH_CLASS[letter] + accidental),
    isEasy: EASY_KEYS.has(name),
    capoFromC: index,
  };
});

/** The diatonic chord a degree gives in a key, spelled with the scale's own letters. */
export const diatonicChord = (key: MusicalKey, degree: Degree): string => {
  const letter = letterAbove(key.letter, degree.step);
  const pitchClass = mod12(key.pitchClass + degree.semitones);
  return chordSymbol(letter, accidentalFor(letter, pitchClass), degree.quality);
};

/** All seven diatonic chords of a key, in degree order. */
export const diatonicChords = (key: MusicalKey): string[] =>
  DEGREES.map((degree) => diatonicChord(key, degree));

export interface TableCell {
  degreeId: DegreeId;
  /** ASCII chord symbol, e.g. `F#m`. */
  chord: string;
}

export interface TableRow {
  key: MusicalKey;
  cells: TableCell[];
}

/** One row per key with exactly the selected degrees as columns, always in degree order. */
export const buildTable = (selectedDegrees: readonly DegreeId[]): TableRow[] => {
  const columns = DEGREES.filter((degree) => sortDegrees(selectedDegrees).includes(degree.id));
  return KEYS.map((key) => ({
    key,
    cells: columns.map((degree) => ({ degreeId: degree.id, chord: diatonicChord(key, degree) })),
  }));
};
