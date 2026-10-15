import { createCard } from "../elements/card";
import { createElement } from "../elements/create";
import { createHeading } from "../elements/heading";
import { createParagraph } from "../elements/paragraph";
import { createPlatformId } from "../ids";
import type { SharedLayoutChoice } from "./blank-structured";

/** A landing starter made of generic nodes and neutral copy. */
export function landingPage(options?: {
  title?: string;
  route?: string;
  shared?: { header?: SharedLayoutChoice; footer?: SharedLayoutChoice };
}) {
  const shared = options?.shared ?? { header: "optional" as const, footer: "optional" as const };
  const heading = createHeading();
  heading.props = { text: "Landing page", level: 1 };
  const paragraph = createParagraph();
  paragraph.props = { text: "Describe the offer" };
  const button = createElement("button", "generic.button", { label: "Get started", href: "/" });
  button.metadata = { region: "cta" };
  const features = createElement("grid", "generic.grid", {});
  features.layout = { mode: "layout", display: "grid", columns: 3, gap: 16, align: "stretch" };
  features.children = [createCard(), createCard(), createCard()];
  const root = createElement("section", "generic.section", {});
  root.layout = { mode: "flow", direction: "vertical", gap: 24 };
  root.metadata = { header: shared.header !== "none", footer: shared.footer !== "none" };
  root.children = [heading, paragraph, button, features];
  return {
    version: 1 as const,
    pages: [
      {
        id: createPlatformId("page"),
        route: options?.route ?? "/landing",
        title: options?.title ?? "Landing page",
        metadata: {},
        root,
      },
    ],
  };
}
