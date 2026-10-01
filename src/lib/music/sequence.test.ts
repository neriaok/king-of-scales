import { describe, expect, it } from 'vitest';
import { SEQUENCE_SUGGESTIONS, formatDegreeSequence, parseDegreeSequence } from './sequence';

describe('parseDegreeSequence', () => {
  it.each(['1-4-5', '1 4 5', '145', '1,4,5', '1 · 4 · 5', ' 1 - 4 - 5 ', '1/4/5'])(
    'reads %j as 1, 4, 5',
    (text) => {
      expect(parseDegreeSequence(text)).toEqual({
        ok: true,
        degrees: ['1', '4', '5'],
        hadDuplicates: false,
      });
    },
  );

  it('keeps the order typed', () => {
    expect(parseDegreeSequence('6-4-1-5')).toMatchObject({ degrees: ['6m', '4', '1', '5'] });
    expect(parseDegreeSequence('2 5 1')).toMatchObject({ degrees: ['2m', '5', '1'] });
  });

  it('fills in minor and diminished from the scale', () => {
    expect(parseDegreeSequence('2 3 6 7')).toMatchObject({ degrees: ['2m', '3m', '6m', '7dim'] });
  });

  it('accepts typed quality marks', () => {
    expect(parseDegreeSequence('1 6m 4 7°')).toMatchObject({ degrees: ['1', '6m', '4', '7dim'] });
  });

  it('keeps repeated degrees once and reports it', () => {
    expect(parseDegreeSequence('1-4-1-5')).toEqual({
      ok: true,
      degrees: ['1', '4', '5'],
      hadDuplicates: true,
    });
  });

  it('rejects digits outside 1–7 and other characters', () => {
    expect(parseDegreeSequence('1 8 9 0')).toEqual({
      ok: false,
      error: 'invalid',
      invalid: ['8', '9', '0'],
    });
    expect(parseDegreeSequence('1 x 4')).toEqual({ ok: false, error: 'invalid', invalid: ['x'] });
  });

  it('rejects empty input', () => {
    expect(parseDegreeSequence('')).toEqual({ ok: false, error: 'empty', invalid: [] });
    expect(parseDegreeSequence(' - - ')).toEqual({ ok: false, error: 'empty', invalid: [] });
  });
});

describe('formatDegreeSequence', () => {
  it('writes degrees as digits', () => {
    expect(formatDegreeSequence(['6m', '4', '1', '5'])).toBe('6-4-1-5');
    expect(formatDegreeSequence(['7dim'])).toBe('7');
  });
});

describe('SEQUENCE_SUGGESTIONS', () => {
  it('offers common progressions in playing order', () => {
    expect(SEQUENCE_SUGGESTIONS.map((s) => formatDegreeSequence(s.degrees))).toEqual([
      '1-2-3-4-5-6-7',
      '1-5-6-4',
      '1-6-4-5',
      '6-4-1-5',
      '2-5-1',
      '1-4-5',
    ]);
  });

  it('round-trips through the parser', () => {
    SEQUENCE_SUGGESTIONS.forEach((suggestion) =>
      expect(parseDegreeSequence(formatDegreeSequence(suggestion.degrees))).toMatchObject({
        ok: true,
        degrees: suggestion.degrees,
      }),
    );
  });
});
