import clsx from 'clsx';
import type { FC } from 'react';
import styles from './PianoDiagram.module.css';

export interface HighlightedKey {
  /** Semitones above the first C of the diagram (0–23). */
  offset: number;
  /** Note name printed on the key, e.g. `E♭`. */
  name: string;
}

interface PianoDiagramProps {
  highlighted: readonly HighlightedKey[];
  /** Accessible description, e.g. "Piano keyboard diagram: Am". */
  label: string;
}

const WIDTH = 280;
const HEIGHT = 150;
const WHITE_COUNT = 14;
const WHITE_WIDTH = WIDTH / WHITE_COUNT;
const BLACK_WIDTH = WHITE_WIDTH * 0.6;
const BLACK_HEIGHT = 90;
const WHITE_PITCHES = [0, 2, 4, 5, 7, 9, 11] as const;
/** White-key indexes (within an octave) that have a black key to their right. */
const BLACK_AFTER = [0, 1, 3, 4, 5] as const;

/** Two octaves starting at C, with the chord tones highlighted and named. */
const PianoDiagram: FC<PianoDiagramProps> = ({ highlighted, label }) => {
  const nameAt = (offset: number): string | undefined =>
    highlighted.find((key) => key.offset === offset)?.name;

  const whiteKeys = Array.from({ length: WHITE_COUNT }, (_, index) => ({
    index,
    offset: Math.floor(index / 7) * 12 + (WHITE_PITCHES[index % 7] ?? 0),
  }));

  const blackKeys = [0, 1].flatMap((octave) =>
    BLACK_AFTER.map((white) => ({
      x: (octave * 7 + white + 1) * WHITE_WIDTH - BLACK_WIDTH / 2,
      offset: octave * 12 + (WHITE_PITCHES[white] ?? 0) + 1,
    })),
  );

  return (
    <svg
      className={styles.diagram}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
    >
      {whiteKeys.map(({ index, offset }) => {
        const name = nameAt(offset);
        return (
          <g key={`white-${offset}`}>
            <rect
              className={clsx(styles.white, name && styles.on)}
              data-testid={name ? 'key-on' : 'key'}
              x={index * WHITE_WIDTH + 0.5}
              y={0.5}
              width={WHITE_WIDTH - 1}
              height={HEIGHT - 1}
              rx={3}
            />
            {name && (
              <text
                className={styles.name}
                x={index * WHITE_WIDTH + WHITE_WIDTH / 2}
                y={HEIGHT - 12}
                textAnchor="middle"
              >
                {name}
              </text>
            )}
          </g>
        );
      })}
      {blackKeys.map(({ x, offset }) => {
        const name = nameAt(offset);
        return (
          <g key={`black-${offset}`}>
            <rect
              className={clsx(styles.black, name && styles.on)}
              data-testid={name ? 'key-on' : 'key'}
              x={x}
              y={0}
              width={BLACK_WIDTH}
              height={BLACK_HEIGHT}
              rx={2}
            />
            {name && (
              <text
                className={clsx(styles.name, styles.small)}
                x={x + BLACK_WIDTH / 2}
                y={BLACK_HEIGHT - 10}
                textAnchor="middle"
              >
                {name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default PianoDiagram;
