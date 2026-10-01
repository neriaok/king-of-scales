import { describe, expect, it } from 'vitest';
import { computePosition } from './useAnchoredPosition';

const viewport = { width: 1000, height: 800 };
const popover = { width: 300, height: 400 };

describe('computePosition', () => {
  it('opens centred below the anchor', () => {
    const anchor = { top: 100, bottom: 140, left: 400, width: 60 };
    expect(computePosition(anchor, popover, viewport)).toEqual({
      top: 152,
      left: 280,
      arrowX: 150,
      placement: 'below',
    });
  });

  it('flips above when there is no room below', () => {
    const anchor = { top: 600, bottom: 640, left: 400, width: 60 };
    const result = computePosition(anchor, popover, viewport);
    expect(result.placement).toBe('above');
    expect(result.top).toBe(600 - 400 - 12);
  });

  it('stays below when there is no room above either', () => {
    const anchor = { top: 300, bottom: 340, left: 400, width: 60 };
    expect(computePosition(anchor, popover, viewport).placement).toBe('below');
  });

  it('clamps to the viewport and keeps the arrow on the anchor', () => {
    const nearLeft = computePosition({ top: 0, bottom: 40, left: 0, width: 60 }, popover, viewport);
    expect(nearLeft.left).toBe(12);
    expect(nearLeft.arrowX).toBe(20);

    const nearRight = computePosition(
      { top: 0, bottom: 40, left: 940, width: 60 },
      popover,
      viewport,
    );
    expect(nearRight.left).toBe(1000 - 300 - 12);
    expect(nearRight.arrowX).toBe(280);
  });
});
