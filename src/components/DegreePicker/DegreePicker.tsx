import clsx from 'clsx';
import { type FC, useId } from 'react';
import {
  applyPreset,
  selectMatchingPresets,
  selectSelectedDegrees,
  toggleDegree,
} from '../../features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useMessages } from '../../hooks/useMessages';
import { DEGREES, PRESETS } from '../../lib/music/degrees';
import { formatChord } from '../../lib/music/notes';
import styles from './DegreePicker.module.css';

const QUALITY_CLASS = {
  major: styles.major,
  minor: styles.minor,
  diminished: styles.diminished,
} as const;

const DegreePicker: FC = () => {
  const dispatch = useAppDispatch();
  const messages = useMessages();
  const selected = useAppSelector(selectSelectedDegrees);
  const matchingPresets = useAppSelector(selectMatchingPresets);
  const headingId = useId();
  const hintId = useId();

  return (
    <section className={styles.picker} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {messages.pickerLabel}
      </h2>
      <div className={styles.rows}>
        <div className={styles.chips} role="group" aria-labelledby={headingId}>
          {DEGREES.map((degree) => {
            const isSelected = selected.includes(degree.id);
            const isLocked = isSelected && selected.length === 1;
            return (
              <button
                key={degree.id}
                type="button"
                className={clsx(styles.chip, QUALITY_CLASS[degree.quality])}
                aria-pressed={isSelected}
                aria-disabled={isLocked || undefined}
                aria-describedby={isLocked ? hintId : undefined}
                title={isLocked ? messages.lastDegreeHint : undefined}
                onClick={() => {
                  if (!isLocked) dispatch(toggleDegree(degree.id));
                }}
              >
                <span className={styles.degree}>{degree.label}</span>
                {' · '}
                <span className={styles.inC}>{formatChord(degree.inC)}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.presets} role="group" aria-label={messages.presetsLabel}>
          {PRESETS.map((preset) => {
            const { name, sequence } = messages.presets[preset.id];
            return (
              <button
                key={preset.id}
                type="button"
                className={styles.preset}
                aria-pressed={matchingPresets.includes(preset.id)}
                onClick={() => dispatch(applyPreset(preset.id))}
              >
                {name}
                {name && sequence && ' '}
                {sequence && (
                  <span dir="ltr" className={styles.sequence}>
                    {sequence}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p id={hintId} className="visually-hidden">
        {messages.lastDegreeHint}
      </p>
    </section>
  );
};

export default DegreePicker;
