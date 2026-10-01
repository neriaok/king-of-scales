import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PianoDiagram from './PianoDiagram';

describe('PianoDiagram', () => {
  it('draws two octaves: 14 white and 10 black keys', () => {
    render(<PianoDiagram highlighted={[]} label="Piano" />);
    expect(screen.getByRole('img', { name: 'Piano' })).toBeInTheDocument();
    expect(screen.getAllByTestId('key')).toHaveLength(24);
  });

  it('highlights and names the chord tones', () => {
    render(
      <PianoDiagram
        highlighted={[
          { offset: 3, name: 'E♭' },
          { offset: 6, name: 'G♭' },
          { offset: 10, name: 'B♭' },
        ]}
        label="Piano: E♭m"
      />,
    );
    expect(screen.getAllByTestId('key-on')).toHaveLength(3);
    expect(screen.getAllByTestId('key')).toHaveLength(21);
    ['E♭', 'G♭', 'B♭'].forEach((name) => expect(screen.getByText(name)).toBeInTheDocument());
  });

  it('highlights white keys in the second octave', () => {
    render(
      <PianoDiagram
        highlighted={[
          { offset: 9, name: 'A' },
          { offset: 12, name: 'C' },
          { offset: 16, name: 'E' },
        ]}
        label="Piano: Am"
      />,
    );
    expect(screen.getAllByTestId('key-on')).toHaveLength(3);
  });
});
