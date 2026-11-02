type VisNode = { id?: unknown; visibility?: { hidden?: boolean; hideOn?: unknown }; children?: unknown };

function hideOnOf(node: VisNode): unknown {
  const current = node.visibility?.hideOn;
  return Array.isArray(current) ? current.slice() : [];
}

function writeTree<T extends VisNode>(node: T, nodeId: string, hidden: boolean, found: { ok: boolean }): T {
  if (node.id === nodeId) {
    found.ok = true;
    return { ...node, visibility: { ...(node.visibility ?? {}), hidden, hideOn: hideOnOf(node) } };
  }
  if (!Array.isArray(node.children)) return node;
  return { ...node, children: node.children.map((child) => (child && typeof child === "object" ? writeTree(child as T, nodeId, hidden, found) : child)) };
}

/** Sets `visibility.hidden` and leaves `hideOn` as it was. Null when the id is missing. */
export function setLayerVisibility(document: unknown, nodeId: string, hidden: boolean): unknown | null {
  if (!document || typeof document !== "object" || !nodeId) return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  const found = { ok: false };
  const nextPages = pages.map((page) => {
    if (!page || typeof page !== "object" || !(page as { root?: VisNode }).root) return page;
    const current = page as { root: VisNode };
    return { ...current, root: writeTree(current.root, nodeId, hidden, found) };
  });
  if (!found.ok) return null;
  return { ...(document as Record<string, unknown>), pages: nextPages };
}
