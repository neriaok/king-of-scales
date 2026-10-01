import type { FC, FormEvent } from 'react';
import { useId, useState } from 'react';
import {
  selectIsCustomOrder,
  selectVisibleDegrees,
  setDegreeSequence,
} from '../../features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useMessages } from '../../hooks/useMessages';
import type { DegreeId } from '../../lib/music/degrees';
import {
  SEQUENCE_SUGGESTIONS,
  formatDegreeSequence,
  parseDegreeSequence,
} from '../../lib/music/sequence';
import styles from './SequenceInput.module.css';

type Feedback = { kind: 'error' | 'note'; text: string } | null;

/** Lets the user type a degree sequence (e.g. 1-6-4-5) and shows those columns in that order. */
const SequenceInput: FC = () => {
  const dispatch = useAppDispatch();
  const messages = useMessages();
  const visibleDegrees = useAppSelector(selectVisibleDegrees);
  const isCustomOrder = useAppSelector(selectIsCustomOrder);
  const [value, setValue] = useState(() =>
    isCustomOrder ? formatDegreeSequence(visibleDegrees) : '',
  );
  const [feedback, setFeedback] = useState<Feedback>(null);
  const inputId = useId();
  const helpId = useId();
  const feedbackId = useId();

  const currentSequence = formatDegreeSequence(visibleDegrees);

  const showSequence = (degrees: DegreeId[]) => {
    dispatch(setDegreeSequence(degrees));
    setValue(formatDegreeSequence(degrees));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = parseDegreeSequence(value);
    if (!result.ok) {
      setFeedback({
        kind: 'error',
        text:
          result.error === 'empty'
            ? messages.sequence.errorEmpty
            : messages.sequence.errorInvalid(result.invalid.join(' ')),
      });
      return;
    }
    showSequence(result.degrees);
    setFeedback(result.hadDuplicates ? { kind: 'note', text: messages.sequence.duplicates } : null);
  };

  const hasError = feedback?.kind === 'error';

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className={styles.label}>
        {messages.sequence.label}
      </label>
      <div className={styles.row}>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          placeholder={messages.sequence.placeholder}
          value={value}
          aria-invalid={hasError || undefined}
          aria-describedby={`${helpId} ${feedbackId}`}
          onChange={(event) => {
            setValue(event.target.value);
            if (hasError) setFeedback(null);
          }}
        />
        <button type="submit" className={styles.submit}>
          {messages.sequence.submit}
        </button>
      </div>
      <div
        className={styles.suggestions}
        role="group"
        aria-label={messages.sequence.suggestionsLabel}
      >
        {SEQUENCE_SUGGESTIONS.map((suggestion) => {
          const sequence = formatDegreeSequence(suggestion.degrees);
          return (
            <button
              key={suggestion.id}
              type="button"
              className={styles.suggestion}
              aria-pressed={currentSequence === sequence}
              onClick={() => {
                showSequence([...suggestion.degrees]);
                setFeedback(null);
              }}
            >
              <span dir="ltr" className={styles.sequence}>
                {sequence}
              </span>{' '}
              <span className={styles.suggestionName}>
                {messages.sequence.suggestions[suggestion.id]}
              </span>
            </button>
          );
        })}
      </div>
      <p id={helpId} className={styles.help}>
        {messages.sequence.help}
      </p>
      <p
        id={feedbackId}
        className={hasError ? styles.error : styles.note}
        role={hasError ? 'alert' : 'status'}
      >
        {feedback?.text}
      </p>
    </form>
  );
};

export default SequenceInput;
