import assert from "node:assert/strict";
import { test } from "node:test";
import { convertSeo } from "../../src/platform/migrate/convert-seo.ts";

test("SEO fields match, and a missing field stays empty", () => {
  const copied = convertSeo({
    title: "Do not invent",
    seoTitle: "Page title",
    metaDescription: "A description",
    shareImage: "/media/share.png",
  });
  assert.equal(copied.seoTitle, "Page title");
  assert.equal(copied.metaDescription, "A description");
  assert.equal(copied.shareImage, "/media/share.png");
  assert.deepEqual(copied.notes, []);

  const missing = convertSeo({ title: "Home" });
  assert.equal(missing.seoTitle, "");
  assert.equal(missing.metaDescription, "");
  assert.equal(missing.shareImage, "");
  assert.deepEqual(missing.notes, []);
  assert.equal(missing.seoTitle.includes("Home"), false);

  const invalid = convertSeo({ seoTitle: "x".repeat(71), shareImage: "/files/other.txt" });
  assert.equal(invalid.seoTitle, "");
  assert.equal(invalid.shareImage, "");
  assert.deepEqual(invalid.notes.map((note) => note.key), ["seoTitle", "shareImage"]);
});
