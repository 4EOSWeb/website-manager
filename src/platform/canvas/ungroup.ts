import { boxOutsideGroup, type CanvasBox, type GroupNode } from "./group";

type GroupDocument = { pages?: { root?: GroupNode }[] };

function locate(node: GroupNode, id: string, parent: GroupNode | null = null): { parent: GroupNode | null; node: GroupNode; index: number } | null {
  if (node.id === id) return { parent, node, index: -1 };
  const children = node.children ?? [];
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!child) continue;
    if (child.id === id) return { parent: node, node: child, index };
    const found = locate(child, id, node);
    if (found) return found;
  }
  return null;
}

function find(document: GroupDocument, id: string) {
  for (const page of document.pages ?? []) {
    if (!page.root) continue;
    const found = locate(page.root, id);
    if (found) return found;
  }
  return null;
}

/** The group that directly contains this node, when one exists. */
export function canvasGroupId(document: unknown, nodeId: string): string | null {
  if (!document || typeof document !== "object" || !nodeId) return null;
  const located = find(document as GroupDocument, nodeId);
  if (!located?.parent || located.parent.type !== "group") return null;
  return located.parent.id;
}

/** Moves a group's children back to its parent and deletes the group. */
export function ungroupCanvas(document: unknown, groupId: string): { ok: true; document: unknown } | { ok: false; reason: "missing" } | null {
  if (!document || typeof document !== "object") return null;
  const next = structuredClone(document) as GroupDocument;
  const located = find(next, groupId);
  if (!located?.parent || located.node.type !== "group") return { ok: false, reason: "missing" };
  const group = located.node;
  const restored = (group.children ?? []).map((child) => ({
    ...child,
    box: child.box && group.box ? boxOutsideGroup(child.box, group.box as CanvasBox) : child.box,
  }));
  const siblings = located.parent.children ?? [];
  siblings.splice(located.index, 1, ...restored);
  located.parent.children = siblings;
  return { ok: true, document: next };
}
