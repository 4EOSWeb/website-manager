export type SnapBox = { x: number; y: number; w: number; h: number };

/** Rounds one percentage to the snap interval. Alt returns the raw value. */
export function snapAxis(value: number, interval: number, alt: boolean): number {
  if (alt || !Number.isFinite(value)) return value;
  if (!Number.isFinite(interval) || interval <= 0) return value;
  let snapped = Math.round(value / interval) * interval;
  if (snapped < 0) snapped = 0;
  if (snapped > 100) snapped = Math.floor(100 / interval) * interval;
  return snapped;
}

/** Snaps a canvas box. The input box is left unchanged. */
export function snapCanvasBox(box: SnapBox, interval: number, alt: boolean): SnapBox {
  if (alt) return { x: box.x, y: box.y, w: box.w, h: box.h };
  return {
    x: snapAxis(box.x, interval, false),
    y: snapAxis(box.y, interval, false),
    w: snapAxis(box.w, interval, false),
    h: snapAxis(box.h, interval, false),
  };
}
