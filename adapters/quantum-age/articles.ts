/**
 * Article behavior for this site.
 * Existing HTML articles use html-preserved. Structured drafts are a second format;
 * the contract stores one body value, so structured drafts stay noted here until a later step.
 * The static library entry `section:insights-summary` stays until step 14.1.
 * Registered custom items are removed from the library in step 9.27.
 */

export const quantumAgeArticles = {
  enabled: true,
  routePattern: "/insights/:slug",
  body: "html-preserved" as const,
};
