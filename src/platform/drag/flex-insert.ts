import { dropCompatibility } from "./compatibility";
import { flowInsert } from "./flow-insert";

export type FlexDirection = "row" | "column";

type TreeNode = { id?: unknown; children?: unknown; layout?: unknown; locked?: { locked?: boolean } };

/** A row draws a vertical line. A column draws a horizontal line. */
export function flexInsertionLine(direction: FlexDirection): "vertical" | "horizontal" {
  return direction === "row" ? "vertical" : "horizontal";
}

/** The insertion index from the pointer. Row reads x. Column reads y. */
export function flexIndexFromPointer(direction: FlexDirection, pointer: number, edges: { start: number; end: number }[]): number {
  if (edges.length === 0) return 0;
  let nearest = 0;
  let best = Infinity;
  edges.forEach((edge, index) => {
    const mid = (edge.start + edge.end) / 2;
    const distance = Math.abs(pointer - mid);
    if (distance < best) {
      best = distance;
      nearest = index;
    }
  });
  const mid = (edges[nearest].start + edges[nearest].end) / 2;
  return pointer >= mid ? nearest + 1 : nearest;
}

function pagesOf(document: unknown): TreeNode[] {
  if (!document || typeof document !== "object") return [];
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return [];
  return pages.flatMap((page) => {
    if (!page || typeof page !== "object") return [];
    const root = (page as { root?: TreeNode }).root;
    return root ? [root] : [];
  });
}

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    if (!child || typeof child !== "object") continue;
    const found = findNode(child as TreeNode, id);
    if (found) return found;
  }
  return null;
}

function layoutOf(document: unknown, parentId: string): unknown {
  for (const root of pagesOf(document)) {
    const node = findNode(root, parentId);
    if (node) return node.layout ?? null;
  }
  return null;
}

/**
 * Reorders a child inside a flex parent. Flex settings stay as they were.
 * A locked or incompatible child is not moved.
 */
export function flexInsert(
  document: unknown,
  input: {
    parentId: string;
    index: number;
    nodeId: string;
    draggedLocked: boolean;
    childType: string;
    childParents: { allowedParents: readonly string[] };
    parentType: string;
    parentChildren: { acceptsChildren: boolean; allowedChildren?: readonly string[] };
  },
): { ok: true; document: unknown } | { ok: false; reason: "locked" | "parent_rejected" } {
  const reason = dropCompatibility({
    draggedLocked: input.draggedLocked,
    childType: input.childType,
    childParents: input.childParents,
    parentType: input.parentType,
    parentChildren: input.parentChildren,
  });
  if (reason !== "ok") return { ok: false, reason };
  const before = layoutOf(document, input.parentId);
  const next = flowInsert(document, { parentId: input.parentId, index: input.index, nodeId: input.nodeId });
  if (!next) return { ok: false, reason: "parent_rejected" };
  if (JSON.stringify(layoutOf(next, input.parentId)) !== JSON.stringify(before)) return { ok: false, reason: "parent_rejected" };
  return { ok: true, document: next };
}
