import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../../store/store';
import { STORAGE_KEY, loadPersistedUi, parsePersistedUi, savePersistedUi } from './persistence';
import { applyPreset, selectChord, setInstrument, toggleDegree } from './uiSlice';

const ALL = ['1', '2m', '3m', '4', '5', '6m', '7dim'];

const stored = (): unknown => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parsePersistedUi', () => {
  it('accepts a valid value and sorts the degrees', () => {
    expect(parsePersistedUi({ selectedDegrees: ['5', '1'], instrument: 'piano' })).toEqual({
      selectedDegrees: ['1', '5'],
      instrument: 'piano',
    });
  });

  it.each([null, undefined, 'x', 42, [], {}])('falls back to defaults for %j', (raw) => {
    expect(parsePersistedUi(raw)).toEqual({ selectedDegrees: ALL, instrument: 'guitar' });
  });

  it('falls back to all 7 degrees when the stored selection is empty or invalid', () => {
    expect(parsePersistedUi({ selectedDegrees: [] }).selectedDegrees).toEqual(ALL);
    expect(parsePersistedUi({ selectedDegrees: ['9', 'x'] }).selectedDegrees).toEqual(ALL);
    expect(parsePersistedUi({ selectedDegrees: '1,4,5' }).selectedDegrees).toEqual(ALL);
  });

  it('drops unknown degrees but keeps the valid ones', () => {
    expect(parsePersistedUi({ selectedDegrees: ['4', 'bogus', '1'] }).selectedDegrees).toEqual([
      '1',
      '4',
    ]);
  });

  it('falls back to guitar for an unknown instrument', () => {
    expect(parsePersistedUi({ selectedDegrees: ['1'], instrument: 'banjo' }).instrument).toBe(
      'guitar',
    );
  });
});

describe('load and save', () => {
  it('round-trips through localStorage', () => {
    savePersistedUi({ selectedDegrees: ['1', '4', '5'], instrument: 'piano' });
    expect(loadPersistedUi()).toEqual({ selectedDegrees: ['1', '4', '5'], instrument: 'piano' });
  });

  it('survives corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadPersistedUi()).toEqual({ selectedDegrees: ALL, instrument: 'guitar' });
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadPersistedUi()).toEqual({ selectedDegrees: ALL, instrument: 'guitar' });
    expect(() => savePersistedUi({ selectedDegrees: ['1'], instrument: 'guitar' })).not.toThrow();
  });
});

describe('store persistence middleware', () => {
  it('restores the saved selection and instrument on start', () => {
    savePersistedUi({ selectedDegrees: ['2m', '6m'], instrument: 'piano' });
    const { ui } = makeStore().getState();
    expect(ui.selectedDegrees).toEqual(['2m', '6m']);
    expect(ui.instrument).toBe('piano');
    expect(ui.selectedChord).toBeNull();
  });

  it('saves when the selection or instrument changes', () => {
    const store = makeStore();
    store.dispatch(applyPreset('oneFourFive'));
    expect(stored()).toEqual({ selectedDegrees: ['1', '4', '5'], instrument: 'guitar' });
    store.dispatch(toggleDegree('6m'));
    store.dispatch(setInstrument('piano'));
    expect(stored()).toEqual({ selectedDegrees: ['1', '4', '5', '6m'], instrument: 'piano' });
  });

  it('does not persist the open chord', () => {
    const store = makeStore();
    store.dispatch(selectChord({ symbol: 'C', keyName: 'C', degreeId: '1' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
