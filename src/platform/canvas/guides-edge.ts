export type EdgeBox = { x: number; y: number; w: number; h: number };

export type EdgeGuide = {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
  box: EdgeBox;
};

/** Guides at 0 and 100 when an edge is within 1 percent. Alt does not snap. */
export function edgeGuides(box: EdgeBox, alt: boolean): EdgeGuide {
  const next = { x: box.x, y: box.y, w: box.w, h: box.h };
  const left = Math.abs(next.x) <= 1;
  const right = Math.abs(next.x + next.w - 100) <= 1;
  const top = Math.abs(next.y) <= 1;
  const bottom = Math.abs(next.y + next.h - 100) <= 1;
  if (!alt) {
    if (left) next.x = 0;
    else if (right) next.x = 100 - next.w;
    if (top) next.y = 0;
    else if (bottom) next.y = 100 - next.h;
  }
  return { left, right, top, bottom, box: next };
}
