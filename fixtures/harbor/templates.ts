function node(id: string, type: string, componentId: string, props: Record<string, unknown>, children: unknown[] = []) {
  return {
    id,
    type,
    componentId,
    props,
    styles: {},
    responsive: {},
    children,
    visibility: { hidden: false, hideOn: [] },
    locked: { locked: false },
    metadata: {},
  };
}

export const harborVisitTemplate = {
  id: "harbor.visit",
  name: "Visit",
  description: "A canvas page with the tide clock.",
  document: {
    version: 1,
    pages: [
      {
        id: "page_a11b0c0d0e0f",
        route: "/visit",
        title: "Visit",
        metadata: {},
        root: {
          ...node("node_a11b0c0d0e01", "section", "generic.section", {}),
          layout: { mode: "canvas", snap: 0, showGrid: false },
          children: [
            node("node_a11b0c0d0e02", "heading", "generic.heading", { text: "Visit", level: 1 }),
            node("node_a11b0c0d0e03", "custom", "harbor.tide-clock", { label: "Tide clock" }),
          ],
        },
      },
    ],
  },
};
