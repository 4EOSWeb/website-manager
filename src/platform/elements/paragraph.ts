import { createElement } from "./create";

/** A new paragraph. The text is the word Paragraph and it is not added to another paragraph. */
export function createParagraph() {
  return createElement("text", "generic.text", { text: "Paragraph" });
}
