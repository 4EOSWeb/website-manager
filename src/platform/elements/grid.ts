import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** An empty grid. It starts at two columns. */
export function createGrid(): NodeDocument {
  const node = createElement("grid", "generic.grid", {});
  return { ...node, layout: { mode: "layout", display: "grid", columns: 2, gap: 16, align: "stretch" } };
}
