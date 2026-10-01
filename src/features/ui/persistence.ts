import type { ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { isAnyOf } from '@reduxjs/toolkit';
import type { DegreeId } from '../../lib/music/degrees';
import { DEGREE_IDS, isDegreeId, sortDegrees } from '../../lib/music/degrees';
import type { Instrument, UiState } from './uiSlice';
import { applyPreset, isInstrument, setInstrument, toggleDegree } from './uiSlice';

export const STORAGE_KEY = 'king-of-scales:ui';

/** The part of the UI state that survives a reload. */
export interface PersistedUi {
  selectedDegrees: DegreeId[];
  instrument: Instrument;
}

const DEFAULTS: PersistedUi = { selectedDegrees: [...DEGREE_IDS], instrument: 'guitar' };

/**
 * Validates whatever was stored. Unknown degrees are dropped; if nothing valid is left
 * the selection falls back to all seven degrees. A bad instrument falls back to guitar.
 */
export const parsePersistedUi = (raw: unknown): PersistedUi => {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULTS };
  const record = raw as Record<string, unknown>;

  const storedDegrees = Array.isArray(record.selectedDegrees)
    ? sortDegrees(record.selectedDegrees.filter(isDegreeId))
    : [];
  return {
    selectedDegrees: storedDegrees.length > 0 ? storedDegrees : [...DEFAULTS.selectedDegrees],
    instrument: isInstrument(record.instrument) ? record.instrument : DEFAULTS.instrument,
  };
};

export const loadPersistedUi = (): PersistedUi => {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return parsePersistedUi(text === null ? null : (JSON.parse(text) as unknown));
  } catch {
    return { ...DEFAULTS };
  }
};

export const savePersistedUi = (ui: PersistedUi): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ui));
  } catch {
    // Storage can be full, disabled or blocked (private mode); persistence is best-effort.
  }
};

interface StateWithUi {
  ui: UiState;
}

/** Saves the selection and instrument whenever an action changes them. */
export const startUiPersistence = (
  listenerMiddleware: ListenerMiddlewareInstance<StateWithUi>,
): (() => void) =>
  listenerMiddleware.startListening({
    matcher: isAnyOf(toggleDegree, applyPreset, setInstrument),
    effect: (_action, api) => {
      const { selectedDegrees, instrument } = api.getState().ui;
      savePersistedUi({ selectedDegrees, instrument });
    },
  });
