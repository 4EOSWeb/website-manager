export type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";

export type AlignBox = { x: number; y: number; w: number; h: number };

type AlignNode = { id: string; box?: AlignBox; children?: AlignNode[] };

type AlignDocument = { pages?: { root?: AlignNode }[] };

export type AlignOutcome =
  | { ok: true; document: unknown }
  | { ok: false; reason: "missing" | "parent_rejected" };

function place(value: number, size: number): number {
  if (value < 0) return 0;
  if (value + size > 100) return Math.max(0, 100 - size);
  return value;
}

/** Moves boxes to the selection bounds, or to the parent when only one box is selected. */
export function alignBoxes(boxes: readonly AlignBox[], mode: AlignMode): AlignBox[] {
  if (boxes.length === 0) return [];
  const alone = boxes.length === 1;
  const minX = alone ? 0 : Math.min(...boxes.map((box) => box.x));
  const maxRight = alone ? 100 : Math.max(...boxes.map((box) => box.x + box.w));
  const minY = alone ? 0 : Math.min(...boxes.map((box) => box.y));
  const maxBottom = alone ? 100 : Math.max(...boxes.map((box) => box.y + box.h));
  const midX = alone ? 50 : (minX + maxRight) / 2;
  const midY = alone ? 50 : (minY + maxBottom) / 2;
  return boxes.map((box) => {
    let x = box.x;
    let y = box.y;
    if (mode === "left") x = minX;
    if (mode === "right") x = maxRight - box.w;
    if (mode === "center") x = midX - box.w / 2;
    if (mode === "top") y = minY;
    if (mode === "middle") y = midY - box.h / 2;
    if (mode === "bottom") y = maxBottom - box.h;
    return { ...box, x: place(x, box.w), y: place(y, box.h) };
  });
}

function locate(node: AlignNode, id: string, parent: AlignNode | null = null): { parent: AlignNode | null; node: AlignNode } | null {
  if (node.id === id) return { parent, node };
  for (const child of node.children ?? []) {
    if (child.id === id) return { parent: node, node: child };
    const found = locate(child, id, node);
    if (found) return found;
  }
  return null;
}

function find(document: AlignDocument, id: string) {
  for (const page of document.pages ?? []) {
    if (!page.root) continue;
    const found = locate(page.root, id);
    if (found) return found;
  }
  return null;
}

/** Aligns the selected nodes inside their parent. Other nodes stay put. */
export function alignCanvas(document: unknown, ids: readonly string[], mode: AlignMode): AlignOutcome | null {
  if (!document || typeof document !== "object") return null;
  if (ids.length === 0) return { ok: false, reason: "missing" };
  const next = structuredClone(document) as AlignDocument;
  const located = ids.map((id) => find(next, id));
  if (located.some((entry) => !entry?.parent || !entry.node.box)) return { ok: false, reason: "missing" };
  const parent = located[0]?.parent;
  if (!parent || located.some((entry) => entry?.parent !== parent)) return { ok: false, reason: "parent_rejected" };
  const aligned = alignBoxes(located.map((entry) => entry!.node.box!), mode);
  located.forEach((entry, index) => {
    const box = aligned[index];
    if (entry && box) entry.node.box = box;
  });
  return { ok: true, document: next };
}
