import clsx from 'clsx';
import type { CSSProperties, FC } from 'react';
import { useEffect, useId, useRef } from 'react';
import { CHORD_POPOVER_ID, chordButtonId } from '../../features/ui/chordButtonId';
import type { SelectedChord } from '../../features/ui/uiSlice';
import {
  closeChord,
  isInstrument,
  selectInstrument,
  selectSelectedChord,
  setInstrument,
} from '../../features/ui/uiSlice';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useMessages } from '../../hooks/useMessages';
import { diagramWindow, getGuitarVoicing } from '../../lib/music/guitarVoicings';
import { formatChord, parseChord } from '../../lib/music/notes';
import { pianoVoicing } from '../../lib/music/pianoVoicing';
import { spellTriad } from '../../lib/music/spelling';
import GuitarDiagram from '../GuitarDiagram';
import PianoDiagram from '../PianoDiagram';
import SegmentedControl from '../SegmentedControl';
import styles from './ChordPopover.module.css';

/**
 * Clicks on these don't count as "outside": chord buttons toggle the popover themselves and
 * the header's instrument switch changes what the popover shows.
 */
const KEEP_OPEN_SELECTOR = '[data-chord], [data-keeps-popover]';

const anchorIdOf = (chord: SelectedChord | null): string | null =>
  chord ? chordButtonId(chord.keyName, chord.degreeId) : null;

const ChordPopover: FC = () => {
  const dispatch = useAppDispatch();
  const messages = useMessages();
  const selected = useAppSelector(selectSelectedChord);
  const instrument = useAppSelector(selectInstrument);
  const popoverRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const anchorId = anchorIdOf(selected);
  const position = useAnchoredPosition(anchorId, popoverRef);

  // Return focus to the chord button whenever the popover closes.
  const lastAnchorId = useRef<string | null>(null);
  useEffect(() => {
    if (anchorId) {
      lastAnchorId.current = anchorId;
      return;
    }
    const previous = lastAnchorId.current;
    lastAnchorId.current = null;
    if (previous) document.getElementById(previous)?.focus({ preventScroll: true });
  }, [anchorId]);

  // Close on Escape and on a click outside the popover.
  useEffect(() => {
    if (!anchorId) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(closeChord());
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (popoverRef.current?.contains(target) || target.closest(KEEP_OPEN_SELECTOR)) return;
      dispatch(closeChord());
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [anchorId, dispatch]);

  if (!selected) return null;

  const chord = parseChord(selected.symbol);
  const tones = spellTriad(chord);
  const voicing = getGuitarVoicing(chord);
  const name = formatChord(selected.symbol);
  const tip =
    instrument === 'piano'
      ? messages.tips.piano
      : diagramWindow(voicing).showNut
        ? messages.tips.guitarOpen
        : messages.tips.guitarBarre;

  const handleInstrumentChange = (value: string) => {
    if (isInstrument(value)) dispatch(setInstrument(value));
  };

  // Runtime-computed coordinates; on narrow screens CSS docks it as a bottom sheet instead.
  const style: CSSProperties | undefined = position.isSheet
    ? undefined
    : ({
        top: position.top,
        left: position.left,
        '--arrow-x': `${position.arrowX}px`,
      } as CSSProperties);

  return (
    <div
      ref={popoverRef}
      id={CHORD_POPOVER_ID}
      className={clsx(styles.popover, position.isSheet ? styles.sheet : styles[position.placement])}
      style={style}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className={styles.close}
        aria-label={messages.close}
        onClick={() => dispatch(closeChord())}
      >
        ×
      </button>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.name}>
          {name}
        </h2>
        <span className={styles.quality}>{messages.qualities[chord.quality]}</span>
      </div>
      <ul className={styles.tones} aria-label={messages.chordTonesLabel}>
        {tones.map((tone) => (
          <li key={tone.degree} className={styles.tone}>
            {tone.name}
            <small className={styles.toneDegree}>{tone.degree}</small>
          </li>
        ))}
      </ul>
      {instrument === 'guitar' ? (
        <GuitarDiagram voicing={voicing} label={messages.guitarDiagramLabel(name)} />
      ) : (
        <PianoDiagram
          highlighted={pianoVoicing(chord).map((offset, index) => ({
            offset,
            name: tones[index]?.name ?? '',
          }))}
          label={messages.pianoDiagramLabel(name)}
        />
      )}
      <div className={styles.row}>
        <SegmentedControl
          label={messages.instrumentLabel}
          options={[
            { value: 'guitar', label: messages.instruments.guitar },
            { value: 'piano', label: messages.instruments.piano },
          ]}
          value={instrument}
          onChange={handleInstrumentChange}
          size="sm"
        />
      </div>
      <p className={styles.tip}>{tip}</p>
    </div>
  );
};

export default ChordPopover;
