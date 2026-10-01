import clsx from 'clsx';
import type { FC } from 'react';
import { useMessages } from '../../hooks/useMessages';
import type { KeyAnalysis } from '../../lib/music/analyze';
import { formatDegreeNumbers } from '../../lib/music/analyze';
import { formatChord } from '../../lib/music/notes';
import styles from './ConversionResult.module.css';

interface ConversionResultProps {
  /** The chords as typed, in order. */
  typed: readonly string[];
  /** The key whose numbers are shown. */
  shown: KeyAnalysis;
  /** Keys that fit the chords equally well, including `shown`. */
  alternatives: readonly KeyAnalysis[];
  onChooseKey: (analysis: KeyAnalysis) => void;
}

/** How many keys to offer when several fit. */
const MAX_KEYS = 6;

/** Explains how typed chords were turned into numbers: the key, and each chord's degree. */
const ConversionResult: FC<ConversionResultProps> = ({
  typed,
  shown,
  alternatives,
  onChooseKey,
}) => {
  const messages = useMessages();

  return (
    <div className={styles.conversion}>
      <p className={styles.answer}>
        <span>{messages.converter.inKey(shown.key.displayName)}:</span>{' '}
        <strong dir="ltr" className={styles.numbers}>
          {formatDegreeNumbers(shown.degrees)}
        </strong>
      </p>
      <ol className={styles.pairs} dir="ltr">
        {typed.map((chord, index) => {
          const degree = shown.degrees[index] ?? null;
          return (
            // Chords can repeat, so the position is part of the key.
            <li key={`${chord}-${index}`} className={styles.pair}>
              {formatChord(chord)}
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
              <span className={clsx(!degree && styles.outside)}>
                {formatDegreeNumbers([degree])}
              </span>
            </li>
          );
        })}
      </ol>
      {shown.matched < typed.length && (
        <p className={styles.help}>{messages.converter.outsideKey}</p>
      )}
      {alternatives.length > 1 && (
        <div className={styles.keys} role="group" aria-label={messages.converter.otherKeys}>
          <span className={styles.keysLabel}>{messages.converter.otherKeys}:</span>
          {alternatives.slice(0, MAX_KEYS).map((candidate) => (
            <button
              key={candidate.key.name}
              type="button"
              className={styles.keyOption}
              aria-pressed={candidate.key.name === shown.key.name}
              onClick={() => onChooseKey(candidate)}
            >
              {candidate.key.displayName}
              <span dir="ltr" className={styles.keyNumbers}>
                {formatDegreeNumbers(candidate.degrees)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversionResult;
