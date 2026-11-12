/** Pointer pixels inside a parent, as a percentage clamped to 0–100 and rounded to one decimal. */
export function toPercent(px: number, size: number): number {
  if (!Number.isFinite(px) || !Number.isFinite(size) || size <= 0) return 0;
  const clamped = Math.min(100, Math.max(0, (px / size) * 100));
  return Math.round(clamped * 10) / 10;
}

/** A stored percentage back into pixels of the same parent. */
export function toPixel(percent: number, size: number): number {
  if (!Number.isFinite(percent) || !Number.isFinite(size) || size <= 0) return 0;
  const clamped = Math.min(100, Math.max(0, percent));
  return (clamped / 100) * size;
}
