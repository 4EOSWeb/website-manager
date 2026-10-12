import { createElement } from "./create";

export const textareaParents = { allowedParents: ["form", "container"] };

/** A multi-line field. It belongs in a form or a container. */
export function createTextarea() {
  return createElement("textarea", "generic.textarea", { label: "Message", name: "message", required: false });
}
