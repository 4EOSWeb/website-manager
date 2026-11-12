/** Default canvas floor, as a percentage of the parent. */
export const DEFAULT_MIN_PERCENT = 2;

export type MinSizeDefinition = {
  minWidth?: number;
  minHeight?: number;
};

export type MinBox = { x: number; y: number; w: number; h: number };

function floorOf(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return fallback;
  return value;
}

/** Width and height floors. A definition overrides the 2 percent default. */
export function minimumSize(definition?: MinSizeDefinition): { width: number; height: number } {
  return {
    width: floorOf(definition?.minWidth, DEFAULT_MIN_PERCENT),
    height: floorOf(definition?.minHeight, DEFAULT_MIN_PERCENT),
  };
}

/**
 * Raises a box that is below its floor.
 * A west or north handle keeps the opposite edge in place.
 */
export function enforceMinSize(box: MinBox, definition?: MinSizeDefinition, corner?: "nw" | "ne" | "sw" | "se"): MinBox {
  const min = minimumSize(definition);
  const next = { x: box.x, y: box.y, w: box.w, h: box.h };
  const left = corner?.includes("w") === true;
  const top = corner?.includes("n") === true;
  if (!Number.isFinite(next.w) || next.w < min.width) {
    if (left) next.x = next.x + next.w - min.width;
    next.w = min.width;
  }
  if (!Number.isFinite(next.h) || next.h < min.height) {
    if (top) next.y = next.y + next.h - min.height;
    next.h = min.height;
  }
  return next;
}
