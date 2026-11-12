import { createElement } from "./create";

/** A new divider. It has no children and does not carry text. */
export function createDivider() {
  return createElement("divider", "generic.divider", {});
}
