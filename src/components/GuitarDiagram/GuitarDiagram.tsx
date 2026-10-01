import type { FC } from 'react';
import type { GuitarVoicing } from '../../lib/music/guitarVoicings';
import { STRING_NAMES, detectBarre, diagramWindow } from '../../lib/music/guitarVoicings';
import styles from './GuitarDiagram.module.css';

interface GuitarDiagramProps {
  voicing: GuitarVoicing;
  /** Accessible description, e.g. "Guitar chord diagram: F". */
  label: string;
}

const WIDTH = 260;
const HEIGHT = 230;
const LEFT = 40;
const TOP = 42;
const STRING_GAP = 36;
const FRET_GAP = 34;
const FRET_ROWS = 5;
const DOT_RADIUS = 11;

const stringX = (string: number): number => LEFT + string * STRING_GAP;
const fretLineY = (row: number): number => TOP + row * FRET_GAP;
/** Vertical centre of the space for a fret, relative to the diagram's first fret. */
const fretCentreY = (fret: number, startFret: number): number =>
  fretLineY(fret - startFret) + FRET_GAP / 2;

/** Chord box: 6 strings low E → high e left to right, 5 frets, × muted, ○ open, barre bar. */
const GuitarDiagram: FC<GuitarDiagramProps> = ({ voicing, label }) => {
  const { startFret, showNut } = diagramWindow(voicing);
  const barre = detectBarre(voicing);

  return (
    <svg
      className={styles.diagram}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
    >
      <rect
        className={styles.wood}
        x={stringX(0)}
        y={fretLineY(0)}
        width={STRING_GAP * 5}
        height={FRET_GAP * FRET_ROWS}
      />
      {Array.from({ length: FRET_ROWS + 1 }, (_, row) => (
        <line
          key={`fret-${row}`}
          className={styles.fret}
          x1={stringX(0)}
          x2={stringX(5)}
          y1={fretLineY(row)}
          y2={fretLineY(row)}
        />
      ))}
      {showNut ? (
        <line
          className={styles.nut}
          data-testid="nut"
          x1={stringX(0) - 1}
          x2={stringX(5) + 1}
          y1={fretLineY(0)}
          y2={fretLineY(0)}
        />
      ) : (
        <text
          className={styles.position}
          data-testid="start-fret"
          x={stringX(0) - 12}
          y={fretLineY(0) + FRET_GAP / 2 + 5}
          textAnchor="end"
        >
          {startFret}
        </text>
      )}
      {STRING_NAMES.map((name, string) => (
        <line
          key={`string-${name}-${string}`}
          className={styles.string}
          x1={stringX(string)}
          x2={stringX(string)}
          y1={fretLineY(0)}
          y2={fretLineY(FRET_ROWS)}
          strokeWidth={1 + (5 - string) * 0.3}
        />
      ))}
      {barre && (
        <rect
          className={styles.dot}
          data-testid="barre"
          x={stringX(barre.fromString) - DOT_RADIUS}
          y={fretCentreY(barre.fret, startFret) - DOT_RADIUS}
          width={stringX(barre.toString) - stringX(barre.fromString) + DOT_RADIUS * 2}
          height={DOT_RADIUS * 2}
          rx={DOT_RADIUS}
        />
      )}
      {voicing.map((fret, string) => {
        const x = stringX(string);
        if (fret === null) {
          return (
            <text
              key={`mark-${string}`}
              className={styles.muted}
              data-testid="muted"
              x={x}
              y={fretLineY(0) - 12}
              textAnchor="middle"
            >
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={`mark-${string}`}
              className={styles.open}
              data-testid="open"
              cx={x}
              cy={fretLineY(0) - 17}
              r={7}
            />
          );
        }
        if (barre && fret === barre.fret) return null;
        return (
          <circle
            key={`mark-${string}`}
            className={styles.dot}
            data-testid="dot"
            cx={x}
            cy={fretCentreY(fret, startFret)}
            r={DOT_RADIUS}
          />
        );
      })}
      {STRING_NAMES.map((name, string) => (
        <text
          key={`name-${name}-${string}`}
          className={styles.stringName}
          x={stringX(string)}
          y={fretLineY(FRET_ROWS) + 20}
          textAnchor="middle"
        >
          {name}
        </text>
      ))}
    </svg>
  );
};

export default GuitarDiagram;
