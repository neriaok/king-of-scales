import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SegmentedControl from './SegmentedControl';

const OPTIONS = [
  { value: 'guitar', label: 'גיטרה' },
  { value: 'piano', label: 'פסנתר' },
];

describe('SegmentedControl', () => {
  it('renders a labelled group of toggle buttons', () => {
    render(<SegmentedControl label="כלי" options={OPTIONS} value="guitar" onChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'כלי' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'גיטרה' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'פסנתר' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the clicked value', async () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl label="כלי" options={OPTIONS} value="guitar" onChange={handleChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'פסנתר' }));
    expect(handleChange).toHaveBeenCalledWith('piano');
  });

  it('does not call onChange for the selected option', async () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl label="כלי" options={OPTIONS} value="guitar" onChange={handleChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'גיטרה' }));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
