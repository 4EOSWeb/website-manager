import { createElement } from "./create";

export const selectParents = { allowedParents: ["form", "container"] };

/** A choice between generic options. It belongs in a form or a container. */
export function createSelect() {
  return createElement("select", "generic.select", { label: "Choose", options: ["First", "Second"] });
}
