import { reparent, type ReparentInput } from "./reparent";

type TreeNode = {
  id?: unknown;
  type?: unknown;
  box?: unknown;
  children?: unknown;
  metadata?: { legacyId?: unknown };
};

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

function locate(document: unknown, id: string): TreeNode | null {
  if (!document || typeof document !== "object") return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const root = (page as { root?: TreeNode }).root;
    if (!root) continue;
    const found = findNode(root, id);
    if (found) return found;
  }
  return null;
}

function countFrom(node: TreeNode, id: string): number {
  const children = Array.isArray(node.children) ? node.children : [];
  return children.reduce((total, child) => {
    if (!child || typeof child !== "object") return total;
    return total + countFrom(child as TreeNode, id);
  }, matches(node, id) ? 1 : 0);
}

function count(document: unknown, id: string): number {
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return 0;
  return pages.reduce((total, page) => {
    if (!page || typeof page !== "object") return total;
    const root = (page as { root?: TreeNode }).root;
    return root ? total + countFrom(root, id) : total;
  }, 0);
}

/**
 * Drops a node into a group. Other parents are left for reparent.
 * The group's box stays where it was, and the group is not copied.
 */
export function groupEnter(
  document: unknown,
  input: ReparentInput,
): { ok: true; document: unknown } | { ok: false; reason: "locked" | "parent_rejected" } | null {
  const group = locate(document, input.parentId);
  if (!group || group.type !== "group") return null;
  const box = group.box ?? null;
  const result = reparent(document, { ...input, parentType: "group" });
  if (!result || !result.ok) return result;
  const next = locate(result.document, input.parentId);
  if (!next || next.type !== "group") return { ok: false, reason: "parent_rejected" };
  if (JSON.stringify(next.box ?? null) !== JSON.stringify(box)) return { ok: false, reason: "parent_rejected" };
  if (count(result.document, input.parentId) !== 1) return { ok: false, reason: "parent_rejected" };
  return result;
}
