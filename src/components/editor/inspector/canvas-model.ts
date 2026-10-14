import type { Placement } from "@/lib/content-schema";
import { CANVAS_ANCHORS, type CanvasAnchor } from "@/platform/canvas/anchor";

export { CANVAS_ANCHORS };
export type { CanvasAnchor };

/** Numeric position fields belong to a canvas parent. */
export function canvasFieldsVisible(parent: string): boolean {
  return parent === "canvas" || parent === "freeform";
}

function percent(value: number): number {
  return Math.round(value * 1000) / 10;
}

/** Box fractions as percentages. */
export function canvasPercents(box: { x: number; y: number; w: number; h: number } | undefined): { x: number; y: number; w: number; h: number } {
  const source = box ?? { x: 0, y: 0, w: 0, h: 0 };
  return { x: percent(source.x), y: percent(source.y), w: percent(source.w), h: percent(source.h) };
}

/** Writes one percentage onto the active breakpoint box. 10 means 10 percent. */
export function writeCanvasPercent(box: Placement, key: "x" | "y" | "w" | "h", raw: string): Placement | null {
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  const fraction = Math.min(100, Math.max(0, value)) / 100;
  return { ...box, [key]: fraction };
}
