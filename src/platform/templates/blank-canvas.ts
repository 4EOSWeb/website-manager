import { createElement } from "../elements/create";
import { createPlatformId } from "../ids";
import type { SharedLayoutChoice } from "./blank-structured";

/** An empty canvas root. Header and footer follow the adapter shared-layout setting. */
export function blankCanvasPage(options?: {
  title?: string;
  route?: string;
  shared?: { header?: SharedLayoutChoice; footer?: SharedLayoutChoice };
}) {
  const shared = options?.shared ?? { header: "optional" as const, footer: "optional" as const };
  const root = createElement("section", "generic.section", {});
  root.layout = { mode: "canvas", snap: 0, showGrid: false };
  root.metadata = {
    header: shared.header !== "none",
    footer: shared.footer !== "none",
  };
  return {
    version: 1 as const,
    pages: [
      {
        id: createPlatformId("page"),
        route: options?.route ?? "/new-canvas",
        title: options?.title ?? "New canvas",
        metadata: {},
        root,
      },
    ],
  };
}
