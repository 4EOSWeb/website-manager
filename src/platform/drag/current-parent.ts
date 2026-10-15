type TreeNode = { id?: unknown; children?: unknown };

export type CurrentParentResult =
  | { ok: true; parentId: string }
  | { ok: false; code: "node_not_found" | "page_root" };

function findParent(node: TreeNode, nodeId: string): string | null {
  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    if (!child || typeof child !== "object") continue;
    const record = child as TreeNode;
    if (record.id === nodeId && typeof node.id === "string") return node.id;
    const nested = findParent(record, nodeId);
    if (nested) return nested;
  }
  return null;
}

/** The parent of a node. The page root has none, and a missing id is an error. */
export function currentParent(document: unknown, nodeId: string): CurrentParentResult {
  if (!document || typeof document !== "object") return { ok: false, code: "node_not_found" };
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return { ok: false, code: "node_not_found" };
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const root = (page as { root?: TreeNode }).root;
    if (!root || typeof root.id !== "string") continue;
    if (root.id === nodeId) return { ok: false, code: "page_root" };
    const parentId = findParent(root, nodeId);
    if (parentId) return { ok: true, parentId };
  }
  return { ok: false, code: "node_not_found" };
}
