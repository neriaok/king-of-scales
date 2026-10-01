import { describe, expect, it } from 'vitest';
import {
  accidentalFor,
  chordSymbol,
  formatChord,
  formatNote,
  letterAbove,
  mod12,
  parseChord,
} from './notes';

describe('parseChord', () => {
  it.each([
    ['C', { letter: 'C', accidental: 0, pitchClass: 0, quality: 'major' }],
    ['F#m', { letter: 'F', accidental: 1, pitchClass: 6, quality: 'minor' }],
    ['Bb', { letter: 'B', accidental: -1, pitchClass: 10, quality: 'major' }],
    ['E#°', { letter: 'E', accidental: 1, pitchClass: 5, quality: 'diminished' }],
    ['Ebm', { letter: 'E', accidental: -1, pitchClass: 3, quality: 'minor' }],
    ['Cb', { letter: 'C', accidental: -1, pitchClass: 11, quality: 'major' }],
    ['B#', { letter: 'B', accidental: 1, pitchClass: 0, quality: 'major' }],
    ['F##', { letter: 'F', accidental: 2, pitchClass: 7, quality: 'major' }],
    ['Dbb', { letter: 'D', accidental: -2, pitchClass: 0, quality: 'major' }],
    ['Bdim', { letter: 'B', accidental: 0, pitchClass: 11, quality: 'diminished' }],
    ['F♯m', { letter: 'F', accidental: 1, pitchClass: 6, quality: 'minor' }],
  ])('parses %s', (symbol, expected) => {
    expect(parseChord(symbol)).toEqual({ symbol, ...expected });
  });

  it.each(['', 'H', 'c', 'C#maj7', 'Cm7', 'C###'])('rejects %j', (symbol) => {
    expect(() => parseChord(symbol)).toThrow(/Invalid chord symbol/);
  });
});

describe('formatChord', () => {
  it.each([
    ['C', 'C'],
    ['F#m', 'F♯m'],
    ['Bb', 'B♭'],
    ['Ebm', 'E♭m'],
    ['E#°', 'E♯°'],
    ['bb', 'bb'],
    ['Bbb', 'B𝄫'],
    ['F##', 'F𝄪'],
  ])('formats %s as %s', (symbol, expected) => {
    expect(formatChord(symbol)).toBe(expected);
  });
});

describe('helpers', () => {
  it('wraps values into 0–11', () => {
    expect(mod12(-1)).toBe(11);
    expect(mod12(12)).toBe(0);
    expect(mod12(25)).toBe(1);
  });

  it('builds chord symbols', () => {
    expect(chordSymbol('F', 1, 'minor')).toBe('F#m');
    expect(chordSymbol('E', 1, 'diminished')).toBe('E#°');
    expect(chordSymbol('B', -1, 'major')).toBe('Bb');
  });

  it('formats single notes', () => {
    expect(formatNote('E', 1)).toBe('E♯');
    expect(formatNote('B', -2)).toBe('B𝄫');
    expect(formatNote('G', 0)).toBe('G');
  });

  it('finds the accidental for a letter and pitch class', () => {
    expect(accidentalFor('E', 5)).toBe(1);
    expect(accidentalFor('C', 11)).toBe(-1);
    expect(accidentalFor('F', 7)).toBe(2);
    expect(() => accidentalFor('C', 6)).toThrow();
  });

  it('walks letters', () => {
    expect(letterAbove('C', 2)).toBe('E');
    expect(letterAbove('A', 2)).toBe('C');
    expect(letterAbove('B', 4)).toBe('F');
  });
});
