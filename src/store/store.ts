import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { loadPersistedUi, startUiPersistence } from '../features/ui/persistence';
import uiReducer, { initialUiState } from '../features/ui/uiSlice';

const rootReducer = combineReducers({ ui: uiReducer });

export type RootState = ReturnType<typeof rootReducer>;

/** Creates a store; without preloaded state it restores the persisted UI from localStorage. */
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const listenerMiddleware = createListenerMiddleware<RootState>();
  startUiPersistence(listenerMiddleware);

  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState ?? {
      ui: { ...initialUiState, ...loadPersistedUi() },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
