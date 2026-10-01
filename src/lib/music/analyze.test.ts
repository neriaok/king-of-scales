import { describe, expect, it } from 'vitest';
import {
  analyzeProgression,
  formatDegreeNumbers,
  looksLikeChords,
  parseChordList,
  parseTypedChord,
} from './analyze';
import { DEGREE_IDS } from './degrees';
import { KEYS, diatonicChords } from './keys';

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
    expect(best('Em')).toMatchObject({ key: 'G', numbers: '6' });
    expect(best('B°')).toMatchObject({ key: 'C', numbers: '7' });
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

  it('reads minor-framed progressions in the relative major', () => {
    expect(best('Am Dm E Am')).toMatchObject({ key: 'C', numbers: '6-2-?-6' });
    expect(best('Em C D Em')).toMatchObject({ key: 'G', numbers: '6-4-5-6' });
  });

  it('keeps repeated chords in the numbers', () => {
    expect(best('C G Am F C')).toMatchObject({ key: 'C', numbers: '1-5-6-4-1' });
  });
});

describe('looksLikeChords', () => {
  it('tells chords from degree numbers', () => {
    expect(looksLikeChords('Am F C G')).toBe(true);
    expect(looksLikeChords('em')).toBe(true);
    expect(looksLikeChords('1-6-4-5')).toBe(false);
    expect(looksLikeChords('1 6m 4 7°')).toBe(false);
  });
});

describe('chords typed in any case (phone keyboards)', () => {
  it.each([
    ['AM', 'Am'],
    ['am', 'Am'],
    ['Am', 'Am'],
    ['F#M', 'F#m'],
    ['EBM', 'Ebm'],
    ['AB', 'Ab'],
    ['BB', 'Bb'],
    ['bb', 'Bb'],
    ['BDIM', 'B°'],
    ['AM7', 'Am'],
    ['CMAJ7', 'C'],
    ['CM7', 'Cm'],
    ['DbM7', 'Db'],
    ['Cmaj7', 'C'],
    ['G7', 'G'],
    ['DSUS4', 'D'],
  ])('reads %s as %s', (text, name) => {
    expect(parseTypedChord(text)?.name).toBe(name);
  });

  it('reads the user-reported C F G AM as 1-4-5-6', () => {
    expect(best('C F G AM')).toMatchObject({ key: 'C', numbers: '1-4-5-6' });
  });

  it.each(['upper', 'lower', 'as written'] as const)(
    'finds every key from its seven chords typed %s',
    (style) => {
      KEYS.forEach((key) => {
        const chords = diatonicChords(key).map((chord) =>
          style === 'upper'
            ? chord.replace('°', 'dim').toUpperCase()
            : style === 'lower'
              ? chord.replace('°', 'dim').toLowerCase()
              : chord,
        );
        const [first] = analyzeProgression(chordsOf(chords.join(' ')));
        expect(first?.key.name).toBe(key.name);
        expect(formatDegreeNumbers(first?.degrees ?? [])).toBe('1-2-3-4-5-6-7');
      });
    },
  );

  it('finds every chord of every key on its own', () => {
    KEYS.forEach((key) => {
      diatonicChords(key).forEach((chord, index) => {
        const typed = chord.replace('°', 'dim').toUpperCase();
        const fits = analyzeProgression(chordsOf(typed));
        const inKey = fits.find((analysis) => analysis.key.name === key.name);
        expect(inKey?.degrees).toEqual([DEGREE_IDS[index]]);
      });
    });
  });
});
