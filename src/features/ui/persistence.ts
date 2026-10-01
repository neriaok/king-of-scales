import type { ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { isAnyOf } from '@reduxjs/toolkit';
import type { Language } from '../../i18n/messages';
import { isLanguage } from '../../i18n/messages';
import type { DegreeId } from '../../lib/music/degrees';
import { DEGREE_IDS, isDegreeId } from '../../lib/music/degrees';
import type { Instrument, UiState } from './uiSlice';
import {
  applyPreset,
  isInstrument,
  setDegreeSequence,
  setInstrument,
  setLanguage,
  toggleDegree,
} from './uiSlice';

export const STORAGE_KEY = 'king-of-scales:ui';

/** The part of the UI state that survives a reload. */
export interface PersistedUi {
  selectedDegrees: DegreeId[];
  instrument: Instrument;
  language: Language;
}

const DEFAULTS: PersistedUi = {
  selectedDegrees: [...DEGREE_IDS],
  instrument: 'guitar',
  language: 'he',
};

/**
 * Validates whatever was stored. Unknown and repeated degrees are dropped; if nothing valid is left
 * the selection falls back to all seven degrees. A bad instrument falls back to guitar and
 * a bad language to Hebrew.
 */
export const parsePersistedUi = (raw: unknown): PersistedUi => {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULTS };
  const record = raw as Record<string, unknown>;

  // Order is kept: it is degree order unless the user typed a custom sequence.
  const storedDegrees = Array.isArray(record.selectedDegrees)
    ? [...new Set(record.selectedDegrees.filter(isDegreeId))]
    : [];
  return {
    selectedDegrees: storedDegrees.length > 0 ? storedDegrees : [...DEFAULTS.selectedDegrees],
    instrument: isInstrument(record.instrument) ? record.instrument : DEFAULTS.instrument,
    language: isLanguage(record.language) ? record.language : DEFAULTS.language,
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

/** Saves the selection, instrument and language whenever an action changes them. */
export const startUiPersistence = (
  listenerMiddleware: ListenerMiddlewareInstance<StateWithUi>,
): (() => void) =>
  listenerMiddleware.startListening({
    matcher: isAnyOf(toggleDegree, applyPreset, setDegreeSequence, setInstrument, setLanguage),
    effect: (_action, api) => {
      const { selectedDegrees, instrument, language } = api.getState().ui;
      savePersistedUi({ selectedDegrees, instrument, language });
    },
  });
