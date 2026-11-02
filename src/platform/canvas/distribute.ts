import type { AlignBox } from "./align";

export type DistributeAxis = "horizontal" | "vertical";

type DistributeNode = { id: string; box?: AlignBox; children?: DistributeNode[] };

type DistributeDocument = { pages?: { root?: DistributeNode }[] };

export type DistributeOutcome =
  | { ok: true; document: unknown }
  | { ok: false; reason: "missing" | "parent_rejected" | "needs_selection" };

/** Spaces three or more boxes so the gaps between them match. Fewer than three stay put. */
export function distributeBoxes(boxes: readonly AlignBox[], axis: DistributeAxis): AlignBox[] {
  if (boxes.length < 3) return boxes.map((box) => ({ ...box }));
  const horizontal = axis === "horizontal";
  const sorted = boxes.map((box, index) => ({ box, index })).sort((left, right) => {
    const delta = horizontal ? left.box.x - right.box.x : left.box.y - right.box.y;
    return delta || left.index - right.index;
  });
  const first = sorted[0]?.box;
  const last = sorted[sorted.length - 1]?.box;
  if (!first || !last) return boxes.map((box) => ({ ...box }));
  const start = horizontal ? first.x : first.y;
  const end = horizontal ? last.x + last.w : last.y + last.h;
  const total = sorted.reduce((sum, entry) => sum + (horizontal ? entry.box.w : entry.box.h), 0);
  const gap = (end - start - total) / (sorted.length - 1);
  let cursor = start;
  const placed: AlignBox[] = boxes.map((box) => ({ ...box }));
  for (const entry of sorted) {
    const next = { ...entry.box };
    if (horizontal) next.x = cursor;
    else next.y = cursor;
    cursor += (horizontal ? next.w : next.h) + gap;
    placed[entry.index] = next;
  }
  return placed;
}

function locate(node: DistributeNode, id: string, parent: DistributeNode | null = null): { parent: DistributeNode | null; node: DistributeNode } | null {
  if (node.id === id) return { parent, node };
  for (const child of node.children ?? []) {
    if (child.id === id) return { parent: node, node: child };
    const found = locate(child, id, node);
    if (found) return found;
  }
  return null;
}

function find(document: DistributeDocument, id: string) {
  for (const page of document.pages ?? []) {
    if (!page.root) continue;
    const found = locate(page.root, id);
    if (found) return found;
  }
  return null;
}

/** Distributes selected siblings. Two nodes, and nodes outside the selection, do not move. */
export function distributeCanvas(document: unknown, ids: readonly string[], axis: DistributeAxis): DistributeOutcome | null {
  if (!document || typeof document !== "object") return null;
  if (ids.length < 3) return { ok: false, reason: "needs_selection" };
  const next = structuredClone(document) as DistributeDocument;
  const located = ids.map((id) => find(next, id));
  if (located.some((entry) => !entry?.parent || !entry.node.box)) return { ok: false, reason: "missing" };
  const parent = located[0]?.parent;
  if (!parent || located.some((entry) => entry?.parent !== parent)) return { ok: false, reason: "parent_rejected" };
  const distributed = distributeBoxes(located.map((entry) => entry!.node.box!), axis);
  located.forEach((entry, index) => {
    const box = distributed[index];
    if (entry && box) entry.node.box = box;
  });
  return { ok: true, document: next };
}
