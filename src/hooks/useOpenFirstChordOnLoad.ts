import { useEffect, useRef } from 'react';
import { selectChord, selectSelectedChord, selectVisibleDegrees } from '../features/ui/uiSlice';
import { buildTable } from '../lib/music/keys';
import { useAppDispatch, useAppSelector } from './useAppDispatch';

/** Opens the popover on the table's first chord once, as an example of what a tap does. */
export const useOpenFirstChordOnLoad = (): void => {
  const dispatch = useAppDispatch();
  const visibleDegrees = useAppSelector(selectVisibleDegrees);
  const selected = useAppSelector(selectSelectedChord);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (selected) return;
    const [firstRow] = buildTable(visibleDegrees, 'given');
    const firstCell = firstRow?.cells[0];
    if (!firstRow || !firstCell) return;
    dispatch(
      selectChord({
        symbol: firstCell.chord,
        keyName: firstRow.key.name,
        degreeId: firstCell.degreeId,
      }),
    );
  }, [dispatch, selected, visibleDegrees]);
};
