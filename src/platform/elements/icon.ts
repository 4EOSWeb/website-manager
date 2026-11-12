import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** A new icon. An empty label means the icon is decorative. */
export function createIcon(name = "arrow"): NodeDocument {
  return createElement("icon", "generic.icon", { name, label: "" });
}

/** Empty label is decorative. A label is the accessible name. */
export function iconIsDecorative(node: Pick<NodeDocument, "props">) {
  const label = typeof node.props.label === "string" ? node.props.label.trim() : "";
  return label.length === 0;
}
