import { createElement } from "./create";

export const inputParents = { allowedParents: ["form", "container"] };

/** A single input. It belongs in a form or a container. */
export function createInput() {
  return createElement("input", "generic.input", { label: "Label", name: "field", required: false });
}
