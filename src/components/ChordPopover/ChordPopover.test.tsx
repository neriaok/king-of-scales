import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../app/App';
import { applyPreset, initialUiState } from '../../features/ui/uiSlice';
import { renderWithStore } from '../../test/renderWithStore';

const chordButton = (keyName: string, chord: string) => {
  const header = screen.getByRole('rowheader', { name: new RegExp(`^${keyName}(\\s|$)`) });
  const row = header.closest('tr');
  if (!row) throw new Error(`No row ${keyName}`);
  return within(row).getByRole('button', { name: chord });
};

const renderApp = (ui = initialUiState) => renderWithStore(<App />, { preloadedState: { ui } });

describe('ChordPopover', () => {
  it('opens on the first chord of the table on load', () => {
    renderApp();
    const dialog = screen.getByRole('dialog', { name: 'C' });
    expect(within(dialog).getByText('מז׳ור')).toBeInTheDocument();
    expect(chordButton('C', 'C')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows spelled chord tones with degrees, a diagram and a tip', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(chordButton('F♯', 'E♯°'));
    const dialog = screen.getByRole('dialog', { name: 'E♯°' });
    expect(within(dialog).getByText('מוקטן')).toBeInTheDocument();
    const tones = within(within(dialog).getByRole('list', { name: 'צלילי האקורד' })).getAllByRole(
      'listitem',
    );
    expect(tones.map((tone) => tone.textContent)).toEqual(['E♯1', 'G♯♭3', 'B♭5']);
    expect(within(dialog).getByRole('img', { name: /תרשים אצבוע לגיטרה/ })).toBeInTheDocument();
    expect(within(dialog).getByText(/הסריג שבו מתחיל התרשים/)).toBeInTheDocument();
  });

  it('explains × and ○ for open-position chords', () => {
    renderApp();
    expect(within(screen.getByRole('dialog')).getByText(/לא לפרוט/)).toBeInTheDocument();
  });

  it('explains the start fret and barre for chords played up the neck', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(chordButton('E♭', 'Cm'));
    expect(within(screen.getByRole('dialog')).getByText(/ברה/)).toBeInTheDocument();
  });

  it('switches to the piano tip with the piano', async () => {
    const user = userEvent.setup();
    renderApp();
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'פסנתר' }));
    expect(within(dialog).getByText(/אגודל/)).toBeInTheDocument();
  });

  it('closes with the × button and returns focus to the chord', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(chordButton('D', 'G'));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'סגור' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(chordButton('D', 'G')).toHaveFocus();
  });

  it('closes on Escape and returns focus to the chord', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(chordButton('A', 'Bm'));
    expect(screen.getByRole('dialog', { name: 'Bm' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(chordButton('A', 'Bm')).toHaveFocus();
  });

  it('closes on a click outside', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open on a click inside and toggles closed on a second click on the chord', async () => {
    const user = userEvent.setup();
    renderApp();
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('heading'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(chordButton('C', 'C'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves to another chord when one is clicked while open', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(chordButton('G', 'D'));
    expect(screen.getByRole('dialog', { name: 'D' })).toBeInTheDocument();
    expect(chordButton('C', 'C')).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the instrument switch in sync between the header and the popover', async () => {
    const user = userEvent.setup();
    renderApp();
    const header = screen.getByRole('banner');
    const dialog = screen.getByRole('dialog');
    const headerPiano = within(within(header).getByRole('group', { name: 'כלי' })).getByRole(
      'button',
      { name: 'פסנתר' },
    );
    const popoverGuitar = () =>
      within(within(dialog).getByRole('group', { name: 'כלי' })).getByRole('button', {
        name: 'גיטרה',
      });

    await user.click(headerPiano);
    expect(popoverGuitar()).toHaveAttribute('aria-pressed', 'false');
    expect(within(dialog).getByRole('img', { name: /תרשים קלידים לפסנתר/ })).toBeInTheDocument();

    await user.click(popoverGuitar());
    expect(headerPiano).toHaveAttribute('aria-pressed', 'false');
    expect(within(dialog).getByRole('img', { name: /תרשים אצבוע לגיטרה/ })).toBeInTheDocument();
  });

  it('closes when the open chord’s column is hidden', () => {
    const { store } = renderApp();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => {
      store.dispatch(applyPreset('minor'));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders in English', () => {
    renderApp({ ...initialUiState, language: 'en' });
    const dialog = screen.getByRole('dialog', { name: 'C' });
    expect(within(dialog).getByText('major')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
