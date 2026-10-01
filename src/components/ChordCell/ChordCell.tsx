import clsx from 'clsx';
import type { FC } from 'react';
import { CHORD_POPOVER_ID, chordButtonId } from '../../features/ui/chordButtonId';
import type { SelectedChord } from '../../features/ui/uiSlice';
import type { DegreeId } from '../../lib/music/degrees';
import type { ChordQuality } from '../../lib/music/notes';
import { formatChord } from '../../lib/music/notes';
import styles from './ChordCell.module.css';

interface ChordCellProps {
  symbol: string;
  keyName: string;
  degreeId: DegreeId;
  quality: ChordQuality;
  isOpen: boolean;
  onSelect: (chord: SelectedChord) => void;
}

const QUALITY_CLASS: Readonly<Record<ChordQuality, string | undefined>> = {
  major: styles.major,
  minor: styles.minor,
  diminished: styles.diminished,
};

const ChordCell: FC<ChordCellProps> = ({
  symbol,
  keyName,
  degreeId,
  quality,
  isOpen,
  onSelect,
}) => {
  return (
    <td className={styles.cell}>
      <button
        id={chordButtonId(keyName, degreeId)}
        type="button"
        className={clsx(styles.chord, QUALITY_CLASS[quality], isOpen && styles.open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? CHORD_POPOVER_ID : undefined}
        data-chord={symbol}
        onClick={() => onSelect({ symbol, keyName, degreeId })}
      >
        {formatChord(symbol)}
      </button>
    </td>
  );
};

export default ChordCell;
