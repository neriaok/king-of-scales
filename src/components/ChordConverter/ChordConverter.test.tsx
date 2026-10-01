import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { initialUiState } from '../../features/ui/uiSlice';
import { renderWithStore } from '../../test/renderWithStore';
import ChordTable from '../ChordTable';
import SequenceInput from '../SequenceInput';
import ChordConverter from './ChordConverter';

const renderConverter = (ui = initialUiState) =>
  renderWithStore(
    <>
      <SequenceInput />
      <ChordConverter />
      <ChordTable />
    </>,
    { preloadedState: { ui } },
  );

const chordInput = () => screen.getByRole('textbox', { name: 'המרת אקורדים למספרים' });
const convert = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.type(chordInput(), text);
  await user.click(screen.getByRole('button', { name: 'המר' }));
};
const converterForm = () => chordInput().closest('form') as HTMLElement;
const answer = () => converterForm().querySelector('strong')?.textContent;
const rowChords = (keyName: string) => {
  const header = screen.getByRole('rowheader', { name: new RegExp(`^${keyName}(\\s|$)`) });
  return within(header.closest('tr') as HTMLElement)
    .getAllByRole('button')
    .map((button) => button.textContent);
};

describe('ChordConverter', () => {
  it('converts a progression into degree numbers in its key', async () => {
    const user = userEvent.setup();
    renderConverter();
    await convert(user, 'Am F C G');
    const form = within(converterForm());
    expect(form.getByText('בסולם C:')).toBeInTheDocument();
    expect(answer()).toBe('6-4-1-5');
    expect(form.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Am→6',
      'F→4',
      'C→1',
      'G→5',
    ]);
  });

  it('shows the numbers in the table and in the sequence input', async () => {
    const user = userEvent.setup();
    renderConverter();
    await convert(user, 'G D Em C');
    await user.click(screen.getByRole('button', { name: 'הצג בטבלה' }));
    expect(screen.getByRole('textbox', { name: 'רצף משלך' })).toHaveValue('1-5-6-4');
    expect(rowChords('G')).toEqual(['G', 'D', 'Em', 'C']);
  });

  it('gives a single chord its number in every key that contains it', async () => {
    const user = userEvent.setup();
    renderConverter();
    await convert(user, 'Em');
    const keys = within(screen.getByRole('group', { name: 'סולמות אפשריים נוספים' }));
    const options = keys.getAllByRole('button').map((button) => button.textContent);
    expect(options).toEqual(expect.arrayContaining(['G6', 'C3', 'D2']));

    await user.click(keys.getByRole('button', { name: /^D/ }));
    expect(answer()).toBe('2');
    expect(screen.getByText('בסולם D:')).toBeInTheDocument();
  });

  it('marks chords outside the key with ?', async () => {
    const user = userEvent.setup();
    renderConverter();
    await convert(user, 'C F G Bb');
    expect(answer()).toBe('1-4-5-?');
    expect(screen.getByText('? = אקורד מחוץ לסולם')).toBeInTheDocument();
  });

  it('accepts sevenths and lowercase', async () => {
    const user = userEvent.setup();
    renderConverter();
    await convert(user, 'dm7 g7 cmaj7');
    expect(answer()).toBe('2-5-1');
  });

  it('explains what it cannot read', async () => {
    const user = userEvent.setup();
    renderConverter();
    await convert(user, 'Am Xyz');
    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחתי לזהות: Xyz');
    expect(chordInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('works in English', async () => {
    const user = userEvent.setup();
    renderConverter({ ...initialUiState, language: 'en' });
    await user.type(screen.getByRole('textbox', { name: 'Chords to numbers' }), 'Am F C G');
    await user.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByText('In C:')).toBeInTheDocument();
  });
});
