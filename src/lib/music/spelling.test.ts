import { describe, expect, it } from 'vitest';
import { KEYS, diatonicChords } from './keys';
import { LETTERS, LETTER_PITCH_CLASS, mod12, parseChord } from './notes';
import { TRIAD_INTERVALS, spellTriad } from './spelling';

const namesOf = (symbol: string): string[] => spellTriad(parseChord(symbol)).map((t) => t.name);

describe('spellTriad', () => {
  it.each([
    ['C', ['C', 'E', 'G']],
    ['Am', ['A', 'C', 'E']],
    ['B°', ['B', 'D', 'F']],
    ['E#°', ['E♯', 'G♯', 'B']],
    ['Ebm', ['E♭', 'G♭', 'B♭']],
    ['F#', ['F♯', 'A♯', 'C♯']],
    ['Gb', ['G♭', 'B♭', 'D♭']],
    ['C#°', ['C♯', 'E', 'G']],
    ['D#m', ['D♯', 'F♯', 'A♯']],
    ['Bbm', ['B♭', 'D♭', 'F']],
  ])('spells %s', (symbol, expected) => {
    expect(namesOf(symbol)).toEqual(expected);
  });

  it('supports double accidentals', () => {
    expect(namesOf('G#')).toEqual(['G♯', 'B♯', 'D♯']);
    expect(namesOf('D#')).toEqual(['D♯', 'F𝄪', 'A♯']);
    expect(namesOf('Fbm')).toEqual(['F♭', 'A𝄫', 'C♭']);
    expect(namesOf('Cb°')).toEqual(['C♭', 'E𝄫', 'G𝄫']);
  });

  it('labels chord tones with their degrees', () => {
    expect(spellTriad(parseChord('C')).map((t) => t.degree)).toEqual(['1', '3', '5']);
    expect(spellTriad(parseChord('Dm')).map((t) => t.degree)).toEqual(['1', '♭3', '5']);
    expect(spellTriad(parseChord('B°')).map((t) => t.degree)).toEqual(['1', '♭3', '♭5']);
  });

  describe('all 84 table chords', () => {
    const allChords = KEYS.flatMap((key) => diatonicChords(key));

    it('has 84 chords', () => {
      expect(allChords).toHaveLength(84);
    });

    it.each(allChords)(
      '%s skips one letter between tones and sounds the right pitches',
      (symbol) => {
        const chord = parseChord(symbol);
        const tones = spellTriad(chord);
        const rootIndex = LETTERS.indexOf(chord.letter);

        tones.forEach((tone, index) => {
          expect(tone.letter).toBe(LETTERS[(rootIndex + index * 2) % 7]);
          const sounded = mod12(LETTER_PITCH_CLASS[tone.letter] + tone.accidental);
          expect(sounded).toBe(
            mod12(chord.pitchClass + (TRIAD_INTERVALS[chord.quality][index] ?? 0)),
          );
        });
        // Table chords never need double accidentals.
        expect(tones.every((tone) => Math.abs(tone.accidental) <= 1)).toBe(true);
      },
    );
  });
});
