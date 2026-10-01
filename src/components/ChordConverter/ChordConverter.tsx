import clsx from 'clsx';
import type { FC, FormEvent } from 'react';
import { useId, useState } from 'react';
import { setDegreeSequence } from '../../features/ui/uiSlice';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useMessages } from '../../hooks/useMessages';
import type { KeyAnalysis } from '../../lib/music/analyze';
import { analyzeProgression, formatDegreeNumbers, parseChordList } from '../../lib/music/analyze';
import type { DegreeId } from '../../lib/music/degrees';
import { formatChord } from '../../lib/music/notes';
import styles from './ChordConverter.module.css';

type Result =
  | { kind: 'error'; text: string }
  | { kind: 'analysis'; typed: string[]; candidates: KeyAnalysis[] }
  | null;

/** How many alternative keys to offer besides the best one. */
const MAX_OTHER_KEYS = 5;

/** Converts a typed chord progression (e.g. Am F C G) into degree numbers (6-4-1-5). */
const ChordConverter: FC = () => {
  const dispatch = useAppDispatch();
  const messages = useMessages();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const inputId = useId();
  const helpId = useId();
  const resultId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseChordList(value);
    if (!parsed.ok) {
      setResult({
        kind: 'error',
        text:
          parsed.error === 'empty'
            ? messages.converter.errorEmpty
            : messages.converter.errorInvalid(parsed.invalid.join(' ')),
      });
      return;
    }
    const candidates = analyzeProgression(parsed.chords);
    if (candidates.length === 0) {
      setResult({ kind: 'error', text: messages.converter.noKey });
      return;
    }
    setResult({ kind: 'analysis', typed: parsed.chords.map((chord) => chord.text), candidates });
    setChosenKey(null);
  };

  const hasError = result?.kind === 'error';
  const analysis = result?.kind === 'analysis' ? result : null;
  const bestMatch = analysis?.candidates[0]?.matched ?? 0;
  // Alternatives that fit as well as the best one, so the user can pick the key they meant.
  const equallyGood =
    analysis?.candidates.filter((candidate) => candidate.matched === bestMatch) ?? [];
  const shown =
    equallyGood.find((candidate) => candidate.key.name === chosenKey) ?? equallyGood[0] ?? null;

  const handleShowInTable = (degrees: (DegreeId | null)[]) => {
    const known = degrees.filter((id): id is DegreeId => id !== null);
    if (known.length > 0) dispatch(setDegreeSequence(known));
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className={styles.label}>
        {messages.converter.label}
      </label>
      <div className={styles.row}>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          dir="ltr"
          placeholder={messages.converter.placeholder}
          value={value}
          aria-invalid={hasError || undefined}
          aria-describedby={`${helpId} ${resultId}`}
          onChange={(event) => {
            setValue(event.target.value);
            if (hasError) setResult(null);
          }}
        />
        <button type="submit" className={styles.submit}>
          {messages.converter.submit}
        </button>
      </div>
      <p id={helpId} className={styles.help}>
        {messages.converter.help}
      </p>
      <div id={resultId} role={hasError ? 'alert' : 'status'} className={styles.result}>
        {hasError && <p className={styles.error}>{result.text}</p>}
        {analysis && shown && (
          <div className={styles.analysis}>
            <p className={styles.answer}>
              <span>{messages.converter.inKey(shown.key.displayName)}:</span>{' '}
              <strong dir="ltr" className={styles.numbers}>
                {formatDegreeNumbers(shown.degrees)}
              </strong>
            </p>
            <ol className={styles.pairs} dir="ltr">
              {analysis.typed.map((typed, index) => {
                const degree = shown.degrees[index];
                return (
                  // Chords can repeat, so the position is part of the key.
                  <li key={`${typed}-${index}`} className={styles.pair}>
                    {formatChord(typed)}
                    <span className={styles.arrow} aria-hidden="true">
                      →
                    </span>
                    <span className={clsx(!degree && styles.outside)}>
                      {formatDegreeNumbers([degree ?? null])}
                    </span>
                  </li>
                );
              })}
            </ol>
            {shown.matched < analysis.typed.length && (
              <p className={styles.help}>{messages.converter.outsideKey}</p>
            )}
            <button
              type="button"
              className={styles.apply}
              onClick={() => handleShowInTable(shown.degrees)}
            >
              {messages.converter.showInTable}
            </button>
            {equallyGood.length > 1 && (
              <div className={styles.keys} role="group" aria-label={messages.converter.otherKeys}>
                <span className={styles.keysLabel}>{messages.converter.otherKeys}:</span>
                {equallyGood.slice(0, MAX_OTHER_KEYS + 1).map((candidate) => (
                  <button
                    key={candidate.key.name}
                    type="button"
                    className={styles.keyOption}
                    aria-pressed={candidate === shown}
                    onClick={() => setChosenKey(candidate.key.name)}
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
        )}
      </div>
    </form>
  );
};

export default ChordConverter;
