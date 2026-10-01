import type { RenderOptions, RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import type { AppStore, RootState } from '../store/store';
import { makeStore } from '../store/store';

interface RenderWithStoreOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

/** Renders a component inside a fresh Redux store and returns the store with the result. */
export const renderWithStore = (
  ui: ReactElement,
  { preloadedState, store = makeStore(preloadedState), ...options }: RenderWithStoreOptions = {},
): RenderResult & { store: AppStore } => ({
  store,
  ...render(<Provider store={store}>{ui}</Provider>, options),
});
