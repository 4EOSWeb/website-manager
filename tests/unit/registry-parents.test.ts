import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertParent } from "../../src/platform/registry/parents.ts";

test("a button can sit in a section and not in text", () => {
  const button = { allowedParents: ["section"] };
  const rejected = assertParent(button, "text");
  assert.equal(rejected.ok, false);
  if (!rejected.ok) assert.equal(rejected.error.code, "parent_rejected");
  assert.equal(assertParent(button, "section").ok, true);
  const ops = readFileSync(new URL("../../src/lib/editor-ops.ts", import.meta.url), "utf8");
  assert.equal(ops.includes("assertParent"), false);
});
