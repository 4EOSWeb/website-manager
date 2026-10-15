import type { NodeDocument } from "../document/node";
import { createButton } from "./button";
import { createElement } from "./create";
import { createHeading } from "./heading";
import { createParagraph } from "./paragraph";

/** A call to action made from a heading, a paragraph, and a button. */
export function createCta(): NodeDocument {
  const heading = createHeading();
  const paragraph = createParagraph();
  const button = createButton();
  button.props = { ...button.props, label: "Continue", href: "/" };
  const cta = createElement("cta", "generic.cta", {});
  return { ...cta, children: [heading, paragraph, button] };
}
