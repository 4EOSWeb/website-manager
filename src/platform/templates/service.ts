import { createCard } from "../elements/card";
import { createCta } from "../elements/cta";
import { createElement } from "../elements/create";
import { createHeading } from "../elements/heading";
import { createParagraph } from "../elements/paragraph";
import { createPlatformId } from "../ids";
import type { SharedLayoutChoice } from "./blank-structured";

/** A service starter made of generic nodes and neutral copy. */
export function servicePage(options?: {
  title?: string;
  route?: string;
  shared?: { header?: SharedLayoutChoice; footer?: SharedLayoutChoice };
}) {
  const shared = options?.shared ?? { header: "optional" as const, footer: "optional" as const };
  const heading = createHeading();
  heading.props = { text: "Service", level: 1 };
  const paragraph = createParagraph();
  paragraph.props = { text: "Explain the work" };
  const features = createElement("grid", "generic.grid", {});
  features.layout = { mode: "layout", display: "grid", columns: 3, gap: 16, align: "stretch" };
  features.children = [createCard(), createCard(), createCard()];
  const cta = createCta();
  const [ctaHeading, ctaParagraph, ctaButton] = cta.children;
  if (ctaHeading) ctaHeading.props = { ...ctaHeading.props, text: "Next step" };
  if (ctaParagraph) ctaParagraph.props = { ...ctaParagraph.props, text: "Say what happens next." };
  if (ctaButton) ctaButton.props = { ...ctaButton.props, label: "Continue", href: "/" };
  const root = createElement("section", "generic.section", {});
  root.layout = { mode: "flow", direction: "vertical", gap: 24 };
  root.metadata = { header: shared.header !== "none", footer: shared.footer !== "none" };
  root.children = [heading, paragraph, features, cta];
  return {
    version: 1 as const,
    pages: [
      {
        id: createPlatformId("page"),
        route: options?.route ?? "/service",
        title: options?.title ?? "Service",
        metadata: {},
        root,
      },
    ],
  };
}
