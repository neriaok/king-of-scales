import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getGuitarVoicing } from '../../lib/music/guitarVoicings';
import { parseChord } from '../../lib/music/notes';
import GuitarDiagram from './GuitarDiagram';

const renderChord = (symbol: string) =>
  render(
    <GuitarDiagram voicing={getGuitarVoicing(parseChord(symbol))} label={`Guitar: ${symbol}`} />,
  );

describe('GuitarDiagram', () => {
  it('is an accessible image', () => {
    renderChord('C');
    expect(screen.getByRole('img', { name: 'Guitar: C' })).toBeInTheDocument();
  });

  it('draws C in open position: nut, one muted string, two open strings, three dots', () => {
    renderChord('C');
    expect(screen.getByTestId('nut')).toBeInTheDocument();
    expect(screen.queryByTestId('start-fret')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('muted')).toHaveLength(1);
    expect(screen.getAllByTestId('open')).toHaveLength(2);
    expect(screen.getAllByTestId('dot')).toHaveLength(3);
    expect(screen.queryByTestId('barre')).not.toBeInTheDocument();
  });

  it('draws the F barre as one bar plus the remaining dots', () => {
    renderChord('F');
    expect(screen.getAllByTestId('barre')).toHaveLength(1);
    expect(screen.getAllByTestId('dot')).toHaveLength(3);
    expect(screen.queryByTestId('muted')).not.toBeInTheDocument();
  });

  it('shows the start fret instead of the nut above fret 4', () => {
    renderChord('Cm');
    expect(screen.queryByTestId('nut')).not.toBeInTheDocument();
    expect(screen.getByTestId('start-fret')).toHaveTextContent('3');
    expect(screen.getByTestId('barre')).toBeInTheDocument();
  });

  it('labels the strings low E to high e', () => {
    const { container } = renderChord('G');
    const names = [...container.querySelectorAll('text')]
      .map((t) => t.textContent)
      .filter((t) => t && /^[EADGBe]$/.test(t));
    expect(names).toEqual(['E', 'A', 'D', 'G', 'B', 'e']);
  });
});
