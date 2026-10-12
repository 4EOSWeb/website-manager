import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** A stack. The direction starts as a column and can later be set to a row. */
export function createStack(): NodeDocument {
  const node = createElement("stack", "generic.stack", {});
  return {
    ...node,
    layout: { mode: "layout", display: "flex", direction: "column", gap: 16, align: "stretch", justify: "start", wrap: false },
  };
}
