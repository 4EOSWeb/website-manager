import { createElement } from "../elements/create";
import { createRichText } from "../elements/richtext";
import { createPlatformId } from "../ids";
import type { SharedLayoutChoice } from "./blank-structured";

/** An article starter. Metadata, the page header, and the body can be edited. The body is rich text. */
export function articlePage(options?: {
  title?: string;
  route?: string;
  shared?: { header?: SharedLayoutChoice; footer?: SharedLayoutChoice };
}) {
  const shared = options?.shared ?? { header: "optional" as const, footer: "optional" as const };
  const body = createRichText();
  body.props = { text: "Write the article", marks: [] };
  const root = createElement("section", "generic.section", {});
  root.layout = { mode: "flow", direction: "vertical", gap: 16 };
  root.metadata = {
    header: shared.header !== "none",
    footer: shared.footer !== "none",
    editMetadata: true,
    editHeader: true,
    editBody: true,
  };
  root.children = [body];
  return {
    version: 1 as const,
    pages: [
      {
        id: createPlatformId("page"),
        route: options?.route ?? "/article",
        title: options?.title ?? "Article",
        metadata: {},
        root,
      },
    ],
  };
}
