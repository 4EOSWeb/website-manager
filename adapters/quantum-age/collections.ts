/**
 * Entries the editor can add for this site.
 * The public site still renders only the routes it already has.
 * Article and forum drafts are stored until those routes exist.
 */
export const quantumAgeCollections = [
  { id: "insights", name: "Insights", kind: "article" as const, routePattern: "/insights/:slug", body: "html-preserved" as const },
  { id: "articles", name: "Articles", kind: "article" as const, routePattern: "/articles/:slug", body: "structured" as const },
  { id: "forum", name: "Forum", kind: "forum" as const, routePattern: "/forum/:slug", body: "structured" as const },
];
