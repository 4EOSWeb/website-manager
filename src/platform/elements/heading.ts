import { createElement } from "./create";

/** A new heading. The text is the word Heading and nothing is copied from a site. */
export function createHeading() {
  return createElement("heading", "generic.heading", { text: "Heading", level: 2 });
}
