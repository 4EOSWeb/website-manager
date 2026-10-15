import { flowInsert } from "./flow-insert";

type TreeNode = { id?: unknown; children?: unknown; layout?: { columns?: unknown } };

/** The cell under the pointer. Column count decides how x wraps. */
export function gridCellIndex(
  columns: number,
  pointer: { x: number; y: number },
  origin: { x: number; y: number },
  cell: { width: number; height: number },
): number {
  const width = Math.max(1, cell.width);
  const height = Math.max(1, cell.height);
  const count = Math.max(1, Math.trunc(columns));
  const col = Math.max(0, Math.min(count - 1, Math.floor((pointer.x - origin.x) / width)));
  const row = Math.max(0, Math.floor((pointer.y - origin.y) / height));
  return row * count + col;
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

function columnCount(document: unknown, parentId: string): number | null {
  for (const root of pagesOf(document)) {
    const node = findNode(root, parentId);
    if (!node) continue;
    const columns = node.layout?.columns;
    return typeof columns === "number" ? columns : null;
  }
  return null;
}

/**
 * Moves a node into a grid cell. The parent's column count stays the same.
 * The cell index is the child's index after the drop.
 */
export function gridInsert(document: unknown, input: { parentId: string; nodeId: string; cell: number }): unknown | null {
  const columns = columnCount(document, input.parentId);
  const next = flowInsert(document, { parentId: input.parentId, index: input.cell, nodeId: input.nodeId });
  if (!next) return null;
  if (columnCount(next, input.parentId) !== columns) return null;
  return next;
}
