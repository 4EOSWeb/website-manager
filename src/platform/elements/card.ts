import type { NodeDocument } from "../document/node";
import { createElement } from "./create";
import { createHeading } from "./heading";
import { createParagraph } from "./paragraph";

/** A card with a heading and a paragraph. The words are generic. */
export function createCard(): NodeDocument {
  const heading = createHeading();
  const paragraph = createParagraph();
  heading.props = { ...heading.props, text: "Card title" };
  paragraph.props = { ...paragraph.props, text: "Card text" };
  const card = createElement("card", "generic.card", {});
  return { ...card, children: [heading, paragraph] };
}
