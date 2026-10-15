import { reparent, type ReparentInput } from "./reparent";

type TreeNode = {
  id?: unknown;
  type?: unknown;
  children?: unknown;
  locked?: { locked?: boolean };
  metadata?: { legacyId?: unknown };
};

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

function locate(document: unknown, id: string): { parent: TreeNode; index: number } | null {
  if (!document || typeof document !== "object") return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const root = (page as { root?: TreeNode }).root;
    if (!root) continue;
    const found = findParent(root, id);
    if (found) return found;
  }
  return null;
}

/**
 * Drags a child out of a group. The group stays, even when it becomes empty.
 * A locked child does not leave. Other parents are left for reparent.
 */
export function groupExit(
  document: unknown,
  input: ReparentInput,
): { ok: true; document: unknown } | { ok: false; reason: "locked" | "parent_rejected" } | null {
  const located = locate(document, input.nodeId);
  if (!located || located.parent.type !== "group" || !Array.isArray(located.parent.children)) return null;
  const moving = located.parent.children[located.index] as TreeNode;
  if (input.draggedLocked || moving.locked?.locked === true) return { ok: false, reason: "locked" };
  const groupId = typeof located.parent.id === "string" ? located.parent.id : "";
  const result = reparent(document, input);
  if (!result || !result.ok) return result;
  const pages = (result.document as { pages?: { root?: TreeNode }[] }).pages ?? [];
  const group = pages.map((page) => page.root).filter((root): root is TreeNode => Boolean(root)).map((root) => findNode(root, groupId)).find((node) => node);
  if (!group || group.type !== "group" || findNode(group, input.nodeId)) return { ok: false, reason: "parent_rejected" };
  return result;
}
