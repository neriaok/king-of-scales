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
    expect(screen.getByRole('alert')).toHaveTextContent('הקלד ספרות 1 עד 7 או אקורדים');
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

  describe('with chords', () => {
    const answer = () => screen.getByRole('status').querySelector('strong')?.textContent;

    it('converts chords into numbers in their key and shows them', async () => {
      const user = userEvent.setup();
      renderInput();
      await typeSequence(user, 'Am F C G{Enter}');
      expect(input()).toHaveValue('6-4-1-5');
      expect(rowChords('C')).toEqual(['Am', 'F', 'C', 'G']);
      const status = within(screen.getByRole('status'));
      expect(status.getByText('בסולם C:')).toBeInTheDocument();
      expect(answer()).toBe('6-4-1-5');
      expect(status.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
        'Am→6',
        'F→4',
        'C→1',
        'G→5',
      ]);
    });

    it('finds the key on its own', async () => {
      const user = userEvent.setup();
      renderInput();
      await typeSequence(user, 'G D Em C{Enter}');
      expect(screen.getByText('בסולם G:')).toBeInTheDocument();
      expect(rowChords('G')).toEqual(['G', 'D', 'Em', 'C']);
    });

    it('lets you choose the key when several fit, e.g. a single chord', async () => {
      const user = userEvent.setup();
      renderInput();
      await typeSequence(user, 'Em{Enter}');
      const keys = within(screen.getByRole('group', { name: 'סולמות אפשריים נוספים' }));
      expect(keys.getAllByRole('button').map((button) => button.textContent)).toEqual(
        expect.arrayContaining(['G6', 'C3', 'D2']),
      );
      await user.click(keys.getByRole('button', { name: /^D/ }));
      expect(answer()).toBe('2');
      expect(input()).toHaveValue('2');
      expect(rowChords('D')).toEqual(['Em']);
    });

    it('reads chords typed in capitals, as phone keyboards do', async () => {
      const user = userEvent.setup();
      renderInput();
      await typeSequence(user, 'C F G AM{Enter}');
      expect(answer()).toBe('1-4-5-6');
      expect(rowChords('C')).toEqual(['C', 'F', 'G', 'Am']);
      expect(
        within(screen.getByRole('status'))
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['C→1', 'F→4', 'G→5', 'Am→6']);
    });

    it('accepts sevenths and lowercase', async () => {
      const user = userEvent.setup();
      renderInput();
      await typeSequence(user, 'dm7 g7 cmaj7{Enter}');
      expect(answer()).toBe('2-5-1');
    });

    it('marks chords outside the key with ? and leaves them out of the table', async () => {
      const user = userEvent.setup();
      renderInput();
      await typeSequence(user, 'C F G Bb{Enter}');
      expect(answer()).toBe('1-4-5-?');
      expect(screen.getByText('? = אקורד מחוץ לסולם')).toBeInTheDocument();
      expect(rowChords('C')).toEqual(['C', 'F', 'G']);
    });

    it('explains chords it cannot read', async () => {
      const user = userEvent.setup();
      renderInput();
      await typeSequence(user, 'Am Xyz{Enter}');
      expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחתי לזהות: Xyz');
      expect(input()).toHaveAttribute('aria-invalid', 'true');
    });

    it('works in English', async () => {
      const user = userEvent.setup();
      renderInput({ ...initialUiState, language: 'en' });
      const box = screen.getByRole('textbox', { name: 'Your own sequence' });
      await user.clear(box);
      await user.type(box, 'Am F C G{Enter}');
      expect(screen.getByText('In C:')).toBeInTheDocument();
    });
  });
});
