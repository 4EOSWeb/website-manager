import type { NodeDocument } from "../document/node";
import { createPlatformId } from "../ids";
import { createElement } from "./create";

/** An empty group. Grouping nodes that already exist comes later. */
export function createGroup(): NodeDocument {
  const node = createElement("group", "generic.group", {});
  return {
    ...node,
    id: createPlatformId("grp"),
    layout: { mode: "flow", direction: "vertical", gap: 0 },
  };
}
