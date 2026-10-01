import clsx from 'clsx';
import type { CSSProperties, FC } from 'react';
import { useMemo } from 'react';
import type { SelectedChord } from '../../features/ui/uiSlice';
import {
  closeChord,
  selectChord,
  selectSelectedChord,
  selectVisibleDegrees,
} from '../../features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useMessages } from '../../hooks/useMessages';
import { getDegree } from '../../lib/music/degrees';
import { buildTable } from '../../lib/music/keys';
import { formatChord } from '../../lib/music/notes';
import ChordCell from '../ChordCell';
import styles from './ChordTable.module.css';

const QUALITY_CLASS = {
  major: styles.major,
  minor: styles.minor,
  diminished: styles.diminished,
} as const;

const isSameCell = (a: SelectedChord | null, b: SelectedChord): boolean =>
  a !== null && a.keyName === b.keyName && a.degreeId === b.degreeId;

const ChordTable: FC = () => {
  const dispatch = useAppDispatch();
  const messages = useMessages();
  const visibleDegrees = useAppSelector(selectVisibleDegrees);
  const openChord = useAppSelector(selectSelectedChord);
  const rows = useMemo(() => buildTable(visibleDegrees), [visibleDegrees]);
  const columns = visibleDegrees.map(getDegree);

  const handleSelect = (chord: SelectedChord) => {
    // A second click on the open chord closes the popover.
    dispatch(isSameCell(openChord, chord) ? closeChord() : selectChord(chord));
  };

  // Runtime-computed: the table's minimum width grows with the number of columns.
  const tableStyle = { '--column-count': columns.length } as CSSProperties;

  return (
    <div className={styles.scroller}>
      <table className={styles.table} style={tableStyle}>
        <caption className="visually-hidden">{messages.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.label}>
              {messages.keyColumn}
            </th>
            {columns.map((degree) => {
              const role = messages.roles[degree.id];
              const like = messages.likeChord(formatChord(degree.inC));
              return (
                <th
                  key={degree.id}
                  scope="col"
                  className={clsx(styles.degreeHeader, QUALITY_CLASS[degree.quality])}
                >
                  <span className={styles.degree}>{degree.label}</span>
                  <span className={styles.role}>{role ? `${role} · ${like}` : like}</span>
                </th>
              );
            })}
            <th scope="col" className={styles.label}>
              {messages.capoColumn}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, cells }) => (
            <tr key={key.name}>
              <th scope="row" className={styles.key}>
                {key.displayName}
                {key.isEasy && (
                  <span className={styles.star} title={messages.easyKey}>
                    <span aria-hidden="true">★</span>
                    <span className="visually-hidden">{messages.easyKey}</span>
                  </span>
                )}
              </th>
              {cells.map((cell) => (
                <ChordCell
                  key={cell.degreeId}
                  symbol={cell.chord}
                  keyName={key.name}
                  degreeId={cell.degreeId}
                  quality={getDegree(cell.degreeId).quality}
                  isOpen={isSameCell(openChord, { ...cell, symbol: cell.chord, keyName: key.name })}
                  onSelect={handleSelect}
                />
              ))}
              <td className={styles.capo}>
                {key.capoFromC === 0 ? messages.noCapo : key.capoFromC}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChordTable;
