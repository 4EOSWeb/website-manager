import { classifyPointerMove } from "../drag/threshold";

export type MarqueeRect = { x: number; y: number; w: number; h: number };

/** A marquee waits until the pointer has moved the drag threshold. */
export function marqueeReady(startX: number, startY: number, x: number, y: number): boolean {
  return classifyPointerMove(startX, startY, x, y) === "drag";
}

/** Empty canvas can start a marquee. A node, a handle, or a text selection cannot. */
export function canStartMarquee(input: { onNode: boolean; onHandle: boolean; textSelected: boolean }): boolean {
  return !input.onNode && !input.onHandle && !input.textSelected;
}

/** The rectangle from the pointer start to its current point. */
export function marqueeBox(startX: number, startY: number, x: number, y: number): MarqueeRect {
  return {
    x: Math.min(startX, x),
    y: Math.min(startY, y),
    w: Math.abs(x - startX),
    h: Math.abs(y - startY),
  };
}

function intersects(a: MarqueeRect, b: MarqueeRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Ids of nodes whose boxes meet the rectangle. */
export function nodesInMarquee<T extends MarqueeRect & { id: string }>(rect: MarqueeRect, nodes: readonly T[]): string[] {
  return nodes.filter((node) => intersects(rect, node)).map((node) => node.id);
}
