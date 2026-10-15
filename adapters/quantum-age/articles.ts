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

export type PreservedHtmlArticle = {
  source: { origin: "provider"; providerManaged: false; externalRef: string };
  metadata: { htmlPreserved: true };
  html: string;
};

/** Keeps an existing HTML body as-is. Headings and tables stay in the string. */
export function preservedHtmlArticle(slug: string, html: string): PreservedHtmlArticle {
  return {
    source: { origin: "provider", providerManaged: false, externalRef: slug },
    metadata: { htmlPreserved: true },
    html,
  };
}
