type Tree = {
  id?: string;
  metadata?: Record<string, unknown>;
  children?: unknown[];
  locked?: boolean | { locked?: boolean };
};

function record(value: unknown): Tree | null {
  return value && typeof value === "object" ? (value as Tree) : null;
}

/** The region tag stored on a node, or an empty string. */
export function regionTag(node: unknown): string {
  const tree = record(node);
  const region = tree?.metadata?.region;
  return typeof region === "string" ? region : "";
}

/** The first node tagged with a region, searching the tree in order. */
export function findRegion(root: unknown, region: string): Tree | null {
  const tree = record(root);
  if (!tree) return null;
  if (regionTag(tree) === region) return tree;
  for (const child of tree.children ?? []) {
    const found = findRegion(child, region);
    if (found) return found;
  }
  return null;
}

/** A locked node stays locked even when the surrounding region can be edited. */
export function staysLocked(node: unknown): boolean {
  const tree = record(node);
  if (!tree?.locked) return false;
  if (typeof tree.locked === "boolean") return tree.locked;
  return tree.locked.locked === true;
}

/** Header chrome fields. Footer fields are not included. */
export function headerChromeField(field: string): boolean {
  return field === "buttonLabel" || field === "siteName" || field === "announcement";
}

const regionRoles = new Set(["header", "footer", "sidebar", "cta"]);

/** Root children that are the page body. Header, footer, sidebar, and call to action are left out. */
export function bodyNodes(root: unknown): Tree[] {
  const tree = record(root);
  if (!tree) return [];
  const nodes: Tree[] = [];
  for (const child of tree.children ?? []) {
    const item = record(child);
    if (!item || regionRoles.has(regionTag(item))) continue;
    nodes.push(item);
  }
  return nodes;
}
