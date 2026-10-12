import { canResize } from "../registry/capabilities";

/** Four corners. Edge handles can wait until a node has more room. */
export const CORNER_HANDLES = ["nw", "ne", "sw", "se"] as const;

export type CornerHandle = (typeof CORNER_HANDLES)[number];

export type CanvasBox = { x: number; y: number; w: number; h: number };

type ResizeDefinition = { capabilities: Readonly<Record<string, boolean>> };
type ResizeNode = { locked: { locked: boolean } };
type ResizeParent = { mode: string };

/** Handles for an unlocked resizable node on a canvas. Everyone else gets none. */
export function resizeHandles(definition: ResizeDefinition, node: ResizeNode, parent: ResizeParent): readonly CornerHandle[] {
  if (!canResize(definition, node, parent)) return [];
  return CORNER_HANDLES;
}

/** Moves one corner so width and height both change. */
export function resizeCorner(box: CanvasBox, corner: CornerHandle, delta: { x: number; y: number }): CanvasBox {
  const left = corner.includes("w");
  const top = corner.includes("n");
  const next = { x: box.x, y: box.y, w: box.w, h: box.h };
  next.w = box.w + (left ? -delta.x : delta.x);
  next.h = box.h + (top ? -delta.y : delta.y);
  if (left) next.x = box.x + box.w - next.w;
  if (top) next.y = box.y + box.h - next.h;
  return next;
}

export type ResizePointer = {
  definition: ResizeDefinition;
  node: ResizeNode;
  parent: ResizeParent;
  box: CanvasBox;
  corner: CornerHandle;
  delta: { x: number; y: number };
  selectionCollapsed: boolean;
  selectionInsideNode: boolean;
};

/** A text selection inside the node does not resize. A handle on a resizable image does. */
export function resizeFromHandle(input: ResizePointer): CanvasBox | null {
  if (!input.selectionCollapsed && input.selectionInsideNode) return null;
  if (!resizeHandles(input.definition, input.node, input.parent).includes(input.corner)) return null;
  return resizeCorner(input.box, input.corner, input.delta);
}
