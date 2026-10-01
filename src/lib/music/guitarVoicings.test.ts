import { describe, expect, it } from 'vitest';
import {
  detectBarre,
  diagramWindow,
  diminishedShape,
  getGuitarVoicing,
  voicingMidiNotes,
} from './guitarVoicings';
import { KEYS, diatonicChords } from './keys';
import { mod12, parseChord } from './notes';
import { TRIAD_INTERVALS } from './spelling';

const voicingOf = (symbol: string) => getGuitarVoicing(parseChord(symbol));

describe('getGuitarVoicing', () => {
  it('returns the prototype shapes', () => {
    expect(voicingOf('C')).toEqual([null, 3, 2, 0, 1, 0]);
    expect(voicingOf('F')).toEqual([1, 3, 3, 2, 1, 1]);
    expect(voicingOf('Bbm')).toEqual([null, 1, 3, 3, 2, 1]);
    expect(voicingOf('Am')).toEqual([null, 0, 2, 2, 1, 0]);
  });

  it('uses the same shape for enharmonic roots', () => {
    expect(voicingOf('C#m')).toEqual(voicingOf('Dbm'));
    expect(voicingOf('Gb')).toEqual(voicingOf('F#'));
  });

  const allChords = [...new Set(KEYS.flatMap((key) => diatonicChords(key)))];

  it.each(allChords)('%s sounds exactly its chord tones', (symbol) => {
    const chord = parseChord(symbol);
    const expected = new Set(
      TRIAD_INTERVALS[chord.quality].map((i) => mod12(chord.pitchClass + i)),
    );
    const sounded = new Set(voicingMidiNotes(getGuitarVoicing(chord)).map(mod12));
    expect(sounded).toEqual(expected);
  });

  it('plays the root as the lowest note of major and minor shapes', () => {
    allChords
      .map(parseChord)
      .filter((chord) => chord.quality !== 'diminished')
      .forEach((chord) => {
        const [lowest] = voicingMidiNotes(getGuitarVoicing(chord));
        expect(mod12(lowest ?? -1)).toBe(chord.pitchClass);
      });
  });
});

describe('diminishedShape', () => {
  it('puts the root on the A string when that is lower', () => {
    expect(diminishedShape(11)).toEqual([null, 2, 3, 4, 3, null]); // B°
    expect(diminishedShape(0)).toEqual([null, 3, 4, 5, 4, null]); // C°
    expect(diminishedShape(9)).toEqual([null, 0, 1, 2, 1, null]); // A°
  });

  it('puts the root on the D string when that is lower', () => {
    expect(diminishedShape(4)).toEqual([null, null, 2, 3, 5, 3]); // E°
    expect(diminishedShape(5)).toEqual([null, null, 3, 4, 6, 4]); // E#° / F°
    expect(diminishedShape(2)).toEqual([null, null, 0, 1, 3, 1]); // D°
  });

  it('picks the lower of the two options for every root', () => {
    for (let pc = 0; pc < 12; pc++) {
      const shape = diminishedShape(pc);
      const lowestFret = Math.min(...shape.filter((f): f is number => f !== null));
      expect(lowestFret).toBe(Math.min(mod12(pc - 9), mod12(pc - 2)));
    }
  });
});

describe('detectBarre', () => {
  it('finds the full barre on F', () => {
    expect(detectBarre(voicingOf('F'))).toEqual({ fret: 1, fromString: 0, toString: 5 });
  });

  it('finds the A-string barre on B♭m', () => {
    expect(detectBarre(voicingOf('Bbm'))).toEqual({ fret: 1, fromString: 1, toString: 5 });
  });

  it('finds no barre on open C and A', () => {
    expect(detectBarre(voicingOf('C'))).toBeNull();
    expect(detectBarre(voicingOf('A'))).toBeNull();
  });

  it('finds no barre on diminished shapes or open G', () => {
    expect(detectBarre(voicingOf('B°'))).toBeNull();
    expect(detectBarre(voicingOf('G'))).toBeNull();
  });
});

describe('diagramWindow', () => {
  it('shows the nut for open-position chords', () => {
    expect(diagramWindow(voicingOf('C'))).toEqual({ startFret: 1, showNut: true });
    expect(diagramWindow(voicingOf('F'))).toEqual({ startFret: 1, showNut: true });
    expect(diagramWindow(voicingOf('Bb'))).toEqual({ startFret: 1, showNut: true });
  });

  it('starts at the lowest fretted note when the shape reaches above fret 4', () => {
    expect(diagramWindow(voicingOf('Db'))).toEqual({ startFret: 4, showNut: false });
    expect(diagramWindow(voicingOf('Cm'))).toEqual({ startFret: 3, showNut: false });
    expect(diagramWindow(voicingOf('Eb'))).toEqual({ startFret: 6, showNut: false });
    expect(diagramWindow(voicingOf('Ab'))).toEqual({ startFret: 4, showNut: false });
  });
});
