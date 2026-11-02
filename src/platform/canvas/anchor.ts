export const CANVAS_ANCHORS = [
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
] as const;

export type CanvasAnchor = (typeof CANVAS_ANCHORS)[number];

export type AnchoredBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  anchor?: CanvasAnchor;
};

export type ParentSize = { width: number; height: number };

function known(anchor: string | undefined): CanvasAnchor {
  return CANVAS_ANCHORS.includes(anchor as CanvasAnchor) ? anchor as CanvasAnchor : "top-left";
}

function axis(anchor: CanvasAnchor): { x: "left" | "center" | "right"; y: "top" | "center" | "bottom" } {
  if (anchor === "center") return { x: "center", y: "center" };
  if (anchor === "top") return { x: "center", y: "top" };
  if (anchor === "bottom") return { x: "center", y: "bottom" };
  if (anchor === "left") return { x: "left", y: "center" };
  if (anchor === "right") return { x: "right", y: "center" };
  if (anchor === "top-right") return { x: "right", y: "top" };
  if (anchor === "bottom-left") return { x: "left", y: "bottom" };
  if (anchor === "bottom-right") return { x: "right", y: "bottom" };
  return { x: "left", y: "top" };
}

/** The anchored point, as a percentage of the parent. */
export function anchorPoint(box: AnchoredBox): { x: number; y: number } {
  const place = axis(known(box.anchor));
  const x = place.x === "right" ? box.x + box.w : place.x === "center" ? box.x + box.w / 2 : box.x;
  const y = place.y === "bottom" ? box.y + box.h : place.y === "center" ? box.y + box.h / 2 : box.y;
  return { x, y };
}

/**
 * Keeps the anchored percentage when the parent size changes.
 * The result stays in percentages of the parent.
 */
export function applyAnchor<T extends AnchoredBox>(box: T, from: ParentSize, to: ParentSize): T {
  const anchor = known(box.anchor);
  const point = anchorPoint({ ...box, anchor });
  if (!(from.width > 0) || !(from.height > 0) || !(to.width > 0) || !(to.height > 0)) {
    return { ...box, anchor };
  }
  const place = axis(anchor);
  const x = place.x === "right" ? point.x - box.w : place.x === "center" ? point.x - box.w / 2 : point.x;
  const y = place.y === "bottom" ? point.y - box.h : place.y === "center" ? point.y - box.h / 2 : point.y;
  return { ...box, x, y, anchor };
}
