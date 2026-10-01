import { describe, expect, it } from 'vitest';
import type { UiState } from './uiSlice';
import reducer, {
  applyPreset,
  closeChord,
  initialUiState,
  selectActivePreset,
  selectChord,
  selectIsCustomOrder,
  selectMatchingPresets,
  selectVisibleDegrees,
  setDegreeSequence,
  setInstrument,
  setLanguage,
  toggleDegree,
} from './uiSlice';

const withUi = (ui: UiState) => ({ ui });
const reduce = (...actions: Parameters<typeof reducer>[1][]): UiState =>
  actions.reduce(reducer, initialUiState);

describe('uiSlice', () => {
  it('starts with all 7 degrees, guitar, Hebrew and no open chord', () => {
    expect(initialUiState).toEqual({
      selectedDegrees: ['1', '2m', '3m', '4', '5', '6m', '7dim'],
      instrument: 'guitar',
      language: 'he',
      selectedChord: null,
    });
  });

  describe('toggleDegree', () => {
    it('removes and re-adds a degree, keeping degree order', () => {
      const removed = reduce(toggleDegree('4'));
      expect(removed.selectedDegrees).toEqual(['1', '2m', '3m', '5', '6m', '7dim']);
      expect(reducer(removed, toggleDegree('4')).selectedDegrees).toEqual(
        initialUiState.selectedDegrees,
      );
    });

    it('never leaves the selection empty', () => {
      const single = reduce(applyPreset('minor'), toggleDegree('2m'), toggleDegree('3m'));
      expect(single.selectedDegrees).toEqual(['6m']);
      expect(reducer(single, toggleDegree('6m')).selectedDegrees).toEqual(['6m']);
    });
  });

  it('applies presets in degree order', () => {
    expect(reduce(applyPreset('pop')).selectedDegrees).toEqual(['1', '4', '5', '6m']);
    expect(reduce(applyPreset('oneFourFive')).selectedDegrees).toEqual(['1', '4', '5']);
  });

  describe('setDegreeSequence', () => {
    it('shows exactly the typed degrees in the typed order', () => {
      expect(reduce(setDegreeSequence(['6m', '4', '1', '5'])).selectedDegrees).toEqual([
        '6m',
        '4',
        '1',
        '5',
      ]);
    });

    it('drops repeats and ignores an empty sequence', () => {
      expect(reduce(setDegreeSequence(['1', '4', '1', '5'])).selectedDegrees).toEqual([
        '1',
        '4',
        '5',
      ]);
      expect(reduce(setDegreeSequence([])).selectedDegrees).toEqual(initialUiState.selectedDegrees);
    });

    it('closes the popover when its column is not in the sequence', () => {
      const open = selectChord({ symbol: 'F', keyName: 'C', degreeId: '4' });
      expect(reduce(open, setDegreeSequence(['1', '5'])).selectedChord).toBeNull();
      expect(reduce(open, setDegreeSequence(['4', '1'])).selectedChord).not.toBeNull();
    });

    it('returns to degree order when a chip is toggled', () => {
      expect(
        reduce(setDegreeSequence(['6m', '4', '1']), toggleDegree('5')).selectedDegrees,
      ).toEqual(['1', '4', '5', '6m']);
    });
  });

  it('sets the language', () => {
    expect(reduce(setLanguage('en')).language).toBe('en');
  });

  it('sets the instrument', () => {
    expect(reduce(setInstrument('piano')).instrument).toBe('piano');
  });

  describe('selected chord', () => {
    const fInC = selectChord({ symbol: 'F', keyName: 'C', degreeId: '4' });

    it('opens and closes', () => {
      const open = reduce(fInC);
      expect(open.selectedChord).toEqual({ symbol: 'F', keyName: 'C', degreeId: '4' });
      expect(reducer(open, closeChord()).selectedChord).toBeNull();
    });

    it('closes when its column is toggled off', () => {
      expect(reduce(fInC, toggleDegree('4')).selectedChord).toBeNull();
    });

    it('closes when a preset hides its column', () => {
      expect(reduce(fInC, applyPreset('minor')).selectedChord).toBeNull();
    });

    it('stays open when its column is still shown', () => {
      expect(reduce(fInC, applyPreset('pop')).selectedChord).not.toBeNull();
      expect(reduce(fInC, toggleDegree('2m')).selectedChord).not.toBeNull();
    });
  });

  describe('selectors', () => {
    it('selectVisibleDegrees keeps degree order after chips and presets', () => {
      expect(selectVisibleDegrees(withUi(reduce(applyPreset('pop'))))).toEqual([
        '1',
        '4',
        '5',
        '6m',
      ]);
      expect(selectVisibleDegrees(withUi(reduce(applyPreset('minor'), toggleDegree('1'))))).toEqual(
        ['1', '2m', '3m', '6m'],
      );
    });

    it('selectVisibleDegrees keeps the typed order of a sequence', () => {
      const state = reduce(setDegreeSequence(['6m', '4', '1', '5']));
      expect(selectVisibleDegrees(withUi(state))).toEqual(['6m', '4', '1', '5']);
      expect(selectIsCustomOrder(withUi(state))).toBe(true);
      expect(selectMatchingPresets(withUi(state))).toEqual([]);
      expect(selectActivePreset(withUi(state))).toBeNull();
    });

    it('treats a typed sequence already in degree order like a preset', () => {
      const state = reduce(setDegreeSequence(['1', '4', '5']));
      expect(selectIsCustomOrder(withUi(state))).toBe(false);
      expect(selectActivePreset(withUi(state))).toBe('oneFourFive');
    });

    it('selectActivePreset finds an exact match or null', () => {
      expect(selectActivePreset(withUi(initialUiState))).toBe('all');
      expect(selectActivePreset(withUi(reduce(applyPreset('minor'))))).toBe('minor');
      expect(selectActivePreset(withUi(reduce(toggleDegree('2m'))))).toBeNull();
    });

    it('selectMatchingPresets lists every matching preset', () => {
      expect(selectMatchingPresets(withUi(reduce(applyPreset('major'))))).toEqual([
        'oneFourFive',
        'major',
      ]);
    });
  });
});
