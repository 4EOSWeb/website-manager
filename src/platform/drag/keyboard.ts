import { flowInsert } from "./flow-insert";
import { reparent } from "./reparent";

const containers = new Set(["page", "section", "container", "stack", "grid", "group", "card", "form"]);

type TreeNode = {
  id?: unknown;
  type?: unknown;
  name?: unknown;
  children?: unknown;
  locked?: { locked?: boolean };
  layout?: { direction?: unknown };
  metadata?: { legacyId?: unknown };
};

export type KeyboardDecision =
  | { ok: true; announcement: string; delta: -1 | 1; shift: boolean }
  | { ok: false; announcement: string; reason: "locked" | "parent_rejected" };

function reasonMessage(reason: "locked" | "parent_rejected"): string {
  return reason === "locked" ? "This item is locked." : "This item cannot go there.";
}

/** Alt+Arrow moves inside the parent. Bare arrow keys are not a move. */
export function keyboardStep(input: {
  key: string;
  alt: boolean;
  shift: boolean;
  index: number;
  count: number;
  neighbor: string;
  locked: boolean;
  row: boolean;
}): KeyboardDecision | null {
  if (!input.alt) return null;
  if (input.locked) return { ok: false, announcement: reasonMessage("locked"), reason: "locked" };
  let delta: -1 | 1 | 0 = 0;
  if (input.row) {
    if (input.key === "ArrowLeft") delta = -1;
    else if (input.key === "ArrowRight") delta = 1;
  } else if (input.key === "ArrowUp") delta = -1;
  else if (input.key === "ArrowDown") delta = 1;
  if (delta === 0) return { ok: false, announcement: reasonMessage("parent_rejected"), reason: "parent_rejected" };
  if (!input.shift && (input.index + delta < 0 || input.index + delta >= input.count)) {
    return { ok: false, announcement: reasonMessage("parent_rejected"), reason: "parent_rejected" };
  }
  if (input.shift && !input.neighbor) return { ok: false, announcement: reasonMessage("parent_rejected"), reason: "parent_rejected" };
  const announcement = delta > 0 ? `Moved below ${input.neighbor}` : `Moved above ${input.neighbor}`;
  return { ok: true, announcement, delta, shift: input.shift };
}

function matches(node: TreeNode, id: string): boolean {
  if (node.id === id) return true;
  const legacy = node.metadata?.legacyId;
  return legacy === id || (typeof legacy === "string" && legacy.endsWith(`/${id}`));
}

function findParent(node: TreeNode, id: string): { parent: TreeNode; index: number } | null {
  const children = Array.isArray(node.children) ? node.children as TreeNode[] : [];
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!child || typeof child !== "object") continue;
    if (matches(child, id)) return { parent: node, index };
    const nested = findParent(child, id);
    if (nested) return nested;
  }
  return null;
}

function pagesOf(document: unknown): TreeNode[] {
  if (!document || typeof document !== "object") return [];
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return [];
  return pages.flatMap((page) => {
    if (!page || typeof page !== "object") return [];
    const root = (page as { root?: TreeNode }).root;
    return root ? [root] : [];
  });
}

function labelOf(node: TreeNode): string {
  return typeof node.name === "string" && node.name ? node.name : typeof node.type === "string" ? node.type : "item";
}

function isRow(node: TreeNode): boolean {
  const direction = node.layout?.direction;
  return direction === "horizontal" || direction === "row";
}

export function keyboardMove(
  document: unknown,
  input: {
    nodeId: string;
    key: string;
    alt: boolean;
    shift: boolean;
    childType: string;
    childParents: { allowedParents: readonly string[] };
  },
): { ok: true; document: unknown; announcement: string } | { ok: false; announcement: string; reason: "locked" | "parent_rejected" } | null {
  if (!document || typeof document !== "object") return null;
  const roots = pagesOf(document);
  let located: { parent: TreeNode; index: number } | null = null;
  for (const root of roots) {
    located = findParent(root, input.nodeId);
    if (located) break;
  }
  if (!located || !Array.isArray(located.parent.children)) return null;
  const siblings = located.parent.children as TreeNode[];
  const moving = siblings[located.index];
  if (!moving) return null;
  const row = isRow(located.parent);
  let delta: -1 | 1 | 0 = 0;
  if (row) {
    if (input.key === "ArrowLeft") delta = -1;
    else if (input.key === "ArrowRight") delta = 1;
  } else if (input.key === "ArrowUp") delta = -1;
  else if (input.key === "ArrowDown") delta = 1;
  let neighbor = "";
  let neighborNode: TreeNode | null = null;
  if (!input.shift && delta !== 0) {
    neighborNode = siblings[located.index + delta] ?? null;
    neighbor = neighborNode ? labelOf(neighborNode) : "";
  } else if (input.shift && delta > 0) {
    neighborNode = siblings.slice(located.index + 1).find((node) => typeof node.type === "string" && containers.has(node.type)) ?? null;
    if (!neighborNode) {
      let parentSlot: { parent: TreeNode; index: number } | null = null;
      for (const root of roots) {
        if (typeof located.parent.id === "string") parentSlot = findParent(root, located.parent.id);
        if (parentSlot) break;
      }
      const afterParent = parentSlot && Array.isArray(parentSlot.parent.children) ? (parentSlot.parent.children as TreeNode[])[parentSlot.index + 1] : null;
      if (afterParent && typeof afterParent.type === "string" && containers.has(afterParent.type)) neighborNode = afterParent;
    }
    neighbor = neighborNode ? labelOf(neighborNode) : "";
  } else if (input.shift && delta < 0) {
    neighbor = labelOf(located.parent);
  }
  const decision = keyboardStep({
    key: input.key,
    alt: input.alt,
    shift: input.shift,
    index: located.index,
    count: siblings.length,
    neighbor,
    locked: moving.locked?.locked === true,
    row,
  });
  if (!decision) return null;
  if (!decision.ok) return decision;
  if (!input.shift) {
    const updated = flowInsert(document, { parentId: String(located.parent.id), nodeId: input.nodeId, index: located.index + decision.delta });
    if (!updated) return { ok: false, announcement: reasonMessage("parent_rejected"), reason: "parent_rejected" };
    return { ok: true, document: updated, announcement: decision.announcement };
  }
  const parentId = delta > 0 && neighborNode && typeof neighborNode.id === "string" ? neighborNode.id : "";
  let grandparent: { parent: TreeNode; index: number } | null = null;
  if (delta < 0 && typeof located.parent.id === "string") {
    for (const root of roots) {
      grandparent = findParent(root, located.parent.id);
      if (grandparent) break;
    }
  }
  const targetParent = delta < 0 && grandparent && typeof grandparent.parent.id === "string" ? grandparent.parent.id : parentId;
  if (!targetParent) return { ok: false, announcement: reasonMessage("parent_rejected"), reason: "parent_rejected" };
  const moved = reparent(document, {
    nodeId: input.nodeId,
    parentId: targetParent,
    targetId: delta < 0 ? String(located.parent.id) : "",
    after: false,
    draggedLocked: false,
    childType: input.childType,
    childParents: input.childParents,
    parentType: delta < 0 && grandparent && typeof grandparent.parent.type === "string" ? grandparent.parent.type : "section",
    parentChildren: { acceptsChildren: true },
  });
  if (!moved || !moved.ok) return { ok: false, announcement: reasonMessage(moved && !moved.ok ? moved.reason : "parent_rejected"), reason: moved && !moved.ok ? moved.reason : "parent_rejected" };
  return { ok: true, document: moved.document, announcement: decision.announcement };
}
