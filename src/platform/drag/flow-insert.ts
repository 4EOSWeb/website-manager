type TreeNode = { id?: unknown; children?: unknown; metadata?: { legacyId?: unknown } };

export type FlowDirection = "vertical" | "horizontal";

/** A vertical flow draws a horizontal line. A horizontal flow draws a vertical line. */
export function flowInsertionLine(direction: FlowDirection): "horizontal" | "vertical" {
  return direction === "horizontal" ? "vertical" : "horizontal";
}

function matches(node: TreeNode, id: string): boolean {
  if (node.id === id) return true;
  const legacy = node.metadata?.legacyId;
  return legacy === id || (typeof legacy === "string" && legacy.endsWith(`/${id}`));
}

function findParent(node: TreeNode, id: string): { parent: TreeNode; index: number } | null {
  const children = Array.isArray(node.children) ? node.children : [];
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!child || typeof child !== "object") continue;
    const record = child as TreeNode;
    if (matches(record, id)) return { parent: node, index };
    const nested = findParent(record, id);
    if (nested) return nested;
  }
  return null;
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

/**
 * Inserts a new node, or moves an existing one, to an index in a flow parent.
 * The index is the position after an existing node has been removed.
 */
export function flowInsert(
  document: unknown,
  input: { parentId: string; index: number; nodeId?: string; node?: unknown },
): unknown | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document);
  const roots = pagesOf(copy);
  let parent: TreeNode | null = null;
  for (const root of roots) {
    if (matches(root, input.parentId)) {
      parent = root;
      break;
    }
    const found = findParent(root, input.parentId);
    parent = found ? (Array.isArray(found.parent.children) ? (found.parent.children[found.index] as TreeNode) : null) : null;
    if (parent) break;
  }
  if (!parent || !Array.isArray(parent.children)) return null;

  let moving: unknown = input.node;
  if (input.nodeId) {
    let located: { parent: TreeNode; index: number } | null = null;
    for (const root of roots) {
      located = findParent(root, input.nodeId);
      if (located) break;
    }
    if (!located || !Array.isArray(located.parent.children)) return null;
    const [removed] = located.parent.children.splice(located.index, 1);
    moving = removed;
  }
  if (!moving || typeof moving !== "object") return null;
  const index = Math.max(0, Math.min(Math.trunc(input.index), parent.children.length));
  parent.children.splice(index, 0, moving);
  if (input.nodeId && JSON.stringify(copy) === JSON.stringify(document)) return null;
  return copy;
}

/** Same-parent reorder used by the existing block reorder message. */
export function flowReorder(document: unknown, nodeId: string, targetId: string, after: boolean): unknown | null {
  if (!document || typeof document !== "object" || !nodeId || !targetId || nodeId === targetId) return null;
  const roots = pagesOf(document);
  let moving: { parent: TreeNode; index: number } | null = null;
  let target: { parent: TreeNode; index: number } | null = null;
  for (const root of roots) {
    moving = moving ?? findParent(root, nodeId);
    target = target ?? findParent(root, targetId);
  }
  if (!moving || !target || moving.parent !== target.parent) return null;
  const siblings = (Array.isArray(moving.parent.children) ? moving.parent.children : []).filter((child) => {
    if (!child || typeof child !== "object") return true;
    return !matches(child as TreeNode, nodeId);
  });
  const targetIndex = siblings.findIndex((child) => child && typeof child === "object" && matches(child as TreeNode, targetId));
  if (targetIndex < 0) return null;
  const parentId = typeof moving.parent.id === "string" ? moving.parent.id : "";
  if (!parentId) return null;
  return flowInsert(document, { parentId, index: after ? targetIndex + 1 : targetIndex, nodeId });
}
