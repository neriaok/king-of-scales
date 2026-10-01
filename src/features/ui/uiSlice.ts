import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { DegreeId, PresetId } from '../../lib/music/degrees';
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
  selectedChord: SelectedChord | null;
}

export const initialUiState: UiState = {
  selectedDegrees: [...DEGREE_IDS],
  instrument: 'guitar',
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
    /** Adds or removes a column. Ignored when it would leave no column selected. */
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
    setInstrument: (state, action: PayloadAction<Instrument>) => {
      state.instrument = action.payload;
    },
    selectChord: (state, action: PayloadAction<SelectedChord>) => {
      state.selectedChord = action.payload;
    },
    closeChord: (state) => {
      state.selectedChord = null;
    },
  },
});

export const { toggleDegree, applyPreset, setInstrument, selectChord, closeChord } =
  uiSlice.actions;

export default uiSlice.reducer;

interface StateWithUi {
  ui: UiState;
}

export const selectSelectedDegrees = (state: StateWithUi): DegreeId[] => state.ui.selectedDegrees;
export const selectInstrument = (state: StateWithUi): Instrument => state.ui.instrument;
export const selectSelectedChord = (state: StateWithUi): SelectedChord | null =>
  state.ui.selectedChord;

/** The selected degrees in degree order (1 → 7°). */
export const selectVisibleDegrees = createSelector([selectSelectedDegrees], (degrees) =>
  sortDegrees(degrees),
);

/** The first preset that exactly matches the selection, or null. */
export const selectActivePreset = createSelector([selectSelectedDegrees], (degrees) =>
  findActivePreset(degrees),
);

/** Every preset that exactly matches the selection (1·4·5 and major share a selection). */
export const selectMatchingPresets = createSelector([selectSelectedDegrees], (degrees) =>
  PRESETS.filter((preset) => matchesPreset(degrees, preset)).map((preset) => preset.id),
);
