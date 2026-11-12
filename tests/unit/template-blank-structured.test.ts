import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDocument } from "../../src/platform/document/document.ts";
import { blankStructuredPage } from "../../src/platform/templates/blank-structured.ts";

test("a blank structured page is one empty flow section", () => {
  const document = blankStructuredPage({ shared: { header: "none", footer: "optional" } });
  assert.equal(document.pages.length, 1);
  assert.equal(document.pages[0]?.root.type, "section");
  assert.equal(document.pages[0]?.root.layout?.mode, "flow");
  assert.equal(document.pages[0]?.root.children.length, 0);
  assert.equal(document.pages[0]?.root.metadata.header, false);
  assert.equal(document.pages[0]?.root.metadata.footer, true);
  const parsed = validateDocument(document);
  assert.equal(parsed.ok, true);
  const source = readFileSync("src/platform/templates/blank-structured.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("hero"), false);
  assert.equal(source.includes("plum"), false);
  assert.equal(source.includes("insights"), false);
});
