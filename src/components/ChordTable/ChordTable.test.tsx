import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { initialUiState } from '../../features/ui/uiSlice';
import { renderWithStore } from '../../test/renderWithStore';
import DegreePicker from '../DegreePicker';
import ChordTable from './ChordTable';

const rowFor = (keyName: string) => {
  const header = screen.getByRole('rowheader', { name: new RegExp(`^${keyName}(\\s|$)`) });
  const row = header.closest('tr');
  if (!row) throw new Error(`No row for ${keyName}`);
  return row;
};
const chordsIn = (row: HTMLElement) =>
  within(row)
    .getAllByRole('button')
    .map((button) => button.textContent);

describe('ChordTable', () => {
  it('renders 12 keys a half step apart with all 7 chords by default', () => {
    renderWithStore(<ChordTable />);
    expect(screen.getAllByRole('rowheader').map((th) => th.firstChild?.textContent)).toEqual([
      'C',
      'D♭',
      'D',
      'E♭',
      'E',
      'F',
      'F♯',
      'G',
      'A♭',
      'A',
      'B♭',
      'B',
    ]);
    expect(chordsIn(rowFor('F♯'))).toEqual(['F♯', 'G♯m', 'A♯m', 'B', 'C♯', 'D♯m', 'E♯°']);
  });

  it('shows exactly 3 chord columns for C, F, G, and the D row reads D G A', async () => {
    const user = userEvent.setup();
    renderWithStore(
      <>
        <DegreePicker />
        <ChordTable />
      </>,
      { preloadedState: { ui: { ...initialUiState, selectedDegrees: ['1'] } } },
    );
    await user.click(screen.getByRole('button', { name: '4 · F' }));
    await user.click(screen.getByRole('button', { name: '5 · G' }));

    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    expect(chordsIn(rowFor('C'))).toEqual(['C', 'F', 'G']);
    expect(chordsIn(rowFor('D'))).toEqual(['D', 'G', 'A']);
    expect(chordsIn(rowFor('B♭'))).toEqual(['B♭', 'E♭', 'F']);
  });

  it('labels column headers with the role and the chord in C', () => {
    renderWithStore(<ChordTable />, {
      preloadedState: { ui: { ...initialUiState, selectedDegrees: ['2m', '4', '5'] } },
    });
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual([
      'סולם',
      '2mכמו Dm',
      '4מתרחק · כמו F',
      '5מתח · דומיננטה · כמו G',
      'קאפו על צורות C',
    ]);
  });

  it('stars the open-chord keys and shows the capo fret', () => {
    renderWithStore(<ChordTable />);
    const starred = screen
      .getAllByRole('rowheader')
      .filter((th) => within(th).queryByText('★'))
      .map((th) => th.firstChild?.textContent);
    expect(starred).toEqual(['C', 'D', 'E', 'G', 'A']);
    expect(within(rowFor('C')).getByText('—')).toBeInTheDocument();
    expect(within(rowFor('B')).getByText('11')).toBeInTheDocument();
  });

  it('marks the clicked chord as open and closes it on a second click', async () => {
    const user = userEvent.setup();
    renderWithStore(<ChordTable />);
    const fInC = within(rowFor('C')).getByRole('button', { name: 'F' });
    expect(fInC).toHaveAttribute('aria-expanded', 'false');
    await user.click(fInC);
    expect(fInC).toHaveAttribute('aria-expanded', 'true');
    await user.click(fInC);
    expect(fInC).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders in English', () => {
    renderWithStore(<ChordTable />, {
      preloadedState: { ui: { ...initialUiState, language: 'en', selectedDegrees: ['5'] } },
    });
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Key',
      '5Tension · dominant · like G',
      'Capo with C shapes',
    ]);
  });
});
