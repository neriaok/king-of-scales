import { describe, expect, it } from 'vitest';
import { DEGREE_IDS } from './degrees';
import { KEYS, buildTable, diatonicChords } from './keys';

/** The full table from the reference prototype (chord-map-reference.html, `FULL`). */
const PROTOTYPE_TABLE = [
  ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°'],
  ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'C°'],
  ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#°'],
  ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'D°'],
  ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#°'],
  ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'E°'],
  ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#°'],
  ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#°'],
  ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'G°'],
  ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#°'],
  ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'A°'],
  ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#°'],
];

const symbolsOf = (row: { cells: { chord: string }[] }): string[] =>
  row.cells.map((cell) => cell.chord);

describe('KEYS', () => {
  it('has 12 keys a half step apart from C, with conventional spellings', () => {
    expect(KEYS.map((k) => k.displayName)).toEqual([
      'C',
      'D♭',
      'D',
      'E♭',
      'E',
      'F',
      'F♯',
      'G',
      'A♭',
      'A',
      'B♭',
      'B',
    ]);
    expect(KEYS.map((k) => k.pitchClass)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('marks the open-chord keys', () => {
    expect(KEYS.filter((k) => k.isEasy).map((k) => k.name)).toEqual(['C', 'D', 'E', 'G', 'A']);
  });

  it('gives the capo fret for C shapes', () => {
    expect(KEYS.map((k) => k.capoFromC)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe('diatonicChords', () => {
  it('matches the prototype table exactly', () => {
    expect(KEYS.map((key) => diatonicChords(key))).toEqual(PROTOTYPE_TABLE);
  });

  it('spells the vii° of F♯ as E♯°', () => {
    const fSharp = KEYS.find((k) => k.name === 'F#');
    expect(fSharp && diatonicChords(fSharp)[6]).toBe('E#°');
  });
});

describe('buildTable', () => {
  it('returns the full prototype table when all degrees are selected', () => {
    expect(buildTable(DEGREE_IDS).map(symbolsOf)).toEqual(PROTOTYPE_TABLE);
  });

  it('builds exactly the selected columns for C, F, G (1, 4, 5)', () => {
    const table = buildTable(['1', '4', '5']);
    expect(table).toHaveLength(12);
    expect(table.every((row) => row.cells.length === 3)).toBe(true);
    expect(symbolsOf(table[0] ?? { cells: [] })).toEqual(['C', 'F', 'G']);
    expect(symbolsOf(table[1] ?? { cells: [] })).toEqual(['Db', 'Gb', 'Ab']);
    expect(symbolsOf(table.find((r) => r.key.name === 'D') ?? { cells: [] })).toEqual([
      'D',
      'G',
      'A',
    ]);
    expect(symbolsOf(table.find((r) => r.key.name === 'Bb') ?? { cells: [] })).toEqual([
      'Bb',
      'Eb',
      'F',
    ]);
    expect(symbolsOf(table[11] ?? { cells: [] })).toEqual(['B', 'E', 'F#']);
  });

  it('keeps degree order whatever order the degrees were selected in', () => {
    const table = buildTable(['6m', '4', '1', '5']);
    expect(table[0]?.cells.map((c) => c.degreeId)).toEqual(['1', '4', '5', '6m']);
    expect(symbolsOf(table[0] ?? { cells: [] })).toEqual(['C', 'F', 'G', 'Am']);
  });

  it('tags each cell with its degree', () => {
    const [first] = buildTable(['2m', '7dim']);
    expect(first?.cells).toEqual([
      { degreeId: '2m', chord: 'Dm' },
      { degreeId: '7dim', chord: 'B°' },
    ]);
  });
});
