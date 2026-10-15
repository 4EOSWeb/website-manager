type NamedNode = {
  id: string;
  metadata?: Record<string, unknown>;
  props?: Record<string, unknown>;
  children?: NamedNode[];
};

/** Sets the layer name. An empty name clears it. The heading text prop is copied through unchanged. */
export function withLayerName<T extends NamedNode>(node: T, name: string): T {
  const trimmed = name.trim().slice(0, 80);
  const metadata = { ...(node.metadata ?? {}) };
  if (trimmed) metadata.name = trimmed;
  else delete metadata.name;
  const props = node.props ? { ...node.props } : node.props;
  return { ...node, metadata, props };
}

function renameTree<T extends NamedNode>(node: T, nodeId: string, name: string, found: { ok: boolean }): T {
  if (node.id === nodeId) {
    found.ok = true;
    const renamed = withLayerName(node, name);
    return { ...renamed, children: node.children };
  }
  if (!node.children?.length) return node;
  return { ...node, children: node.children.map((child) => renameTree(child, nodeId, name, found)) };
}

/** Returns a new visual document with that node's display name, or null when the id is missing. */
export function renameVisualNode(document: unknown, nodeId: string, name: string): unknown | null {
  if (!document || typeof document !== "object") return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  const found = { ok: false };
  const nextPages = pages.map((page) => {
    if (!page || typeof page !== "object" || !(page as { root?: NamedNode }).root) return page;
    const current = page as { root: NamedNode };
    return { ...current, root: renameTree(current.root, nodeId, name, found) };
  });
  if (!found.ok) return null;
  return { ...(document as Record<string, unknown>), pages: nextPages };
}
