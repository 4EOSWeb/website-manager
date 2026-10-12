export type OverlapBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  locked?: boolean;
  hidden?: boolean;
};

const overlapMessage = "These items overlap.";

function intersection(a: OverlapBox, b: OverlapBox) {
  return {
    x: Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
    y: Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y),
  };
}

/** True when the shared area is greater than 1 percent on both axes. */
export function boxesOverlap(a: OverlapBox, b: OverlapBox): boolean {
  const hit = intersection(a, b);
  return hit.x > 1 && hit.y > 1;
}

/** A warning for two unlocked canvas nodes. The boxes are not moved. */
export function overlapWarning(node: OverlapBox, siblings: readonly OverlapBox[]): string | null {
  if (node.locked || node.hidden) return null;
  const hit = siblings.some((other) => !other.locked && !other.hidden && boxesOverlap(node, other));
  return hit ? overlapMessage : null;
}
