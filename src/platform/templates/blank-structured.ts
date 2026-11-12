import { createElement } from "../elements/create";
import { createPlatformId } from "../ids";

export type SharedLayoutChoice = "required" | "optional" | "none";

/** One empty flow section. Header and footer follow the adapter shared-layout setting. */
export function blankStructuredPage(options?: {
  title?: string;
  route?: string;
  shared?: { header?: SharedLayoutChoice; footer?: SharedLayoutChoice };
}) {
  const shared = options?.shared ?? { header: "optional" as const, footer: "optional" as const };
  const root = createElement("section", "generic.section", {});
  root.layout = { mode: "flow", direction: "vertical", gap: 0 };
  root.metadata = {
    header: shared.header !== "none",
    footer: shared.footer !== "none",
  };
  return {
    version: 1 as const,
    pages: [
      {
        id: createPlatformId("page"),
        route: options?.route ?? "/new-page",
        title: options?.title ?? "New page",
        metadata: {},
        root,
      },
    ],
  };
}
