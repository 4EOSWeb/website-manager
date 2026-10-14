import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDocument } from "../../src/platform/document/document.ts";
import { articlePage } from "../../src/platform/templates/article.ts";

test("an article page can edit metadata, header, and a rich text body", () => {
  const document = articlePage();
  const parsed = validateDocument(document);
  assert.equal(parsed.ok, true);
  const root = document.pages[0]?.root;
  assert.equal(root?.metadata.editMetadata, true);
  assert.equal(root?.metadata.editHeader, true);
  assert.equal(root?.metadata.editBody, true);
  assert.equal(root?.layout?.mode, "flow");
  assert.equal(root?.children.length, 1);
  assert.equal(root?.children[0]?.type, "richtext");
  assert.equal(root?.children[0]?.componentId, "generic.richtext");
  const serialized = JSON.stringify(document);
  assert.equal(serialized.includes("Write the article"), true);
  assert.equal(serialized.includes("\"html\""), false);
  const source = readFileSync("src/platform/templates/article.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("plum"), false);
  assert.equal(source.includes("hero"), false);
  assert.equal(source.includes("insights"), false);
  assert.equal(source.includes("<textarea"), false);
});
