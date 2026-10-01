import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PlayButton from './PlayButton';

describe('PlayButton', () => {
  it('calls onPlay on click', async () => {
    const handlePlay = vi.fn();
    render(<PlayButton label="▶ נגן" onPlay={handlePlay} />);
    await userEvent.click(screen.getByRole('button', { name: '▶ נגן' }));
    expect(handlePlay).toHaveBeenCalledTimes(1);
  });
});
