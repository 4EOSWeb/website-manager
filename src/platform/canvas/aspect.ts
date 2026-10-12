export type AspectBox = { x: number; y: number; w: number; h: number };
export type AspectCorner = "nw" | "ne" | "sw" | "se";

export type AspectLock = {
  shift: boolean;
  aspect?: number;
  corner: AspectCorner;
};

function ratioOf(box: { w: number; h: number }): number {
  if (!Number.isFinite(box.w) || !Number.isFinite(box.h) || box.h === 0) return 0;
  return box.w / box.h;
}

/** Keeps a resize at the gesture ratio, or at a stored aspect. A free resize is unchanged. */
export function lockAspect(box: AspectBox, start: AspectBox, options: AspectLock): AspectBox {
  const stored = options.aspect;
  const hasStored = typeof stored === "number" && Number.isFinite(stored) && stored > 0;
  if (!options.shift && !hasStored) return { x: box.x, y: box.y, w: box.w, h: box.h };
  const ratio = options.shift ? ratioOf(start) : stored;
  if (!ratio) return { x: box.x, y: box.y, w: box.w, h: box.h };
  const next = { x: box.x, y: box.y, w: box.w, h: box.h };
  const widthLed = Math.abs(box.w - start.w) >= Math.abs(box.h - start.h);
  if (widthLed) next.h = next.w / ratio;
  else next.w = next.h * ratio;
  if (options.corner.includes("w")) next.x = start.x + start.w - next.w;
  if (options.corner.includes("n")) next.y = start.y + start.h - next.h;
  return next;
}

/** True when the new ratio is within 1 percent of the start ratio. */
export function ratioWithin(box: { w: number; h: number }, start: { w: number; h: number }): boolean {
  const startRatio = ratioOf(start);
  const nextRatio = ratioOf(box);
  if (!startRatio || !nextRatio) return false;
  return Math.abs(nextRatio - startRatio) / startRatio <= 0.01;
}
