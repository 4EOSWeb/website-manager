import type { MinBox } from "./min-size";

/** Default canvas ceiling, as a percentage of the parent. */
export const DEFAULT_MAX_PERCENT = 100;

export type MaxSizeDefinition = {
  maxWidth?: number;
  maxHeight?: number;
};

function capOf(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return DEFAULT_MAX_PERCENT;
  return Math.min(DEFAULT_MAX_PERCENT, value);
}

/**
 * Keeps a box inside its parent.
 * Width cannot pass 100, and x plus w cannot pass 100.
 */
export function enforceMaxSize(box: MinBox, definition?: MaxSizeDefinition): MinBox {
  const next = { x: box.x, y: box.y, w: box.w, h: box.h };
  if (!Number.isFinite(next.x) || next.x < 0) next.x = 0;
  if (!Number.isFinite(next.y) || next.y < 0) next.y = 0;
  if (next.x > DEFAULT_MAX_PERCENT) next.x = DEFAULT_MAX_PERCENT;
  if (next.y > DEFAULT_MAX_PERCENT) next.y = DEFAULT_MAX_PERCENT;
  const roomW = Math.max(0, DEFAULT_MAX_PERCENT - next.x);
  const roomH = Math.max(0, DEFAULT_MAX_PERCENT - next.y);
  next.w = Math.min(Number.isFinite(next.w) ? next.w : 0, capOf(definition?.maxWidth), roomW);
  next.h = Math.min(Number.isFinite(next.h) ? next.h : 0, capOf(definition?.maxHeight), roomH);
  return next;
}
