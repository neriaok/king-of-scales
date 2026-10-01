import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { DegreeId, PresetId } from '../../lib/music/degrees';
import type { Language } from '../../i18n/messages';
import {
  DEGREE_IDS,
  PRESETS,
  findActivePreset,
  getPreset,
  matchesPreset,
  sortDegrees,
} from '../../lib/music/degrees';

export type Instrument = 'guitar' | 'piano';

export const INSTRUMENTS: readonly Instrument[] = ['guitar', 'piano'];

export const isInstrument = (value: unknown): value is Instrument =>
  typeof value === 'string' && (INSTRUMENTS as readonly string[]).includes(value);

/** The chord whose popover is open, identified by its table cell. */
export interface SelectedChord {
  /** ASCII chord symbol, e.g. `F#m`. */
  symbol: string;
  /** ASCII key name of the row, e.g. `D`. */
  keyName: string;
  /** Column the chord sits in. */
  degreeId: DegreeId;
}

export interface UiState {
  selectedDegrees: DegreeId[];
  instrument: Instrument;
  language: Language;
  selectedChord: SelectedChord | null;
}

export const initialUiState: UiState = {
  selectedDegrees: [...DEGREE_IDS],
  instrument: 'guitar',
  language: 'he',
  selectedChord: null,
};

/** Closes the popover when the open chord's column is no longer shown. */
const closeChordIfHidden = (state: UiState): void => {
  if (state.selectedChord && !state.selectedDegrees.includes(state.selectedChord.degreeId)) {
    state.selectedChord = null;
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUiState,
  reducers: {
    /**
     * Adds or removes a column, putting the columns back in degree order. Ignored when it
     * would leave no column selected.
     */
    toggleDegree: (state, action: PayloadAction<DegreeId>) => {
      const id = action.payload;
      const isSelected = state.selectedDegrees.includes(id);
      if (isSelected && state.selectedDegrees.length === 1) return;
      state.selectedDegrees = sortDegrees(
        isSelected
          ? state.selectedDegrees.filter((selected) => selected !== id)
          : [...state.selectedDegrees, id],
      );
      closeChordIfHidden(state);
    },
    applyPreset: (state, action: PayloadAction<PresetId>) => {
      state.selectedDegrees = sortDegrees(getPreset(action.payload).degrees);
      closeChordIfHidden(state);
    },
    /** Shows exactly these degrees, in this order (a typed sequence). Ignored when empty. */
    setDegreeSequence: (state, action: PayloadAction<DegreeId[]>) => {
      const sequence = [...new Set(action.payload)];
      if (sequence.length === 0) return;
      state.selectedDegrees = sequence;
      closeChordIfHidden(state);
    },
    setInstrument: (state, action: PayloadAction<Instrument>) => {
      state.instrument = action.payload;
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    selectChord: (state, action: PayloadAction<SelectedChord>) => {
      state.selectedChord = action.payload;
    },
    closeChord: (state) => {
      state.selectedChord = null;
    },
  },
});

export const {
  toggleDegree,
  applyPreset,
  setDegreeSequence,
  setInstrument,
  setLanguage,
  selectChord,
  closeChord,
} = uiSlice.actions;

export default uiSlice.reducer;

interface StateWithUi {
  ui: UiState;
}

export const selectSelectedDegrees = (state: StateWithUi): DegreeId[] => state.ui.selectedDegrees;
export const selectInstrument = (state: StateWithUi): Instrument => state.ui.instrument;
export const selectLanguage = (state: StateWithUi): Language => state.ui.language;
export const selectSelectedChord = (state: StateWithUi): SelectedChord | null =>
  state.ui.selectedChord;

/**
 * The columns to show, in display order: degree order (1 → 7°) after chips or presets, or
 * the typed order after a custom sequence.
 */
export const selectVisibleDegrees = createSelector([selectSelectedDegrees], (degrees) => [
  ...new Set(degrees),
]);

/** True when the columns follow a typed sequence rather than degree order. */
export const selectIsCustomOrder = createSelector([selectSelectedDegrees], (degrees) => {
  const sorted = sortDegrees(degrees);
  return degrees.length !== sorted.length || degrees.some((id, index) => id !== sorted[index]);
});

/** The first preset that exactly matches the selection (in degree order), or null. */
export const selectActivePreset = createSelector(
  [selectSelectedDegrees, selectIsCustomOrder],
  (degrees, isCustomOrder) => (isCustomOrder ? null : findActivePreset(degrees)),
);

/** Every preset that exactly matches the selection (1·4·5 and major share a selection). */
export const selectMatchingPresets = createSelector(
  [selectSelectedDegrees, selectIsCustomOrder],
  (degrees, isCustomOrder) =>
    isCustomOrder
      ? []
      : PRESETS.filter((preset) => matchesPreset(degrees, preset)).map((preset) => preset.id),
);
