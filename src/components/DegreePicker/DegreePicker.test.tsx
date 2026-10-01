import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { initialUiState } from '../../features/ui/uiSlice';
import { renderWithStore } from '../../test/renderWithStore';
import ChordTable from '../ChordTable';
import DegreePicker from './DegreePicker';

const renderPicker = (selectedDegrees = initialUiState.selectedDegrees) =>
  renderWithStore(
    <>
      <DegreePicker />
      <ChordTable />
    </>,
    { preloadedState: { ui: { ...initialUiState, selectedDegrees } } },
  );

const chips = () => within(screen.getByRole('group', { name: 'אילו אקורדים להציג' }));
const chip = (name: string) => chips().getByRole('button', { name });
const preset = (name: string) =>
  within(screen.getByRole('group', { name: 'בחירה מהירה' })).getByRole('button', { name });
const columnCount = () => screen.getAllByRole('columnheader').length - 2;

describe('DegreePicker', () => {
  it('shows one chip per degree labelled with its chord in C, all selected by default', () => {
    renderPicker();
    const labels = chips()
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(labels).toEqual(['1 · C', '2m · Dm', '3m · Em', '4 · F', '5 · G', '6m · Am', '7° · B°']);
    chips()
      .getAllByRole('button')
      .forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'true'));
    expect(columnCount()).toBe(7);
  });

  it('removes and adds columns when chips are toggled', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(chip('2m · Dm'));
    expect(chip('2m · Dm')).toHaveAttribute('aria-pressed', 'false');
    expect(columnCount()).toBe(6);
    await user.click(chip('2m · Dm'));
    expect(columnCount()).toBe(7);
  });

  it('does not let the last selected chip be turned off', async () => {
    const user = userEvent.setup();
    renderPicker(['5']);
    const last = chip('5 · G');
    expect(last).toHaveAttribute('aria-disabled', 'true');
    expect(last).toHaveAttribute('title', 'חייב להישאר לפחות אקורד אחד בטבלה');
    await user.click(last);
    expect(last).toHaveAttribute('aria-pressed', 'true');
    expect(columnCount()).toBe(1);
  });

  it('sets the selection from presets and marks the matching preset as pressed', async () => {
    const user = userEvent.setup();
    renderPicker();
    expect(preset('הכל')).toHaveAttribute('aria-pressed', 'true');

    await user.click(preset('מינור'));
    expect(columnCount()).toBe(3);
    expect(preset('מינור')).toHaveAttribute('aria-pressed', 'true');
    expect(preset('הכל')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('2m · Dm')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('1 · C')).toHaveAttribute('aria-pressed', 'false');

    await user.click(preset('פופ 1·5·6·4'));
    expect(screen.getAllByRole('columnheader').map((th) => th.firstChild?.textContent)).toEqual([
      'סולם',
      '1',
      '4',
      '5',
      '6m',
      'קאפו על צורות C',
    ]);
    expect(preset('פופ 1·5·6·4')).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks no preset when the selection matches none', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(chip('7° · B°'));
    within(screen.getByRole('group', { name: 'בחירה מהירה' }))
      .getAllByRole('button')
      .forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'false'));
  });
});
