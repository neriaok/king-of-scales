import type { RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/** Viewport width at or below which the popover becomes a bottom sheet. */
export const SHEET_MAX_WIDTH = 560;

const GAP = 12;
const EDGE = 12;
const MIN_TOP = 8;

export type Placement = 'below' | 'above';

export interface AnchoredPosition {
  top: number;
  left: number;
  /** Horizontal position of the arrow inside the popover, in px. */
  arrowX: number;
  placement: Placement;
  /** True on narrow viewports, where CSS docks the popover to the bottom instead. */
  isSheet: boolean;
}

interface Rect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

interface Size {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

/**
 * Centres the popover under the anchor, flips it above when there is no room below and
 * clamps it horizontally to the viewport. Pure, so it can be unit tested.
 */
export const computePosition = (
  anchor: Rect,
  popover: Size,
  viewport: Viewport,
): Omit<AnchoredPosition, 'isSheet'> => {
  const centre = anchor.left + anchor.width / 2;
  const maxLeft = Math.max(EDGE, viewport.width - popover.width - EDGE);
  const left = Math.min(Math.max(centre - popover.width / 2, EDGE), maxLeft);

  let top = anchor.bottom + GAP;
  let placement: Placement = 'below';
  const fitsBelow = top + popover.height <= viewport.height - MIN_TOP;
  const fitsAbove = anchor.top - popover.height - GAP >= MIN_TOP;
  if (!fitsBelow && fitsAbove) {
    top = anchor.top - popover.height - GAP;
    placement = 'above';
  }

  const arrowX = Math.min(Math.max(centre - left, 20), popover.width - 20);
  return { top, left, arrowX, placement };
};

const isNarrow = (): boolean =>
  typeof window.matchMedia === 'function'
    ? window.matchMedia(`(max-width: ${SHEET_MAX_WIDTH}px)`).matches
    : window.innerWidth <= SHEET_MAX_WIDTH;

const INITIAL: AnchoredPosition = {
  top: 0,
  left: 0,
  arrowX: 0,
  placement: 'below',
  isSheet: false,
};

/**
 * Keeps a fixed-position popover anchored to an element, following scroll (including
 * scrolling containers), resizes and changes in the popover's own size.
 */
export const useAnchoredPosition = (
  anchorId: string | null,
  popoverRef: RefObject<HTMLElement | null>,
): AnchoredPosition => {
  const [position, setPosition] = useState<AnchoredPosition>(INITIAL);

  const update = useCallback(() => {
    const popover = popoverRef.current;
    const anchor = anchorId ? document.getElementById(anchorId) : null;
    if (!popover || !anchor) return;
    if (isNarrow()) {
      setPosition((previous) => (previous.isSheet ? previous : { ...previous, isSheet: true }));
      return;
    }
    const next = computePosition(
      anchor.getBoundingClientRect(),
      { width: popover.offsetWidth, height: popover.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
    );
    setPosition((previous) =>
      !previous.isSheet &&
      previous.top === next.top &&
      previous.left === next.left &&
      previous.arrowX === next.arrowX &&
      previous.placement === next.placement
        ? previous
        : { ...next, isSheet: false },
    );
  }, [anchorId, popoverRef]);

  // Measure before paint whenever the anchor changes; size changes are caught below.
  useLayoutEffect(() => {
    update();
  }, [update]);

  useEffect(() => {
    if (!anchorId) return undefined;
    window.addEventListener('resize', update);
    // Capture phase so scrolling inside the table's own container is caught too.
    window.addEventListener('scroll', update, { capture: true, passive: true });

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver === 'function' && popoverRef.current) {
      observer = new ResizeObserver(update);
      observer.observe(popoverRef.current);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, { capture: true });
      observer?.disconnect();
    };
  }, [anchorId, popoverRef, update]);

  return position;
};
