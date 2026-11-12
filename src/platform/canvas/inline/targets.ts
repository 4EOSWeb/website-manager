// Inlined into the preview script with Function.prototype.toString. Keep every function self-contained.

export type Gap = { index: number; center: number };
export type Rect = { top: number; left: number; width: number; height: number };
export type Box = { x: number; y: number; w: number; h: number };

/** The gap nearest the pointer, or null when dropping there would not move the section. */
export function sectionDropIndex(pointerY: number, gaps: Gap[], from: number): number | null {
  let best: Gap | null = null;
  for (const gap of gaps) {
    if (!best || Math.abs(pointerY - gap.center) < Math.abs(pointerY - best.center)) best = gap;
  }
  if (!best || best.index === from || best.index === from + 1) return null;
  return best.index;
}

/** Where a dragged sibling would be inserted, as an index into the original list (0..rects.length). */
export function insertionIndex(x: number, y: number, rects: Rect[]): { index: number; horizontal: boolean } {
  if (rects.length === 0) return { index: 0, horizontal: false };
  let nearest = 0;
  let distance = Infinity;
  rects.forEach((rect, index) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    if (d < distance) {
      distance = d;
      nearest = index;
    }
  });
  const rect = rects[nearest];
  const sameRow = rects.some(
    (other, index) => index !== nearest && Math.abs(other.top - rect.top) < Math.min(other.height, rect.height) / 2,
  );
  const before = sameRow ? x < rect.left + rect.width / 2 : y < rect.top + rect.height / 2;
  return { index: before ? nearest : nearest + 1, horizontal: sameRow };
}

/** Snap a box (shares of its zone) to the zone edges, centre lines, and the edges of other items. */
export function snapBox(box: Box, others: Box[], zoneWidth: number, zoneHeight: number, pixels: number): { box: Box; guidesX: number[]; guidesY: number[] } {
  const next = { x: box.x, y: box.y, w: box.w, h: box.h };
  const tx = pixels / Math.max(1, zoneWidth);
  const ty = pixels / Math.max(1, zoneHeight);
  const xs = [0, 0.5, 1];
  const ys = [0, 0.5, 1];
  for (const other of others) {
    xs.push(other.x, other.x + other.w / 2, other.x + other.w);
    ys.push(other.y, other.y + other.h / 2, other.y + other.h);
  }
  const guidesX: number[] = [];
  const guidesY: number[] = [];
  let bestX = tx;
  let bestY = ty;
  let shiftX = 0;
  let shiftY = 0;
  for (const line of xs) {
    for (const edge of [next.x, next.x + next.w / 2, next.x + next.w]) {
      const d = Math.abs(edge - line);
      if (d < bestX) {
        bestX = d;
        shiftX = line - edge;
        guidesX.length = 0;
        guidesX.push(line);
      }
    }
  }
  for (const line of ys) {
    for (const edge of [next.y, next.y + next.h / 2, next.y + next.h]) {
      const d = Math.abs(edge - line);
      if (d < bestY) {
        bestY = d;
        shiftY = line - edge;
        guidesY.length = 0;
        guidesY.push(line);
      }
    }
  }
  next.x = Math.max(0, Math.min(1 - next.w, next.x + shiftX));
  next.y = Math.max(0, Math.min(1 - next.h, next.y + shiftY));
  return { box: next, guidesX, guidesY };
}

export function nudgeBox(box: Box, dx: number, dy: number): Box {
  return {
    x: Math.max(0, Math.min(1 - box.w, box.x + dx)),
    y: Math.max(0, Math.min(1 - box.h, box.y + dy)),
    w: box.w,
    h: box.h,
  };
}
