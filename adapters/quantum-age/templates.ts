/**
 * Page templates used by this site. The Add page dialog still lists its own
 * constant in dialogs.tsx. Remove that constant in step 14.8.
 */

function starter(pageId: string, nodeId: string, route: string, title: string) {
  return {
    version: 1 as const,
    pages: [
      {
        id: pageId,
        route,
        title,
        metadata: {},
        root: {
          id: nodeId,
          type: "section" as const,
          componentId: "section",
          props: {},
          styles: {},
          responsive: {},
          layout: { mode: "flow" as const, direction: "vertical" as const, gap: 16 },
          children: [],
          visibility: { hidden: false, hideOn: [] as string[] },
          locked: { locked: false },
          metadata: {},
        },
      },
    ],
  };
}

export const quantumAgeTemplates = {
  templates: [
    { id: "home", name: "Home", description: "The home page layout.", document: starter("page_a10000000001", "node_a10000000001", "/home", "Home") },
    { id: "marketing", name: "Marketing", description: "A marketing page layout.", document: starter("page_a10000000002", "node_a10000000002", "/marketing", "Marketing") },
    { id: "legal", name: "Legal", description: "A legal page layout.", document: starter("page_a10000000003", "node_a10000000003", "/legal", "Legal") },
    { id: "insights-landing", name: "Insights landing", description: "An insights landing layout.", document: starter("page_a10000000004", "node_a10000000004", "/insights-landing", "Insights landing") },
  ],
};
