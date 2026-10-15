function node(id: string, type: "section" | "heading" | "text", props: Record<string, string> = {}) {
  return {
    id,
    type,
    componentId: type,
    props,
    styles: {},
    responsive: {},
    children: [] as Array<Record<string, unknown>>,
    visibility: { hidden: false, hideOn: [] as string[] },
    locked: { locked: false },
    metadata: {},
  };
}

const heading = node("node_57a000000001", "heading", { text: "Heading" });
const paragraph = node("node_57a000000002", "text", { text: "Paragraph" });
const section = {
  ...node("node_57a000000003", "section"),
  layout: { mode: "flow" as const, direction: "vertical" as const, gap: 16 },
  children: [heading, paragraph],
};

export const stackedPage = {
  version: 1 as const,
  pages: [
    {
      id: "page_57a000000001",
      route: "/stacked",
      title: "Stacked",
      metadata: {},
      root: section,
    },
  ],
};
