export const DRAG_THRESHOLD_PX = 4;

/** Movement under 4 pixels stays a click. 4 pixels or more can start a drag. */
export function classifyPointerMove(startX: number, startY: number, x: number, y: number): "click" | "drag" {
  const dx = x - startX;
  const dy = y - startY;
  return Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX ? "drag" : "click";
}
