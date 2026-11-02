import { createPlatformId } from "../ids";

export type CanvasBox = { x: number; y: number; w: number; h: number };

export type GroupNode = {
  id: string;
  type?: string;
  box?: CanvasBox;
  children?: GroupNode[];
  locked?: boolean;
};

type GroupDocument = { pages?: { root?: GroupNode }[] };

export type GroupOutcome =
  | { ok: true; document: unknown; groupId: string }
  | { ok: false; reason: "locked" | "needs_selection" | "parent_rejected" };

/** The box that contains every selected box. */
export function groupBounds(boxes: readonly CanvasBox[]): CanvasBox {
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.w));
  const bottom = Math.max(...boxes.map((box) => box.y + box.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** A child box as a percentage of its group. */
export function boxInsideGroup(box: CanvasBox, group: CanvasBox): CanvasBox {
  return {
    x: group.w === 0 ? 0 : ((box.x - group.x) / group.w) * 100,
    y: group.h === 0 ? 0 : ((box.y - group.y) / group.h) * 100,
    w: group.w === 0 ? 0 : (box.w / group.w) * 100,
    h: group.h === 0 ? 0 : (box.h / group.h) * 100,
  };
}

/** The same box back in the group's parent. */
export function boxOutsideGroup(box: CanvasBox, group: CanvasBox): CanvasBox {
  return {
    x: group.x + (box.x / 100) * group.w,
    y: group.y + (box.y / 100) * group.h,
    w: (box.w / 100) * group.w,
    h: (box.h / 100) * group.h,
  };
}

function roots(document: GroupDocument): GroupNode[] {
  return (document.pages ?? []).flatMap((page) => (page.root ? [page.root] : []));
}

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
  for (const root of roots(document)) {
    const found = locate(root, id);
    if (found) return found;
  }
  return null;
}

/** Wraps the selection in one group. Child boxes become relative to that group. */
export function groupCanvas(document: unknown, ids: readonly string[]): GroupOutcome | null {
  if (!document || typeof document !== "object") return null;
  if (ids.length < 2) return { ok: false, reason: "needs_selection" };
  const next = structuredClone(document) as GroupDocument;
  const located = ids.map((id) => find(next, id));
  if (located.some((entry) => !entry?.parent)) return { ok: false, reason: "parent_rejected" };
  const parent = located[0]?.parent;
  if (!parent || located.some((entry) => entry?.parent !== parent)) return { ok: false, reason: "parent_rejected" };
  if (located.some((entry) => entry?.node.locked)) return { ok: false, reason: "locked" };
  const boxes = located.map((entry) => entry?.node.box).filter((box): box is CanvasBox => Boolean(box));
  if (boxes.length !== ids.length) return { ok: false, reason: "parent_rejected" };
  const bounds = groupBounds(boxes);
  const groupId = createPlatformId("grp");
  const children = located.map((entry) => ({ ...entry!.node, box: boxInsideGroup(entry!.node.box!, bounds) }));
  const group: GroupNode = { id: groupId, type: "group", box: bounds, children };
  const indexes = located.map((entry) => entry!.index).sort((left, right) => left - right);
  const first = indexes[0] ?? 0;
  parent.children = (parent.children ?? []).filter((child) => !ids.includes(child.id));
  parent.children.splice(first, 0, group);
  return { ok: true, document: next, groupId };
}
