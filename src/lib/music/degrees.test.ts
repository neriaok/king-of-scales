import { describe, expect, it } from 'vitest';
import {
  DEGREES,
  DEGREE_IDS,
  PRESETS,
  findActivePreset,
  getDegree,
  getPreset,
  isDegreeId,
  matchesPreset,
  sortDegrees,
} from './degrees';

describe('DEGREES', () => {
  it('follows the major-scale formula', () => {
    expect(DEGREES.map((d) => d.semitones)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(DEGREES.map((d) => d.quality)).toEqual([
      'major',
      'minor',
      'minor',
      'major',
      'major',
      'minor',
      'diminished',
    ]);
  });

  it('labels each degree with its chord in C', () => {
    expect(DEGREES.map((d) => `${d.label} · ${d.inC}`)).toEqual([
      '1 · C',
      '2m · Dm',
      '3m · Em',
      '4 · F',
      '5 · G',
      '6m · Am',
      '7° · B°',
    ]);
  });

  it('has role names for 1, 4, 5 and 6m only', () => {
    expect(getDegree('1').role).toBe('בית');
    expect(getDegree('4').role).toBe('מתרחק');
    expect(getDegree('5').role).toBe('מתח · דומיננטה');
    expect(getDegree('6m').role).toBe('מינור מקביל');
    expect(DEGREES.filter((d) => d.role === null).map((d) => d.id)).toEqual(['2m', '3m', '7dim']);
  });

  it('validates degree ids', () => {
    expect(DEGREE_IDS.every(isDegreeId)).toBe(true);
    expect(isDegreeId('7°')).toBe(false);
    expect(isDegreeId(4)).toBe(false);
    expect(isDegreeId(null)).toBe(false);
  });
});

describe('sortDegrees', () => {
  it('puts any selection into degree order', () => {
    expect(sortDegrees(['5', '1', '4'])).toEqual(['1', '4', '5']);
    expect(sortDegrees(['7dim', '2m', '6m', '1'])).toEqual(['1', '2m', '6m', '7dim']);
  });

  it('drops duplicates and handles empty input', () => {
    expect(sortDegrees(['4', '4', '1'])).toEqual(['1', '4']);
    expect(sortDegrees([])).toEqual([]);
  });
});

describe('presets', () => {
  it('defines the five presets', () => {
    expect(PRESETS.map((p) => p.label)).toEqual([
      'הכל',
      '1 · 4 · 5',
      'מז׳ור',
      'מינור',
      'פופ 1·5·6·4',
    ]);
    expect(getPreset('all').degrees).toEqual(DEGREE_IDS);
    expect(getPreset('minor').degrees).toEqual(['2m', '3m', '6m']);
    expect(getPreset('pop').degrees).toEqual(['1', '5', '6m', '4']);
  });

  it('matches regardless of order', () => {
    expect(matchesPreset(['4', '6m', '1', '5'], getPreset('pop'))).toBe(true);
    expect(matchesPreset(['5', '4', '1'], getPreset('oneFourFive'))).toBe(true);
  });

  it('requires an exact match', () => {
    expect(matchesPreset(['1', '4'], getPreset('oneFourFive'))).toBe(false);
    expect(matchesPreset(['1', '4', '5', '6m'], getPreset('oneFourFive'))).toBe(false);
  });

  it('finds the active preset', () => {
    expect(findActivePreset(DEGREE_IDS)).toBe('all');
    expect(findActivePreset(['6m', '2m', '3m'])).toBe('minor');
    expect(findActivePreset(['1', '5', '6m', '4'])).toBe('pop');
    expect(findActivePreset(['1', '2m'])).toBeNull();
  });

  it('treats 1·4·5 and major as the same selection', () => {
    const selection = ['1', '4', '5'] as const;
    expect(matchesPreset(selection, getPreset('oneFourFive'))).toBe(true);
    expect(matchesPreset(selection, getPreset('major'))).toBe(true);
    expect(findActivePreset(selection)).toBe('oneFourFive');
  });
});
