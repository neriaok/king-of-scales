import type { DegreeId } from '../../lib/music/degrees';

/** DOM id of a chord button, so the popover can anchor to the clicked cell. */
export const chordButtonId = (keyName: string, degreeId: DegreeId): string =>
  `chord-${keyName.replace('#', 's')}-${degreeId}`;
