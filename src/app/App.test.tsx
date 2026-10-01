import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setLanguage } from '../features/ui/uiSlice';
import { renderWithStore } from '../test/renderWithStore';
import App from './App';

describe('App', () => {
  it('renders in Hebrew, right to left, by default', () => {
    renderWithStore(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'מלך הסולמות' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'he');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.title).toBe('מלך הסולמות');
  });

  it('switches to English, left to right', () => {
    const { store } = renderWithStore(<App />);
    act(() => {
      store.dispatch(setLanguage('en'));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'King of Scales' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(document.title).toBe('King of Scales');
  });
});
