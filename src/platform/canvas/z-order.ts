import { CANVAS_Z_MAX, canvasZ, setCanvasZ } from "./z-index";

export type StackNode = { id: string; z: number; locked?: boolean };

type VisualNode = {
  id: string;
  locked?: boolean | { locked?: boolean };
  metadata?: { z?: unknown };
  children?: VisualNode[];
};

type VisualDocument = { pages?: { root?: VisualNode }[] };

function copy<T extends StackNode>(nodes: readonly T[]): T[] {
  return nodes.map((node) => ({ ...node }));
}

/** Raises a node one step. A locked node stays put, and the node does not jump to the front. */
export function bringForward<T extends StackNode>(nodes: readonly T[], id: string): T[] {
  const index = nodes.findIndex((node) => node.id === id);
  const current = index >= 0 ? nodes[index] : undefined;
  if (!current || current.locked) return copy(nodes);
  const next = nodes
    .map((node, at) => ({ node, at }))
    .filter((entry) => entry.node.z > current.z)
    .sort((left, right) => left.node.z - right.node.z || left.at - right.at)[0];
  if (!next) return copy(nodes);
  const raised = copy(nodes);
  if (next.node.locked || next.node.z > current.z + 1) {
    const z = Math.min(CANVAS_Z_MAX, current.z + 1);
    raised[index] = { ...current, z };
    return raised;
  }
  raised[index] = { ...current, z: next.node.z };
  raised[next.at] = { ...next.node, z: current.z };
  return raised;
}

function locked(node: VisualNode): boolean {
  if (typeof node.locked === "boolean") return node.locked;
  return node.locked?.locked === true;
}

function locate(node: VisualNode, id: string, parent: VisualNode | null = null): { parent: VisualNode | null; node: VisualNode } | null {
  if (node.id === id) return { parent, node };
  for (const child of node.children ?? []) {
    if (child.id === id) return { parent: node, node: child };
    const found = locate(child, id, node);
    if (found) return found;
  }
  return null;
}

/** Lowers a node one step. A locked node stays put, and the node does not pass a locked neighbor. */
export function sendBackward<T extends StackNode>(nodes: readonly T[], id: string): T[] {
  const index = nodes.findIndex((node) => node.id === id);
  const current = index >= 0 ? nodes[index] : undefined;
  if (!current || current.locked) return copy(nodes);
  const next = nodes
    .map((node, at) => ({ node, at }))
    .filter((entry) => entry.node.z < current.z)
    .sort((left, right) => right.node.z - left.node.z || left.at - right.at)[0];
  if (!next) return copy(nodes);
  const lowered = copy(nodes);
  if (next.node.locked && next.node.z >= current.z - 1) return lowered;
  if (next.node.locked || next.node.z < current.z - 1) {
    lowered[index] = { ...current, z: Math.max(0, current.z - 1) };
    return lowered;
  }
  lowered[index] = { ...current, z: next.node.z };
  lowered[next.at] = { ...next.node, z: current.z };
  return lowered;
}

/** Swaps canvas `metadata.z` with the next higher sibling, or increments across a gap. */
export function bringForwardCanvas(document: unknown, id: string): { ok: true; document: unknown } | { ok: false; reason: "missing" } | null {
  if (!document || typeof document !== "object" || !id) return null;
  const next = structuredClone(document) as VisualDocument;
  let located: { parent: VisualNode | null; node: VisualNode } | null = null;
  for (const page of next.pages ?? []) {
    if (!page.root) continue;
    located = locate(page.root, id);
    if (located) break;
  }
  const siblings = located?.parent?.children;
  if (!located || !siblings) return { ok: false, reason: "missing" };
  const ordered = bringForward(siblings.map((node) => ({ id: node.id, z: canvasZ(node.metadata), locked: locked(node) })), id);
  siblings.forEach((node, index) => {
    const z = ordered[index]?.z;
    if (z === undefined || z === canvasZ(node.metadata)) return;
    const updated = setCanvasZ(node, z);
    node.metadata = updated.metadata;
  });
  return { ok: true, document: next };
}

/** Swaps canvas `metadata.z` with the next lower sibling, or decrements across a gap. */
export function sendBackwardCanvas(document: unknown, id: string): { ok: true; document: unknown } | { ok: false; reason: "missing" } | null {
  if (!document || typeof document !== "object" || !id) return null;
  const next = structuredClone(document) as VisualDocument;
  let located: { parent: VisualNode | null; node: VisualNode } | null = null;
  for (const page of next.pages ?? []) {
    if (!page.root) continue;
    located = locate(page.root, id);
    if (located) break;
  }
  const siblings = located?.parent?.children;
  if (!located || !siblings) return { ok: false, reason: "missing" };
  const ordered = sendBackward(siblings.map((node) => ({ id: node.id, z: canvasZ(node.metadata), locked: locked(node) })), id);
  siblings.forEach((node, index) => {
    const z = ordered[index]?.z;
    if (z === undefined || z === canvasZ(node.metadata)) return;
    const updated = setCanvasZ(node, z);
    node.metadata = updated.metadata;
  });
  return { ok: true, document: next };
}
