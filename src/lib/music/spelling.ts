import type { Accidental, Chord, ChordQuality, Letter } from './notes';
import { accidentalFor, formatNote, letterAbove, mod12 } from './notes';

/** Semitones above the root for root, third and fifth. */
export const TRIAD_INTERVALS: Readonly<Record<ChordQuality, readonly [number, number, number]>> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
};

/** Degree labels shown next to each chord tone. */
export const TRIAD_DEGREE_LABELS: Readonly<
  Record<ChordQuality, readonly [string, string, string]>
> = {
  major: ['1', '3', '5'],
  minor: ['1', '♭3', '5'],
  diminished: ['1', '♭3', '♭5'],
};

export interface ChordTone {
  letter: Letter;
  accidental: Accidental;
  pitchClass: number;
  /** Display name, e.g. `E♯`. */
  name: string;
  /** Degree label, e.g. `♭3`. */
  degree: string;
}

/**
 * Spells a triad letter-correctly: the third sits two letters above the root and the
 * fifth four letters above, whatever accidentals that requires (E♯° → E♯ G♯ B).
 */
export const spellTriad = (chord: Chord): ChordTone[] => {
  const intervals = TRIAD_INTERVALS[chord.quality];
  const labels = TRIAD_DEGREE_LABELS[chord.quality];
  return intervals.map((interval, index) => {
    const letter = letterAbove(chord.letter, index * 2);
    const pitchClass = mod12(chord.pitchClass + interval);
    const accidental = accidentalFor(letter, pitchClass);
    return {
      letter,
      accidental,
      pitchClass,
      name: formatNote(letter, accidental),
      degree: labels[index] ?? '',
    };
  });
};
