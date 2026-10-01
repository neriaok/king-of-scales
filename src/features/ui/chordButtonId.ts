import type { DegreeId } from '../../lib/music/degrees';

/** DOM id of a chord button, so the popover can anchor to the clicked cell. */
export const chordButtonId = (keyName: string, degreeId: DegreeId): string =>
  `chord-${keyName.replace('#', 's')}-${degreeId}`;

/** DOM id of the chord popover, referenced by the open chord button's aria-controls. */
export const CHORD_POPOVER_ID = 'chord-popover';
