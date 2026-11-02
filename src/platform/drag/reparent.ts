import { dropCompatibility } from "./compatibility";

type TreeNode = {
  id?: unknown;
  type?: unknown;
  children?: unknown;
  locked?: { locked?: boolean };
  metadata?: { legacyId?: unknown };
};

export type ReparentInput = {
  nodeId: string;
  parentId: string;
  targetId?: string;
  after?: boolean;
  draggedLocked: boolean;
  childType: string;
  childParents: { allowedParents: readonly string[] };
  parentType: string;
  parentChildren: { acceptsChildren: boolean; allowedChildren?: readonly string[] };
};

function matches(node: TreeNode, id: string): boolean {
  if (node.id === id) return true;
  const legacy = node.metadata?.legacyId;
  return legacy === id || (typeof legacy === "string" && legacy.endsWith(`/${id}`));
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

function countNodes(node: TreeNode, id: string): number {
  const children = Array.isArray(node.children) ? node.children : [];
  return children.reduce((total, child) => {
    if (!child || typeof child !== "object") return total;
    const record = child as TreeNode;
    return total + (matches(record, id) ? 1 : 0) + countNodes(record, id);
  }, 0);
}

/** Parent id and index of a node, used to check that one undo restored the drop. */
export function nodeSlot(document: unknown, nodeId: string): { parentId: string; index: number } | null {
  for (const root of pagesOf(document)) {
    const located = findParent(root, nodeId);
    if (located && typeof located.parent.id === "string") return { parentId: located.parent.id, index: located.index };
  }
  return null;
}

/**
 * Moves a node from its current parent into a different parent.
 * The same parent is left untouched so a flow reorder can handle that drop.
 * A locked or incompatible node stays where it is.
 */
export function reparent(
  document: unknown,
  input: ReparentInput,
): { ok: true; document: unknown } | { ok: false; reason: "locked" | "parent_rejected" } | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document);
  const roots = pagesOf(copy);
  let located: { parent: TreeNode; index: number } | null = null;
  for (const root of roots) {
    located = findParent(root, input.nodeId);
    if (located) break;
  }
  if (!located || !Array.isArray(located.parent.children)) return null;
  const moving = located.parent.children[located.index] as TreeNode;
  let target: TreeNode | null = null;
  for (const root of roots) {
    if (matches(root, input.parentId)) {
      target = root;
      break;
    }
    const found = findParent(root, input.parentId);
    if (found && Array.isArray(found.parent.children)) {
      target = found.parent.children[found.index] as TreeNode;
      break;
    }
  }
  if (!target || !Array.isArray(target.children)) return null;
  if (target === located.parent) return null;
  if (moving === target || findNode(moving, input.parentId)) return { ok: false, reason: "parent_rejected" };
  const reason = dropCompatibility({
    draggedLocked: input.draggedLocked || moving.locked?.locked === true,
    childType: input.childType,
    childParents: input.childParents,
    parentType: input.parentType,
    parentChildren: input.parentChildren,
  });
  if (reason !== "ok") return { ok: false, reason };
  const targetIndex = input.targetId ? target.children.findIndex((child) => child && typeof child === "object" && matches(child as TreeNode, input.targetId ?? "")) : -1;
  const index = targetIndex < 0 ? target.children.length : input.after ? targetIndex + 1 : targetIndex;
  const [removed] = located.parent.children.splice(located.index, 1);
  target.children.splice(Math.max(0, Math.min(index, target.children.length)), 0, removed);
  const copies = roots.reduce((total, root) => total + countNodes(root, input.nodeId), 0);
  if (copies !== 1) return { ok: false, reason: "parent_rejected" };
  return { ok: true, document: copy };
}
