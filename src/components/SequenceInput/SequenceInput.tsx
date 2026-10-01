import type { FC, FormEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import { selectVisibleDegrees, setDegreeSequence } from '../../features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useMessages } from '../../hooks/useMessages';
import type { KeyAnalysis } from '../../lib/music/analyze';
import { analyzeProgression, looksLikeChords, parseChordList } from '../../lib/music/analyze';
import type { DegreeId } from '../../lib/music/degrees';
import {
  SEQUENCE_SUGGESTIONS,
  formatDegreeSequence,
  parseDegreeSequence,
} from '../../lib/music/sequence';
import ConversionResult from '../ConversionResult';
import styles from './SequenceInput.module.css';

type Feedback = { kind: 'error' | 'note'; text: string } | null;

interface Conversion {
  typed: string[];
  shown: KeyAnalysis;
  alternatives: KeyAnalysis[];
}

/**
 * The one box that decides the table's columns. Type degree numbers (1-6-4-5) to show
 * those columns in that order, or chords (Am F C G) to have them converted to numbers in
 * their key first.
 */
const SequenceInput: FC = () => {
  const dispatch = useAppDispatch();
  const messages = useMessages();
  const visibleDegrees = useAppSelector(selectVisibleDegrees);
  const currentSequence = formatDegreeSequence(visibleDegrees);
  const [value, setValue] = useState(currentSequence);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const inputId = useId();
  const helpId = useId();
  const feedbackId = useId();

  // Show what the table shows, also when the sequence comes from a suggestion or chords.
  useEffect(() => {
    setValue(currentSequence);
  }, [currentSequence]);

  const showSequence = (degrees: DegreeId[]) => {
    dispatch(setDegreeSequence(degrees));
    setValue(formatDegreeSequence(degrees));
  };

  /** Applies one key's reading of the chords; chords outside the key are left out. */
  const showConversion = (shown: KeyAnalysis, typed: string[], alternatives: KeyAnalysis[]) => {
    const known = shown.degrees.filter((id): id is DegreeId => id !== null);
    const unique = [...new Set(known)];
    if (unique.length > 0) showSequence(unique);
    setConversion({ typed, shown, alternatives });
    setFeedback(
      unique.length < known.length ? { kind: 'note', text: messages.sequence.duplicates } : null,
    );
  };

  const submitChords = () => {
    const parsed = parseChordList(value);
    if (!parsed.ok) {
      setFeedback({
        kind: 'error',
        text:
          parsed.error === 'empty'
            ? messages.sequence.errorEmpty
            : messages.converter.errorInvalid(parsed.invalid.join(' ')),
      });
      return;
    }
    const candidates = analyzeProgression(parsed.chords);
    const [best] = candidates;
    if (!best) {
      setFeedback({ kind: 'error', text: messages.converter.noKey });
      return;
    }
    // Offer the keys that fit as well as the best one, so the user can pick the one they meant.
    const alternatives = candidates.filter((candidate) => candidate.matched === best.matched);
    showConversion(
      best,
      parsed.chords.map((chord) => chord.name),
      alternatives,
    );
  };

  const submitNumbers = () => {
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConversion(null);
    if (looksLikeChords(value)) submitChords();
    else submitNumbers();
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
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
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
                setConversion(null);
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
      <div id={feedbackId} role={hasError ? 'alert' : 'status'} className={styles.feedback}>
        {feedback && <p className={hasError ? styles.error : styles.note}>{feedback.text}</p>}
        {conversion && (
          <ConversionResult
            typed={conversion.typed}
            shown={conversion.shown}
            alternatives={conversion.alternatives}
            onChooseKey={(analysis) =>
              showConversion(analysis, conversion.typed, conversion.alternatives)
            }
          />
        )}
      </div>
    </form>
  );
};

export default SequenceInput;
