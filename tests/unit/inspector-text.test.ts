import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { textStylePatch } from "../../src/components/editor/inspector/text-model.ts";

test("text style writes one key and does not offer a markup field", () => {
  assert.deepEqual(textStylePatch("align", "center"), { align: "center" });
  assert.deepEqual(textStylePatch("weight", "bold"), { weight: "bold" });
  assert.equal(textStylePatch("html", "<b>no</b>"), null);
  assert.equal(textStylePatch("tag", "div"), null);
  const fields = readFileSync("src/components/editor/inspector/text-fields.tsx", "utf8");
  const model = readFileSync("src/components/editor/inspector/text-model.ts", "utf8");
  assert.equal(fields.includes("Weight"), true);
  assert.equal(fields.includes("Alignment"), true);
  assert.equal(fields.toLowerCase().includes("html"), false);
  const lowered = `${fields}\n${model}`.toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
  const blocks = readFileSync("src/components/editor/inspector/blocks.tsx", "utf8");
  assert.equal(blocks.includes("Weight"), true);
  const runtime = readFileSync("src/platform/canvas/runtime.ts", "utf8");
  assert.equal(runtime.includes("fmt-bold"), true);
  assert.equal(runtime.includes("fmt-italic"), true);
  assert.equal(runtime.includes("fmt-underline"), true);
  assert.equal(runtime.includes("fmt-link"), true);
  const shell = readFileSync("src/components/editor-shell.tsx", "utf8");
  assert.equal(shell.includes("textStylePatch"), true);
});
