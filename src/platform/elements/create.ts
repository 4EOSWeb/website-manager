import type { NodeDocument } from "../document/node";
import type { NodeType } from "../document/node-type";
import { createPlatformId } from "../ids";

const containerTypes = new Set(["page", "section", "container", "stack", "grid", "group", "card"]);

type TreeNode = {
  id: string;
  type: string;
  children: TreeNode[];
  locked?: { locked?: boolean };
};

/** Shared shell for a new element. Later elements only change the type, component, and props. */
export function createElement(type: NodeType, componentId: string, props: Record<string, unknown>): NodeDocument {
  return {
    id: createPlatformId("node"),
    type,
    componentId,
    props,
    styles: {},
    responsive: {},
    children: [],
    visibility: { hidden: false, hideOn: [] },
    locked: { locked: false },
    metadata: {},
  };
}

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function walkIds(node: unknown, ids: string[]) {
  if (!node || typeof node !== "object") return;
  const record = node as { id?: unknown; children?: unknown };
  if (typeof record.id === "string") ids.push(record.id);
  if (Array.isArray(record.children)) record.children.forEach((child) => walkIds(child, ids));
}

/** Ids stored on a visual document. An empty list means there is no document. */
export function nodeIdsIn(document: unknown): string[] {
  if (!document || typeof document !== "object") return [];
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return [];
  const ids: string[] = [];
  for (const page of pages) {
    if (page && typeof page === "object") walkIds((page as { root?: unknown }).root, ids);
  }
  return ids;
}

/**
 * Appends a node to the selected container, or to the page root when that
 * container cannot hold children. Returns null when the page root is locked.
 */
export function insertNode(document: unknown, route: string, parentId: string | null, node: NodeDocument): unknown | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document) as { pages?: Array<{ route?: string; root?: TreeNode }> };
  const page = copy.pages?.find((item) => item.route === route);
  if (!page?.root || !Array.isArray(page.root.children)) return null;
  const selected = parentId ? findNode(page.root, parentId) : null;
  const canHold = selected && containerTypes.has(selected.type) && selected.locked?.locked !== true && Array.isArray(selected.children);
  const target = canHold ? selected : page.root;
  if (target.locked?.locked === true || !Array.isArray(target.children)) return null;
  target.children = [...target.children, node as unknown as TreeNode];
  return copy;
}

function findParent(node: TreeNode, id: string): { parent: TreeNode; index: number } | null {
  const index = (node.children ?? []).findIndex((child) => child.id === id);
  if (index >= 0) return { parent: node, index };
  for (const child of node.children ?? []) {
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

/** Places a node after the selected sibling, or at the end of the page root. */
export function insertAfter(document: unknown, route: string, afterId: string | null, node: NodeDocument): unknown | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document) as { pages?: Array<{ route?: string; root?: TreeNode }> };
  const page = copy.pages?.find((item) => item.route === route);
  if (!page?.root || !Array.isArray(page.root.children)) return null;
  const found = afterId ? findParent(page.root, afterId) : null;
  if (found && found.parent.locked?.locked !== true) {
    const children = [...found.parent.children];
    children.splice(found.index + 1, 0, node as unknown as TreeNode);
    found.parent.children = children;
    return copy;
  }
  if (page.root.locked?.locked === true) return null;
  page.root.children = [...page.root.children, node as unknown as TreeNode];
  return copy;
}
