export type GuideBox = { x: number; y: number; w: number; h: number };

export type CenterGuide = {
  vertical: boolean;
  horizontal: boolean;
  box: GuideBox;
};

/** Shows a parent-center guide within 1 percent, and snaps to it unless Alt is held. */
export function centerGuides(box: GuideBox, alt: boolean): CenterGuide {
  const next = { x: box.x, y: box.y, w: box.w, h: box.h };
  const vertical = Math.abs(next.x + next.w / 2 - 50) <= 1;
  const horizontal = Math.abs(next.y + next.h / 2 - 50) <= 1;
  if (!alt && vertical) next.x = 50 - next.w / 2;
  if (!alt && horizontal) next.y = 50 - next.h / 2;
  return { vertical, horizontal, box: next };
}
