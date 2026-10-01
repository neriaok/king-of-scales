import { describe, expect, it } from 'vitest';
import { DEGREES } from '../lib/music/degrees';
import { SEQUENCE_SUGGESTIONS } from '../lib/music/sequence';
import type { Messages } from './messages';
import { LANGUAGES, LANGUAGE_DIR, MESSAGES, isLanguage } from './messages';

const stringLeaves = (messages: Messages): string[] =>
  Object.values(messages).flatMap((value: unknown) => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'function') return [String((value as (arg: string) => string)('C'))];
    return Object.values(value as Record<string, unknown>).flatMap((inner) => {
      if (typeof inner === 'string') return [inner];
      if (typeof inner === 'function') return [String((inner as (arg: string) => string)('C'))];
      return Object.values(inner as Record<string, string>);
    });
  });

describe('messages', () => {
  it('supports Hebrew (RTL) and English (LTR)', () => {
    expect(LANGUAGES).toEqual(['he', 'en']);
    expect(LANGUAGE_DIR).toEqual({ he: 'rtl', en: 'ltr' });
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('fr')).toBe(false);
  });

  it.each(LANGUAGES)('%s has no empty strings', (language) => {
    expect(stringLeaves(MESSAGES[language]).every((text) => text.trim().length > 0)).toBe(true);
  });

  it.each(LANGUAGES)('%s labels every suggestion and every role', (language) => {
    const messages = MESSAGES[language];
    SEQUENCE_SUGGESTIONS.forEach((suggestion) =>
      expect(messages.sequence.suggestions[suggestion.id]).toBeTruthy(),
    );
    DEGREES.filter((degree) => degree.role).forEach((degree) =>
      expect(messages.roles[degree.id]).toBeTruthy(),
    );
  });

  it('keeps the Hebrew role names from the music model', () => {
    expect(MESSAGES.he.roles).toEqual({
      '1': 'בית',
      '4': 'מתרחק',
      '5': 'מתח · דומיננטה',
      '6m': 'מינור מקביל',
    });
  });

  it('builds column subtitles', () => {
    expect(MESSAGES.he.likeChord('F')).toBe('כמו F');
    expect(MESSAGES.en.likeChord('F')).toBe('like F');
  });
});
