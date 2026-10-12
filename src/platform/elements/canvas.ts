import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** A canvas container. The catalog calls it Canvas. */
export function createCanvas(): NodeDocument {
  const node = createElement("section", "generic.canvas", {});
  return {
    ...node,
    layout: { mode: "canvas", snap: 4, showGrid: false },
    metadata: { sourceNode: node.id },
  };
}
