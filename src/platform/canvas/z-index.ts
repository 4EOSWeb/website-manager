export const CANVAS_Z_MIN = 0;
export const CANVAS_Z_MAX = 200;

export type CanvasZNode = { metadata?: Record<string, unknown> };

/** Reads a canvas stacking value. Missing or invalid values paint at 0. */
export function canvasZ(metadata: { z?: unknown } | undefined): number {
  const value = metadata?.z;
  if (typeof value !== "number" || !Number.isInteger(value) || value < CANVAS_Z_MIN || value > CANVAS_Z_MAX) return 0;
  return value;
}

/** Stores `metadata.z` when the value is an integer from 0 to 200. */
export function setCanvasZ<T extends CanvasZNode>(node: T, z: number): T {
  if (typeof z !== "number" || !Number.isInteger(z) || z < CANVAS_Z_MIN || z > CANVAS_Z_MAX) return node;
  return { ...node, metadata: { ...(node.metadata ?? {}), z } };
}

/** Higher z paints later. Flow order stays as stored. */
export function paintOrder<T extends CanvasZNode>(nodes: readonly T[], canvas: boolean): T[] {
  const copy = nodes.slice();
  if (!canvas) return copy;
  return copy
    .map((node, index) => ({ node, index, z: canvasZ(node.metadata) }))
    .sort((left, right) => left.z - right.z || left.index - right.index)
    .map((entry) => entry.node);
}
