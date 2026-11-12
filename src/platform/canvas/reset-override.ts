import type { BreakpointNode } from "./breakpoint-write";

type TreeNode = {
  id?: unknown;
  children?: unknown;
  box?: BreakpointNode["box"];
  responsive?: BreakpointNode["responsive"];
  metadata?: { legacyId?: unknown };
};

/** Removes one breakpoint box. With no overrides left, strategy returns to reflow unless it is scale. */
export function resetBreakpointBox<T extends BreakpointNode>(node: T, breakpoint: "tablet" | "mobile"): T {
  const responsive: NonNullable<BreakpointNode["responsive"]> = { ...node.responsive };
  const current = responsive[breakpoint];
  if (current) {
    const rest: { box?: BreakpointNode["box"] } = { ...current };
    delete rest.box;
    if (rest.box === undefined && Object.keys(rest).length === 0) delete responsive[breakpoint];
    else responsive[breakpoint] = rest;
  }
  const hasOverride = responsive.tablet?.box !== undefined || responsive.mobile?.box !== undefined;
  if (!hasOverride && responsive.strategy !== "scale") responsive.strategy = "reflow";
  return {
    ...node,
    box: node.box ? { ...node.box } : node.box,
    responsive,
  };
}

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

function locate(document: unknown, nodeId: string): TreeNode | null {
  if (!document || typeof document !== "object") return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const root = (page as { root?: TreeNode }).root;
    if (!root) continue;
    const found = findNode(root, nodeId);
    if (found) return found;
  }
  return null;
}

/** Clears a tablet or mobile box on a canvas node. The desktop box stays. */
export function resetOverride(document: unknown, nodeId: string, breakpoint: "tablet" | "mobile"): unknown | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document);
  const node = locate(copy, nodeId);
  if (!node) return null;
  const written = resetBreakpointBox(node, breakpoint);
  node.box = written.box;
  node.responsive = written.responsive;
  return copy;
}
