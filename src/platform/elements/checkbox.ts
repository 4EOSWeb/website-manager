import { createElement } from "./create";

export const checkboxParents = { allowedParents: ["form", "container"] };

/** A yes or no field. It belongs in a form or a container. */
export function createCheckbox() {
  return createElement("checkbox", "generic.checkbox", { label: "Option", checked: false });
}
