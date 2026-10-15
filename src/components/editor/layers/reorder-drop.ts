import { flowReorder } from "@/platform/drag/flow-insert";

/** A rename field, or a row control, does not start a layer drag. */
export function layerDragAllowed(target: unknown): boolean {
  if (!target || typeof target !== "object" || !("closest" in target)) return false;
  const element = target as { closest?: (selector: string) => unknown };
  if (typeof element.closest !== "function") return false;
  if (element.closest("input, textarea, select, [contenteditable='true']")) return false;
  if (element.closest(".ed-icon, [data-layer-toggle]")) return false;
  return Boolean(element.closest("[data-layer-id]"));
}

/** The lower half of a row inserts after that sibling. */
export function dropIsAfter(clientY: number, top: number, height: number): boolean {
  return clientY >= top + height / 2;
}

/**
 * The sibling a section should move in front of.
 * An empty string means the end of the list. Null means the drop is not a sibling move.
 */
export function siblingBeforeId(ids: string[], movingId: string, targetId: string, after: boolean): string | null {
  if (!movingId || !targetId || movingId === targetId) return null;
  if (!ids.includes(movingId) || !ids.includes(targetId)) return null;
  if (!after) return targetId;
  return ids[ids.indexOf(targetId) + 1] ?? "";
}

/**
 * Reorders children of one parent. Canvas parents change child order.
 * `box.z` stays where the canvas commands left it.
 */
export function reorderLayerSiblings(document: unknown, nodeId: string, targetId: string, after: boolean): unknown | null {
  return flowReorder(document, nodeId, targetId, after);
}
