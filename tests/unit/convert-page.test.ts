import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { convertPages } from "../../src/platform/migrate/convert-page.ts";
import { parseVersion3 } from "../../src/platform/migrate/parse-v3.ts";
import { redactedDraftV3 } from "./fixtures/redacted-draft-v3.ts";

test("every version 3 page becomes one visual page with SEO and pending sections", () => {
  const parsed = parseVersion3(redactedDraftV3);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const converted = convertPages(parsed.value);
  assert.equal(converted.pages.length, parsed.value.pages.length);
  assert.deepEqual(
    converted.pages.map((page) => page.route),
    parsed.value.pages.map((page) => page.route),
  );
  assert.equal(converted.warnings.length, 0);
  for (const [index, page] of converted.pages.entries()) {
    const source = parsed.value.pages[index]!;
    assert.equal(page.id, source.id);
    assert.equal(page.title, source.title);
    assert.equal(page.metadata.seoTitle, source.seoTitle);
    assert.equal(page.metadata.metaDescription, source.metaDescription);
    assert.equal(page.metadata.shareImage, source.shareImage ?? "");
    assert.equal(page.root.metadata.pending, "sections");
    assert.equal(page.root.source.origin, "migration");
    assert.equal(page.root.children.length, 0);
    assert.equal(JSON.stringify(page).includes("blocks"), false);
  }

  const odd = convertPages({
    pages: [{ id: "page_0123456789ab", route: "/Not a slug", title: "Odd", seoTitle: "Title", metaDescription: "Description", shareImage: "/media/aa.png" }],
  });
  assert.equal(odd.pages.length, 1);
  assert.equal(odd.pages[0]?.route, "/Not a slug");
  assert.equal(odd.pages[0]?.metadata.originalRoute, "/Not a slug");
  assert.equal(odd.pages[0]?.metadata.shareImage, "/media/aa.png");
  assert.equal(odd.warnings.length, 1);
  assert.equal(fs.readFileSync("src/platform/migrate/convert-page.ts", "utf8").includes("prisma"), false);
});
