import { describe, expect, it } from 'vitest';
import type { UiState } from './uiSlice';
import reducer, {
  applyPreset,
  closeChord,
  initialUiState,
  selectActivePreset,
  selectChord,
  selectMatchingPresets,
  selectVisibleDegrees,
  setInstrument,
  toggleDegree,
} from './uiSlice';

const withUi = (ui: UiState) => ({ ui });
const reduce = (...actions: Parameters<typeof reducer>[1][]): UiState =>
  actions.reduce(reducer, initialUiState);

describe('uiSlice', () => {
  it('starts with all 7 degrees, guitar and no open chord', () => {
    expect(initialUiState).toEqual({
      selectedDegrees: ['1', '2m', '3m', '4', '5', '6m', '7dim'],
      instrument: 'guitar',
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
    it('selectVisibleDegrees sorts the selection', () => {
      const state = {
        ...initialUiState,
        selectedDegrees: ['5', '1', '4'] as UiState['selectedDegrees'],
      };
      expect(selectVisibleDegrees(withUi(state))).toEqual(['1', '4', '5']);
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
