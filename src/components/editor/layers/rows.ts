import { layerNodeLabel } from "@/components/editor/layers/labels";

/** A visual node, as stored: children are nested, and a lock does not remove the node. */
export type LayerNode = {
  id: string;
  type: string;
  componentId?: string;
  layout?: { mode?: string; display?: string };
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

export type LayerSelection = { sectionId: string; itemId: string };

/** The section and block recorded on a migrated node, when that path has them. */
export function legacyTarget(legacyId: unknown): LayerSelection | null {
  if (typeof legacyId !== "string" || !legacyId) return null;
  const parts = legacyId.split("/");
  let sectionId = "";
  let itemId = "";
  for (let index = 0; index < parts.length; index += 1) {
    if (parts[index] === "section" && parts[index + 2]) sectionId = parts[index + 2] ?? "";
    if (parts[index] === "block" && parts[index + 2]) itemId = parts[index + 2] ?? "";
  }
  if (!sectionId) return null;
  return { sectionId, itemId };
}

/** A row is selected when its id is in the shared selection, or it is the single legacy target. */
export function layerRowSelected(node: LayerNode, selection: LayerSelection, nodeIds: readonly string[] = []): boolean {
  if (nodeIds.includes(node.id)) return true;
  const target = legacyTarget(node.metadata?.legacyId);
  if (target && nodeIds.includes(target.itemId || target.sectionId)) return true;
  if (nodeIds.length) return false;
  if (!target || target.sectionId !== selection.sectionId) return false;
  if (selection.itemId) return target.itemId === selection.itemId;
  return target.itemId === "";
}

/** The display name, or the generic type word when the page has not named it. */
export function layerLabel(node: LayerNode, registryName?: string | null): string {
  return layerNodeLabel(
    { type: node.type, metadata: node.metadata ? { name: node.metadata.name } : undefined },
    registryName,
  );
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
