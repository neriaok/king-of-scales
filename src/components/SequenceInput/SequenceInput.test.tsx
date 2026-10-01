import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { initialUiState } from '../../features/ui/uiSlice';
import { renderWithStore } from '../../test/renderWithStore';
import ChordTable from '../ChordTable';
import DegreePicker from '../DegreePicker';

const renderPicker = (ui = initialUiState) =>
  renderWithStore(
    <>
      <DegreePicker />
      <ChordTable />
    </>,
    { preloadedState: { ui } },
  );

const rowChords = (keyName: string) => {
  const header = screen.getByRole('rowheader', { name: new RegExp(`^${keyName}(\\s|$)`) });
  return within(header.closest('tr') as HTMLElement)
    .getAllByRole('button')
    .map((button) => button.textContent);
};
const input = () => screen.getByRole('textbox', { name: 'רצף משלך' });
const show = () => screen.getByRole('button', { name: 'הצג' });

describe('SequenceInput', () => {
  it('shows 1-4-5 as C F G', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(input(), '1-4-5');
    await user.click(show());
    expect(rowChords('C')).toEqual(['C', 'F', 'G']);
    expect(rowChords('D')).toEqual(['D', 'G', 'A']);
  });

  it('shows the columns in the order typed', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(input(), '6 4 1 5{Enter}');
    expect(rowChords('C')).toEqual(['Am', 'F', 'C', 'G']);
    expect(rowChords('G')).toEqual(['Em', 'C', 'G', 'D']);
    expect(input()).toHaveValue('6-4-1-5');
  });

  it('turns off the presets and updates the chips for a custom order', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(input(), '2 5 1{Enter}');
    within(screen.getByRole('group', { name: 'בחירה מהירה' }))
      .getAllByRole('button')
      .forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByRole('button', { name: '2m · Dm' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '4 · F' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('explains invalid input and keeps the table as it was', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(input(), '1 8 4{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('לא: 8');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(rowChords('C')).toHaveLength(7);

    await user.type(input(), 'x');
    expect(input()).not.toHaveAttribute('aria-invalid');
  });

  it('asks for at least one digit', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(show());
    expect(screen.getByRole('alert')).toHaveTextContent('לפחות ספרה אחת');
  });

  it('shows repeated numbers once and says so', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(input(), '1-4-1-5{Enter}');
    expect(rowChords('C')).toEqual(['C', 'F', 'G']);
    expect(screen.getByRole('status')).toHaveTextContent('פעם אחת');
  });

  it('applies a common progression in playing order', async () => {
    const user = userEvent.setup();
    renderPicker();
    const suggestions = within(screen.getByRole('group', { name: 'רצפים נפוצים' }));
    const fifties = suggestions.getByRole('button', { name: /1-6-4-5/ });
    await user.click(fifties);
    expect(rowChords('C')).toEqual(['C', 'Am', 'F', 'G']);
    expect(input()).toHaveValue('1-6-4-5');
    expect(fifties).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the built-in presets in degree order', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(input(), '6 4 1 5{Enter}');
    await user.click(
      within(screen.getByRole('group', { name: 'בחירה מהירה' })).getByRole('button', {
        name: 'פופ 1·5·6·4',
      }),
    );
    expect(rowChords('C')).toEqual(['C', 'F', 'G', 'Am']);
  });

  it('starts with the saved custom sequence in the input', () => {
    renderPicker({ ...initialUiState, selectedDegrees: ['6m', '4', '1', '5'] });
    expect(input()).toHaveValue('6-4-1-5');
  });
});
