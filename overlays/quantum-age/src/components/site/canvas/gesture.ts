// Every function in this folder is inlined into the preview script with Function.prototype.toString,
// so each one must be self-contained: no imports, no calls to other module-level functions.

export type PressTarget = {
  editing: boolean;
  insideEditingField: boolean;
  onControl: boolean;
  onGrip: boolean;
  onResizeHandle: boolean;
  onFreeformItem: boolean;
  locked: boolean;
};

export type PressIntent = "none" | "grip" | "resize" | "freeform" | "text";

export function pressIntent(target: PressTarget): PressIntent {
  if (target.insideEditingField) return "text";
  if (target.onGrip) return target.locked ? "none" : "grip";
  if (target.onResizeHandle) return target.locked || target.editing ? "none" : "resize";
  if (target.onControl) return "none";
  if (target.onFreeformItem && !target.locked && !target.editing) return "freeform";
  return "text";
}

export function passedThreshold(startX: number, startY: number, x: number, y: number, threshold: number): boolean {
  const dx = x - startX;
  const dy = y - startY;
  return dx * dx + dy * dy > threshold * threshold;
}

export function autoScrollStep(pointerY: number, viewportHeight: number, edge: number, maxStep: number): number {
  if (pointerY < edge) return -Math.ceil(((edge - Math.max(0, pointerY)) / edge) * maxStep);
  if (pointerY > viewportHeight - edge) return Math.ceil(((pointerY - (viewportHeight - edge)) / edge) * maxStep);
  return 0;
}
