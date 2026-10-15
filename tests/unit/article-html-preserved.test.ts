import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { preservedHtmlArticle } from "../../adapters/quantum-age/articles.ts";

test("an existing HTML article stays a string with a preserved flag", () => {
  const html = "<h2>Keep it small</h2><p>Hello <strong>there</strong></p><table><tr><td>Cell</td></tr></table>";
  const record = preservedHtmlArticle("keep-it-small", html);
  assert.equal(record.metadata.htmlPreserved, true);
  assert.equal(record.source.externalRef, "keep-it-small");
  assert.equal(record.source.providerManaged, false);
  assert.equal(record.html, html);
  assert.equal("children" in record, false);
  const overlay = readFileSync("overlays/quantum-age/src/components/site/structured-article.tsx", "utf8");
  assert.equal(overlay.includes("htmlPreserved"), true);
  assert.equal(overlay.includes("prose-article"), true);
  assert.equal(overlay.includes("<textarea"), false);
  const page = readFileSync("overlays/quantum-age/src/app/insights/[slug]/page.tsx", "utf8");
  assert.equal(page.includes("htmlPreserved"), true);
  assert.equal(page.includes("dangerouslySetInnerHTML"), false);
});
