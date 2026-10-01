import type { Chord } from './notes';
import { mod12 } from './notes';

/** A fret per string, low E → high e. `null` is a muted string, `0` an open one. */
export type Fret = number | null;
export type GuitarVoicing = readonly [Fret, Fret, Fret, Fret, Fret, Fret];

const x = null;

/** MIDI pitches of the open strings in standard tuning (E2 A2 D3 G3 B3 E4). */
export const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64] as const;

export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'] as const;

/** Verified major shapes indexed by root pitch class (from the reference prototype). */
const MAJOR_SHAPES: readonly GuitarVoicing[] = [
  [x, 3, 2, 0, 1, 0], // C
  [x, 4, 6, 6, 6, 4], // C♯ / D♭
  [x, x, 0, 2, 3, 2], // D
  [x, 6, 8, 8, 8, 6], // D♯ / E♭
  [0, 2, 2, 1, 0, 0], // E
  [1, 3, 3, 2, 1, 1], // F
  [2, 4, 4, 3, 2, 2], // F♯ / G♭
  [3, 2, 0, 0, 0, 3], // G
  [4, 6, 6, 5, 4, 4], // G♯ / A♭
  [x, 0, 2, 2, 2, 0], // A
  [x, 1, 3, 3, 3, 1], // A♯ / B♭
  [x, 2, 4, 4, 4, 2], // B
];

/** Verified minor shapes indexed by root pitch class (from the reference prototype). */
const MINOR_SHAPES: readonly GuitarVoicing[] = [
  [x, 3, 5, 5, 4, 3], // Cm
  [x, 4, 6, 6, 5, 4], // C♯m / D♭m
  [x, x, 0, 2, 3, 1], // Dm
  [x, 6, 8, 8, 7, 6], // D♯m / E♭m
  [0, 2, 2, 0, 0, 0], // Em
  [1, 3, 3, 1, 1, 1], // Fm
  [2, 4, 4, 2, 2, 2], // F♯m
  [3, 5, 5, 3, 3, 3], // Gm
  [4, 6, 6, 4, 4, 4], // G♯m / A♭m
  [x, 0, 2, 2, 1, 0], // Am
  [x, 1, 3, 3, 2, 1], // A♯m / B♭m
  [x, 2, 4, 4, 3, 2], // Bm
];

/**
 * Diminished triads: root on the A string `[x, f, f+1, f+2, f+1, x]` or on the D string
 * `[x, x, f, f+1, f+3, f+1]`, whichever sits lower on the neck.
 */
export const diminishedShape = (pitchClass: number): GuitarVoicing => {
  const onA = mod12(pitchClass - 9);
  const onD = mod12(pitchClass - 2);
  return onA <= onD
    ? [x, onA, onA + 1, onA + 2, onA + 1, x]
    : [x, x, onD, onD + 1, onD + 3, onD + 1];
};

const shapeAt = (shapes: readonly GuitarVoicing[], pitchClass: number): GuitarVoicing => {
  const shape = shapes[mod12(pitchClass)];
  if (!shape) throw new Error(`No shape for pitch class ${pitchClass}`);
  return shape;
};

export const getGuitarVoicing = (chord: Chord): GuitarVoicing => {
  switch (chord.quality) {
    case 'major':
      return shapeAt(MAJOR_SHAPES, chord.pitchClass);
    case 'minor':
      return shapeAt(MINOR_SHAPES, chord.pitchClass);
    case 'diminished':
      return diminishedShape(chord.pitchClass);
  }
};

/** Pitches the voicing actually sounds, low to high, as MIDI note numbers. */
export const voicingMidiNotes = (voicing: GuitarVoicing): number[] =>
  voicing.flatMap((fret, string) =>
    fret === null ? [] : [(OPEN_STRING_MIDI[string] ?? 0) + fret],
  );

const frettedFrets = (voicing: GuitarVoicing): number[] =>
  voicing.filter((fret): fret is number => fret !== null && fret > 0);

export interface Barre {
  fret: number;
  /** Index of the lowest string the barre covers (0 = low E). */
  fromString: number;
  /** Index of the highest string the barre covers (always 5, high e). */
  toString: number;
}

/**
 * A barre is the lowest fretted note held by one finger across the strings: it must
 * reach the high e string, start on the low E or A string and cover at least two strings.
 */
export const detectBarre = (voicing: GuitarVoicing): Barre | null => {
  const fretted = frettedFrets(voicing);
  if (fretted.length === 0) return null;
  const lowest = Math.min(...fretted);
  const fromString = voicing.findIndex((fret) => fret === lowest);
  const coveredStrings = voicing.filter((fret) => fret === lowest).length;
  if (voicing[5] !== lowest || fromString > 1 || coveredStrings < 2) return null;
  return { fret: lowest, fromString, toString: 5 };
};

export interface DiagramWindow {
  /** The fret shown in the first row of the diagram. */
  startFret: number;
  /** True when the window starts at the nut (open position). */
  showNut: boolean;
}

/** Open-position chords show the nut; anything reaching above fret 4 starts at its lowest fret. */
export const diagramWindow = (voicing: GuitarVoicing): DiagramWindow => {
  const fretted = frettedFrets(voicing);
  const highest = fretted.length ? Math.max(...fretted) : 0;
  if (highest <= 4) return { startFret: 1, showNut: true };
  return { startFret: Math.min(...fretted), showNut: false };
};
