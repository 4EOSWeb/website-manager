/** A visual node, as stored: children are nested, and a lock does not remove the node. */
export type LayerNode = {
  id: string;
  type: string;
  metadata?: Record<string, unknown>;
  children?: LayerNode[];
  locked?: { locked?: boolean };
  source?: { providerManaged?: boolean };
};

export type LayerRow = {
  id: string;
  label: string;
  depth: number;
  parentId: string | null;
  locked: boolean;
  providerManaged: boolean;
};

/** The display name, or the node type when the page has not named it. */
export function layerLabel(node: LayerNode): string {
  const name = node.metadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return node.type;
}

/** Every node under the page root, including locked and provider-managed nodes. */
export function layerRows(root: LayerNode): LayerRow[] {
  const rows: LayerRow[] = [];
  const visit = (node: LayerNode, depth: number, parentId: string | null) => {
    rows.push({
      id: node.id,
      label: layerLabel(node),
      depth,
      parentId,
      locked: Boolean(node.locked?.locked),
      providerManaged: Boolean(node.source?.providerManaged),
    });
    for (const child of node.children ?? []) visit(child, depth + 1, node.id);
  };
  visit(root, 0, null);
  return rows;
}

/** Root and the next level start open. Deeper nodes start collapsed. */
export function defaultOpenIds(root: LayerNode): string[] {
  const open: string[] = [];
  const visit = (node: LayerNode, depth: number) => {
    const children = node.children ?? [];
    if (children.length > 0 && depth < 2) open.push(node.id);
    for (const child of children) visit(child, depth + 1);
  };
  visit(root, 0);
  return open;
}

export function layerStorageKey(websiteId: string, pageId: string): string {
  return `4eos-layers:${websiteId}:${pageId}`;
}

/** The active page root, or null when this draft has no visual document. */
export function visualPageRoot(document: unknown, route: string): LayerNode | null {
  if (!document || typeof document !== "object") return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  const page = pages.find((item) => item && typeof item === "object" && (item as { route?: unknown }).route === route) as { root?: unknown } | undefined;
  const root = page?.root;
  if (!root || typeof root !== "object") return null;
  const node = root as LayerNode;
  if (typeof node.id !== "string" || typeof node.type !== "string") return null;
  return node;
}
