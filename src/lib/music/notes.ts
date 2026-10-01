/**
 * Note and chord-symbol primitives.
 *
 * Chord symbols use ASCII internally (`C`, `F#m`, `Bb`, `E#°`) and are turned into
 * typographic symbols (♯ ♭) only for display.
 */

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** Semitone shift applied to a natural letter: -2 = 𝄫, -1 = ♭, 0 = ♮, 1 = ♯, 2 = 𝄪. */
export type Accidental = -2 | -1 | 0 | 1 | 2;

export type ChordQuality = 'major' | 'minor' | 'diminished';

export interface Chord {
  /** The symbol as parsed, e.g. `F#m`. */
  symbol: string;
  letter: Letter;
  accidental: Accidental;
  /** 0–11, C = 0. */
  pitchClass: number;
  quality: ChordQuality;
}

export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Pitch class of each natural letter. */
export const LETTER_PITCH_CLASS: Readonly<Record<Letter, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const ACCIDENTAL_FROM_TEXT: Readonly<Record<string, Accidental>> = {
  '': 0,
  '#': 1,
  '♯': 1,
  '##': 2,
  x: 2,
  '𝄪': 2,
  b: -1,
  '♭': -1,
  bb: -2,
  '𝄫': -2,
};

const ACCIDENTAL_ASCII: Readonly<Record<Accidental, string>> = {
  [-2]: 'bb',
  [-1]: 'b',
  0: '',
  1: '#',
  2: '##',
};

const ACCIDENTAL_DISPLAY: Readonly<Record<Accidental, string>> = {
  [-2]: '𝄫',
  [-1]: '♭',
  0: '',
  1: '♯',
  2: '𝄪',
};

const QUALITY_FROM_SUFFIX: Readonly<Record<string, ChordQuality>> = {
  '': 'major',
  m: 'minor',
  '°': 'diminished',
  dim: 'diminished',
};

const QUALITY_SUFFIX: Readonly<Record<ChordQuality, string>> = {
  major: '',
  minor: 'm',
  diminished: '°',
};

const CHORD_PATTERN = /^([A-G])(##|bb|#|b|x|♯|♭|𝄪|𝄫)?(m|°|dim)?$/u;

/** Wraps any integer into the 0–11 range. */
export const mod12 = (value: number): number => ((value % 12) + 12) % 12;

export const isLetter = (value: string): value is Letter =>
  (LETTERS as readonly string[]).includes(value);

/** Parses a chord symbol such as `C`, `F#m`, `Bb` or `E#°`. Throws on invalid input. */
export const parseChord = (symbol: string): Chord => {
  const match = CHORD_PATTERN.exec(symbol);
  const letterText = match?.[1];
  if (!match || letterText === undefined || !isLetter(letterText)) {
    throw new Error(`Invalid chord symbol: "${symbol}"`);
  }
  const accidental = ACCIDENTAL_FROM_TEXT[match[2] ?? ''] ?? 0;
  const quality = QUALITY_FROM_SUFFIX[match[3] ?? ''] ?? 'major';
  return {
    symbol,
    letter: letterText,
    accidental,
    pitchClass: mod12(LETTER_PITCH_CLASS[letterText] + accidental),
    quality,
  };
};

/** Builds the ASCII chord symbol for a root and quality, e.g. (`F`, 1, `minor`) → `F#m`. */
export const chordSymbol = (
  letter: Letter,
  accidental: Accidental,
  quality: ChordQuality,
): string => `${letter}${ACCIDENTAL_ASCII[accidental]}${QUALITY_SUFFIX[quality]}`;

/** Display name of a single note, e.g. (`E`, 1) → `E♯`. */
export const formatNote = (letter: Letter, accidental: Accidental): string =>
  `${letter}${ACCIDENTAL_DISPLAY[accidental]}`;

/** Turns an ASCII chord symbol into its display form: `#` → ♯ and `b` → ♭. */
export const formatChord = (symbol: string): string =>
  symbol
    .replace(/##/g, '𝄪')
    .replace(/#/g, '♯')
    .replace(/([A-G])bb/g, '$1𝄫')
    .replace(/([A-G])b/g, '$1♭');

/** Accidental needed to make `letter` sound as `pitchClass` (nearest spelling, ±2). */
export const accidentalFor = (letter: Letter, pitchClass: number): Accidental => {
  let diff = mod12(pitchClass - LETTER_PITCH_CLASS[letter]);
  if (diff > 6) diff -= 12;
  if (diff < -2 || diff > 2) {
    throw new Error(`Cannot spell pitch class ${pitchClass} on letter ${letter}`);
  }
  return diff as Accidental;
};

/** The letter `steps` letters above `letter` (C → E is 2 steps). */
export const letterAbove = (letter: Letter, steps: number): Letter => {
  const index = LETTERS.indexOf(letter);
  const next = LETTERS[(((index + steps) % 7) + 7) % 7];
  if (next === undefined) throw new Error('Unreachable: letter index out of range');
  return next;
};
