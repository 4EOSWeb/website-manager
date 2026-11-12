import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { articleConvertVisible, convertPreservedHtml } from "../../src/platform/articles/convert.ts";

test("conversion keeps headings and paragraphs and reports everything else", () => {
  const refused = convertPreservedHtml("<p>Hello</p>", "");
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.reason.includes("backup"), true);
  const html = "<h2>Title</h2><p>Hello <strong>there</strong></p><ul><li>One</li></ul><table><tr><td>Cell</td></tr></table>";
  const converted = convertPreservedHtml(html, "bak_example");
  assert.equal(converted.ok, true);
  if (!converted.ok) return;
  assert.deepEqual(converted.nodes, [
    { type: "heading", level: 2, text: "Title" },
    { type: "paragraph", text: "Hello there" },
  ]);
  assert.equal(converted.metadata.unmappedHtml.includes("<ul>"), true);
  assert.equal(converted.metadata.unmappedHtml.includes("<li>One</li>"), true);
  assert.equal(converted.metadata.unmappedHtml.includes("<td>Cell</td>"), true);
  assert.equal(articleConvertVisible("basic", true), false);
  assert.equal(articleConvertVisible("administrator", false), false);
  assert.equal(articleConvertVisible("administrator", true), true);
  const control = readFileSync("src/components/editor/article-convert.tsx", "utf8");
  assert.equal(control.includes("articleConvertVisible"), true);
  assert.equal(control.includes("<textarea"), false);
  const platform = readFileSync("src/platform/articles/convert.ts", "utf8").toLowerCase();
  assert.equal(platform.includes("insights"), false);
  assert.equal(platform.includes("quantum"), false);
});
