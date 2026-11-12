export type SiblingBox = { x: number; y: number; w: number; h: number; hidden?: boolean };

export type SiblingGuide = { axis: "x" | "y"; at: number };

const edges = (box: SiblingBox, axis: "x" | "y") => {
  if (axis === "x") return [box.x, box.x + box.w / 2, box.x + box.w];
  return [box.y, box.y + box.h / 2, box.y + box.h];
};

/** Guides where a node lines up with a visible sibling, within 1 percent. */
export function siblingGuides(box: SiblingBox, siblings: SiblingBox[]): { guides: SiblingGuide[]; box: SiblingBox } {
  const guides: SiblingGuide[] = [];
  const next = { x: box.x, y: box.y, w: box.w, h: box.h };
  for (const other of siblings) {
    if (other.hidden) continue;
    for (const axis of ["x", "y"] as const) {
      for (const self of edges(box, axis)) {
        for (const there of edges(other, axis)) {
          if (Math.abs(self - there) > 1) continue;
          if (!guides.some((guide) => guide.axis === axis && Math.abs(guide.at - there) < 0.001)) {
            guides.push({ axis, at: there });
          }
        }
      }
    }
  }
  return { guides, box: next };
}
