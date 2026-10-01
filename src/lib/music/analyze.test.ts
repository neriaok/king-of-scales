import { describe, expect, it } from 'vitest';
import {
  analyzeProgression,
  formatDegreeNumbers,
  parseChordList,
  parseTypedChord,
} from './analyze';

const chordsOf = (text: string) => {
  const result = parseChordList(text);
  if (!result.ok) throw new Error(`could not parse ${text}`);
  return result.chords;
};

const best = (text: string) => {
  const [first] = analyzeProgression(chordsOf(text));
  if (!first) throw new Error('no key');
  return { key: first.key.displayName, numbers: formatDegreeNumbers(first.degrees), first };
};

describe('parseTypedChord', () => {
  it.each([
    ['C', 0, 'major'],
    ['am', 9, 'minor'],
    ['F#m', 6, 'minor'],
    ['Bb', 10, 'major'],
    ['B°', 11, 'diminished'],
    ['Bdim', 11, 'diminished'],
    ['G7', 7, 'major'],
    ['Cmaj7', 0, 'major'],
    ['Am7', 9, 'minor'],
    ['Bm7b5', 11, 'diminished'],
    ['Dsus4', 2, 'major'],
    ['Ebm', 3, 'minor'],
    ['C/E', 0, 'major'],
  ])('reads %s', (text, pitchClass, quality) => {
    expect(parseTypedChord(text)).toMatchObject({ pitchClass, quality });
  });

  it.each(['H', 'X7', 'Caug', 'C+', '1', ''])('rejects %j', (text) => {
    expect(parseTypedChord(text)).toBeNull();
  });
});

describe('parseChordList', () => {
  it.each(['Am F C G', 'Am, F, C, G', 'Am - F - C - G', 'Am-F-C-G', 'Am | F | C | G'])(
    'splits %j',
    (text) => {
      expect(chordsOf(text).map((c) => c.text)).toEqual(['Am', 'F', 'C', 'G']);
    },
  );

  it('reports what it cannot read', () => {
    expect(parseChordList('Am X F Hm')).toEqual({
      ok: false,
      error: 'invalid',
      invalid: ['X', 'Hm'],
    });
    expect(parseChordList('  ')).toEqual({ ok: false, error: 'empty', invalid: [] });
  });
});

describe('analyzeProgression', () => {
  it('converts a single chord to its number', () => {
    expect(best('C')).toMatchObject({ key: 'C', numbers: '1' });
    expect(analyzeProgression(chordsOf('Em')).map((a) => a.key.displayName)).toEqual(
      expect.arrayContaining(['G', 'C', 'D']),
    );
  });

  it('finds the key of common progressions', () => {
    expect(best('Am F C G')).toMatchObject({ key: 'C', numbers: '6-4-1-5' });
    expect(best('G D Em C')).toMatchObject({ key: 'G', numbers: '1-5-6-4' });
    expect(best('Dm7 G7 Cmaj7')).toMatchObject({ key: 'C', numbers: '2-5-1' });
    expect(best('E A B')).toMatchObject({ key: 'E', numbers: '1-4-5' });
    expect(best('D A Bm G')).toMatchObject({ key: 'D', numbers: '1-5-6-4' });
  });

  it('prefers the key whose tonic starts or ends the progression', () => {
    expect(best('C F G')).toMatchObject({ key: 'C', numbers: '1-4-5' });
    expect(best('F G C')).toMatchObject({ key: 'C', numbers: '4-5-1' });
  });

  it('spells the chords the way the key does', () => {
    // Enharmonic input is matched by pitch: G♭ D♭ E♭m C♭ is the key of F♯.
    expect(best('Gb Db Ebm Cb').first.spelled).toEqual(['F#', 'C#', 'D#m', 'B']);
    expect(best('F# C# D#m B')).toMatchObject({ key: 'F♯', numbers: '1-5-6-4' });
  });

  it('marks chords outside the key with ?', () => {
    const { key, numbers, first } = best('C F G Bb');
    expect(key).toBe('C');
    expect(first.matched).toBe(3);
    expect(numbers).toBe('1-4-5-?');
  });

  it('keeps repeated chords in the numbers', () => {
    expect(best('C G Am F C')).toMatchObject({ key: 'C', numbers: '1-5-6-4-1' });
  });
});
