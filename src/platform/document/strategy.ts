export type CanvasPercentages = { x: number; y: number; w: number; h: number };

/** Scale keeps parent percentages. It does not convert them to viewport pixels. */
export function resolveScale(box: CanvasPercentages): CanvasPercentages {
  return { x: box.x, y: box.y, w: box.w, h: box.h };
}
