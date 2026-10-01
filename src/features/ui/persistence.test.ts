import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../../store/store';
import { STORAGE_KEY, loadPersistedUi, parsePersistedUi, savePersistedUi } from './persistence';
import {
  applyPreset,
  selectChord,
  setDegreeSequence,
  setInstrument,
  setLanguage,
  toggleDegree,
} from './uiSlice';

const ALL = ['1', '2m', '3m', '4', '5', '6m', '7dim'];

const stored = (): unknown => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parsePersistedUi', () => {
  it('accepts a valid value and keeps the stored column order', () => {
    expect(
      parsePersistedUi({ selectedDegrees: ['5', '1'], instrument: 'piano', language: 'en' }),
    ).toEqual({
      selectedDegrees: ['5', '1'],
      instrument: 'piano',
      language: 'en',
    });
  });

  it.each([null, undefined, 'x', 42, [], {}])('falls back to defaults for %j', (raw) => {
    expect(parsePersistedUi(raw)).toEqual({
      selectedDegrees: ALL,
      instrument: 'guitar',
      language: 'he',
    });
  });

  it('falls back to all 7 degrees when the stored selection is empty or invalid', () => {
    expect(parsePersistedUi({ selectedDegrees: [] }).selectedDegrees).toEqual(ALL);
    expect(parsePersistedUi({ selectedDegrees: ['9', 'x'] }).selectedDegrees).toEqual(ALL);
    expect(parsePersistedUi({ selectedDegrees: '1,4,5' }).selectedDegrees).toEqual(ALL);
  });

  it('drops unknown and repeated degrees but keeps the valid ones in order', () => {
    expect(parsePersistedUi({ selectedDegrees: ['4', 'bogus', '1', '4'] }).selectedDegrees).toEqual(
      ['4', '1'],
    );
  });

  it('falls back to Hebrew for an unknown language', () => {
    expect(parsePersistedUi({ selectedDegrees: ['1'], language: 'fr' }).language).toBe('he');
  });

  it('falls back to guitar for an unknown instrument', () => {
    expect(parsePersistedUi({ selectedDegrees: ['1'], instrument: 'banjo' }).instrument).toBe(
      'guitar',
    );
  });
});

describe('load and save', () => {
  it('round-trips through localStorage', () => {
    savePersistedUi({ selectedDegrees: ['1', '4', '5'], instrument: 'piano', language: 'en' });
    expect(loadPersistedUi()).toEqual({
      selectedDegrees: ['1', '4', '5'],
      instrument: 'piano',
      language: 'en',
    });
  });

  it('survives corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadPersistedUi()).toEqual({
      selectedDegrees: ALL,
      instrument: 'guitar',
      language: 'he',
    });
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadPersistedUi()).toEqual({
      selectedDegrees: ALL,
      instrument: 'guitar',
      language: 'he',
    });
    expect(() =>
      savePersistedUi({ selectedDegrees: ['1'], instrument: 'guitar', language: 'he' }),
    ).not.toThrow();
  });
});

describe('store persistence middleware', () => {
  it('restores the saved selection and instrument on start', () => {
    savePersistedUi({ selectedDegrees: ['2m', '6m'], instrument: 'piano', language: 'en' });
    const { ui } = makeStore().getState();
    expect(ui.selectedDegrees).toEqual(['2m', '6m']);
    expect(ui.instrument).toBe('piano');
    expect(ui.language).toBe('en');
    expect(ui.selectedChord).toBeNull();
  });

  it('saves when the selection or instrument changes', () => {
    const store = makeStore();
    store.dispatch(applyPreset('oneFourFive'));
    expect(stored()).toEqual({
      selectedDegrees: ['1', '4', '5'],
      instrument: 'guitar',
      language: 'he',
    });
    store.dispatch(toggleDegree('6m'));
    store.dispatch(setInstrument('piano'));
    store.dispatch(setLanguage('en'));
    expect(stored()).toEqual({
      selectedDegrees: ['1', '4', '5', '6m'],
      instrument: 'piano',
      language: 'en',
    });
  });

  it('saves a typed sequence in its order', () => {
    const store = makeStore();
    store.dispatch(setDegreeSequence(['6m', '4', '1', '5']));
    expect(stored()).toMatchObject({ selectedDegrees: ['6m', '4', '1', '5'] });
    expect(makeStore().getState().ui.selectedDegrees).toEqual(['6m', '4', '1', '5']);
  });

  it('does not persist the open chord', () => {
    const store = makeStore();
    store.dispatch(selectChord({ symbol: 'C', keyName: 'C', degreeId: '1' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
