/**
 * Turns a chord progression (e.g. `Am F C G`) into scale-degree numbers by finding the major
 * keys that contain its chords. Pure and framework-free.
 */
import type { DegreeId } from './degrees';
import { DEGREES, DEGREE_IDS } from './degrees';
import type { MusicalKey } from './keys';
import { KEYS, diatonicChord } from './keys';
import type { ChordQuality, Letter } from './notes';
import { LETTER_PITCH_CLASS, isLetter, mod12 } from './notes';

export interface TypedChord {
  /** The chord as the user typed it. */
  text: string;
  pitchClass: number;
  quality: ChordQuality;
}

const ROOT = /^([A-Ga-g])(##|bb|#|b|♯|♭)?(.*)$/u;
const ACCIDENTALS: Readonly<Record<string, number>> = {
  '': 0,
  '#': 1,
  '♯': 1,
  '##': 2,
  b: -1,
  '♭': -1,
  bb: -2,
};

/**
 * Reads the triad quality from whatever follows the root, ignoring extensions:
 * `m`, `m7`, `min` → minor; `dim`, `°`, `m7b5`, `ø` → diminished; anything else
 * (``, `7`, `maj7`, `sus4`, `add9`, `6`) → major.
 */
const qualityOf = (suffix: string): ChordQuality | null => {
  const rest = suffix.trim();
  if (/^(dim|°|o|ø|m7b5|m7♭5|min7b5)/iu.test(rest)) return 'diminished';
  if (/^maj|^M(?!in)|^Δ/u.test(rest)) return 'major';
  if (/^(m|min)(?!aj)/u.test(rest)) return 'minor';
  if (/^(aug|\+)/iu.test(rest)) return null;
  if (rest === '' || /^(7|6|9|11|13|sus|add|\/|\()/iu.test(rest)) return 'major';
  return null;
};

/** Parses one chord symbol, leniently. Returns null if it isn't a recognisable chord. */
export const parseTypedChord = (text: string): TypedChord | null => {
  const match = ROOT.exec(text.trim());
  const letterText = match?.[1]?.toUpperCase();
  if (!match || letterText === undefined || !isLetter(letterText)) return null;
  const accidental = ACCIDENTALS[match[2] ?? ''];
  const quality = qualityOf(match[3] ?? '');
  if (accidental === undefined || quality === null) return null;
  return {
    text: text.trim(),
    pitchClass: mod12(LETTER_PITCH_CLASS[letterText as Letter] + accidental),
    quality,
  };
};

export type ChordListResult =
  { ok: true; chords: TypedChord[] } | { ok: false; error: 'empty' | 'invalid'; invalid: string[] };

/** Splits a progression on spaces, commas, dashes and bar lines and parses every chord. */
export const parseChordList = (text: string): ChordListResult => {
  const tokens = text.split(/[\s,|–—-]+/u).filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: 'empty', invalid: [] };
  const chords: TypedChord[] = [];
  const invalid: string[] = [];
  tokens.forEach((token) => {
    const chord = parseTypedChord(token);
    if (chord) chords.push(chord);
    else invalid.push(token);
  });
  return invalid.length > 0 ? { ok: false, error: 'invalid', invalid } : { ok: true, chords };
};

/** The degree a chord has in a key, or null when it is not diatonic there. */
export const degreeInKey = (chord: TypedChord, key: MusicalKey): DegreeId | null => {
  const degree = DEGREES.find(
    (candidate) =>
      candidate.quality === chord.quality &&
      mod12(key.pitchClass + candidate.semitones) === chord.pitchClass,
  );
  return degree?.id ?? null;
};

export interface KeyAnalysis {
  key: MusicalKey;
  /** One entry per typed chord, in order; null where the chord is outside the key. */
  degrees: (DegreeId | null)[];
  /** The chords spelled as this key spells them, e.g. `F#m`. */
  spelled: (string | null)[];
  matched: number;
}

/**
 * Ranks the 12 major keys by how many of the chords they contain. Ties go to the key whose
 * tonic (degree 1) starts or ends the progression, then to the key where a minor chord that
 * starts or ends it is the relative minor (6m), then to the key whose tonic appears most.
 */
export const analyzeProgression = (chords: readonly TypedChord[]): KeyAnalysis[] => {
  const score = (analysis: KeyAnalysis): number => {
    const tonicCount = analysis.degrees.filter((id) => id === '1').length;
    const first = analysis.degrees[0];
    const last = analysis.degrees.at(-1);
    const startsOrEnds = (first === '1' ? 1 : 0) + (last === '1' ? 1 : 0);
    // A progression framed by a minor chord is usually in its relative major (as 6m).
    const relativeMinor = (first === '6m' ? 1 : 0) + (last === '6m' ? 1 : 0);
    return analysis.matched * 100 + startsOrEnds * 10 + relativeMinor * 5 + tonicCount;
  };

  return KEYS.map((key) => {
    const degrees = chords.map((chord) => degreeInKey(chord, key));
    return {
      key,
      degrees,
      spelled: degrees.map((id) => {
        const degree = id ? DEGREES.find((candidate) => candidate.id === id) : undefined;
        return degree ? diatonicChord(key, degree) : null;
      }),
      matched: degrees.filter((id) => id !== null).length,
    };
  })
    .filter((analysis) => analysis.matched > 0)
    .sort((a, b) => score(b) - score(a));
};

/** Degree numbers as digits, with `?` for chords outside the key, e.g. `6-4-1-5`. */
export const formatDegreeNumbers = (degrees: readonly (DegreeId | null)[]): string =>
  degrees.map((id) => (id ? String(DEGREE_IDS.indexOf(id) + 1) : '?')).join('-');

/** True when the text contains chord letters (A–G) rather than only degree numbers. */
export const looksLikeChords = (text: string): boolean => /[A-Ga-g]/u.test(text);
