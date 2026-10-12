import { applyAnchor, CANVAS_ANCHORS, type CanvasAnchor } from "../canvas/anchor";
import { lockAspect } from "../canvas/aspect";
import { enforceMaxSize } from "../canvas/max-size";
import { enforceMinSize } from "../canvas/min-size";
import { toPercent } from "../canvas/percent";

type TreeNode = {
  id?: unknown;
  children?: unknown;
  box?: unknown;
  responsive?: Record<string, unknown>;
  metadata?: { legacyId?: unknown };
};

export type CanvasBreakpoint = "desktop" | "tablet" | "mobile";

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Pointer position as a percentage of the canvas parent, not the browser window. */
export function canvasPoint(
  pointer: { x: number; y: number },
  parent: { x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  const width = parent.width || 1;
  const height = parent.height || 1;
  return {
    x: toPercent(pointer.x - parent.x, width),
    y: toPercent(pointer.y - parent.y, height),
  };
}

function matches(node: TreeNode, id: string): boolean {
  if (node.id === id) return true;
  const legacy = node.metadata?.legacyId;
  return legacy === id || (typeof legacy === "string" && legacy.endsWith(`/${id}`));
}

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (matches(node, id)) return node;
  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    if (!child || typeof child !== "object") continue;
    const found = findNode(child as TreeNode, id);
    if (found) return found;
  }
  return null;
}

function locate(document: unknown, nodeId: string): TreeNode | null {
  if (!document || typeof document !== "object") return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const root = (page as { root?: TreeNode }).root;
    if (!root) continue;
    const found = findNode(root, nodeId);
    if (found) return found;
  }
  return null;
}

/**
 * Writes the node box for one breakpoint. Values are parent percentages from 0 to 100.
 * This step does not snap.
 */
export function placeOnCanvas(
  document: unknown,
  input: { nodeId: string; breakpoint: CanvasBreakpoint; x: number; y: number; w: number; h: number },
): unknown | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document);
  const node = locate(copy, input.nodeId);
  if (!node) return null;
  const previous = node.box && typeof node.box === "object" ? node.box as { aspect?: unknown; anchor?: unknown } : null;
  const aspect = typeof previous?.aspect === "number" && Number.isFinite(previous.aspect) && previous.aspect > 0 ? previous.aspect : undefined;
  const anchor = typeof previous?.anchor === "string" && CANVAS_ANCHORS.includes(previous.anchor as CanvasAnchor) ? previous.anchor as CanvasAnchor : undefined;
  const proposed = { x: input.x, y: input.y, w: input.w, h: input.h };
  const locked = lockAspect(proposed, { ...proposed, h: aspect ? proposed.w / aspect : proposed.h }, { shift: false, aspect, corner: "se" });
  const limited = enforceMaxSize(enforceMinSize(locked));
  const anchored = applyAnchor({ ...limited, ...(anchor ? { anchor } : {}) }, { width: 100, height: 100 }, { width: 100, height: 100 });
  const box = {
    x: clampPercent(anchored.x),
    y: clampPercent(anchored.y),
    w: clampPercent(anchored.w),
    h: clampPercent(anchored.h),
    ...(aspect ? { aspect } : {}),
    ...(anchor ? { anchor } : {}),
  };
  if (input.breakpoint === "tablet" || input.breakpoint === "mobile") {
    const responsive = node.responsive && typeof node.responsive === "object" ? { ...node.responsive } : {};
    const current = responsive[input.breakpoint];
    const previous = current && typeof current === "object" ? { ...(current as Record<string, unknown>) } : {};
    previous.box = box;
    responsive[input.breakpoint] = previous;
    node.responsive = responsive;
  } else {
    node.box = box;
  }
  return copy;
}
