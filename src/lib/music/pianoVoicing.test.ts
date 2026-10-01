import { describe, expect, it } from 'vitest';
import { parseChord } from './notes';
import { pianoMidiNotes, pianoVoicing } from './pianoVoicing';

describe('pianoVoicing', () => {
  it.each([
    ['C', [0, 4, 7]],
    ['Am', [9, 12, 16]],
    ['B°', [11, 14, 17]],
    ['F#', [6, 10, 13]],
    ['Ebm', [3, 6, 10]],
  ])('%s → %j', (symbol, expected) => {
    expect(pianoVoicing(parseChord(symbol))).toEqual(expected);
  });

  it('always fits the two-octave diagram', () => {
    expect(pianoVoicing(parseChord('B')).every((s) => s >= 0 && s < 24)).toBe(true);
  });
});

describe('pianoMidiNotes', () => {
  it('plays the triad around C4 with the root an octave lower', () => {
    expect(pianoMidiNotes(parseChord('C'))).toEqual([48, 60, 64, 67]);
    expect(pianoMidiNotes(parseChord('Am'))).toEqual([57, 69, 72, 76]);
  });
});
