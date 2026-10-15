import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

export const containerAcceptsChildren = true;

/** An empty container. Later nodes can be placed inside it. */
export function createContainer(): NodeDocument {
  const node = createElement("container", "generic.container", {});
  return { ...node, layout: { mode: "flow", direction: "vertical", gap: 0 } };
}
