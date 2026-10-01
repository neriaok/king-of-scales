import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { initialUiState } from '../../features/ui/uiSlice';
import { renderWithStore } from '../../test/renderWithStore';
import ChordTable from '../ChordTable';
import SequenceInput from './SequenceInput';

const renderInput = (ui = initialUiState) =>
  renderWithStore(
    <>
      <SequenceInput />
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
const typeSequence = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.clear(input());
  await user.type(input(), text);
};
const suggestions = () => within(screen.getByRole('group', { name: 'רצפים נפוצים' }));

describe('SequenceInput', () => {
  it('shows the current columns as a sequence, all 7 by default', () => {
    renderInput();
    expect(input()).toHaveValue('1-2-3-4-5-6-7');
    expect(suggestions().getByRole('button', { name: /הכל/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows 1-4-5 as C F G', async () => {
    const user = userEvent.setup();
    renderInput();
    await typeSequence(user, '1-4-5');
    await user.click(show());
    expect(rowChords('C')).toEqual(['C', 'F', 'G']);
    expect(rowChords('D')).toEqual(['D', 'G', 'A']);
  });

  it('shows the columns in the order typed', async () => {
    const user = userEvent.setup();
    renderInput();
    await typeSequence(user, '6 4 1 5{Enter}');
    expect(rowChords('C')).toEqual(['Am', 'F', 'C', 'G']);
    expect(rowChords('G')).toEqual(['Em', 'C', 'G', 'D']);
    expect(input()).toHaveValue('6-4-1-5');
  });

  it('explains invalid input and keeps the table as it was', async () => {
    const user = userEvent.setup();
    renderInput();
    await typeSequence(user, '1 8 4{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('לא: 8');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(rowChords('C')).toHaveLength(7);

    await user.type(input(), 'x');
    expect(input()).not.toHaveAttribute('aria-invalid');
  });

  it('asks for at least one digit', async () => {
    const user = userEvent.setup();
    renderInput();
    await user.clear(input());
    await user.click(show());
    expect(screen.getByRole('alert')).toHaveTextContent('לפחות ספרה אחת');
  });

  it('shows repeated numbers once and says so', async () => {
    const user = userEvent.setup();
    renderInput();
    await typeSequence(user, '1-4-1-5{Enter}');
    expect(rowChords('C')).toEqual(['C', 'F', 'G']);
    expect(screen.getByRole('status')).toHaveTextContent('פעם אחת');
  });

  it('applies a common progression in playing order and can go back to all', async () => {
    const user = userEvent.setup();
    renderInput();
    const fifties = suggestions().getByRole('button', { name: /1-6-4-5/ });
    await user.click(fifties);
    expect(rowChords('C')).toEqual(['C', 'Am', 'F', 'G']);
    expect(input()).toHaveValue('1-6-4-5');
    expect(fifties).toHaveAttribute('aria-pressed', 'true');

    await user.click(suggestions().getByRole('button', { name: /הכל/ }));
    expect(rowChords('C')).toHaveLength(7);
  });

  it('starts with the saved custom sequence in the input', () => {
    renderInput({ ...initialUiState, selectedDegrees: ['6m', '4', '1', '5'] });
    expect(input()).toHaveValue('6-4-1-5');
  });
});
