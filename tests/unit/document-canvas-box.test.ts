import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canvasBoxSchema } from "../../src/platform/document/canvas-box.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { minimalNode } from "./document-fixtures.ts";

test("a parent-percentage box parses and a value past 100 fails", () => {
  assert.equal(canvasBoxSchema.safeParse({ x: 10, y: 20, w: 30, h: 40 }).success, true);
  assert.equal(canvasBoxSchema.safeParse({ x: 120, y: 0, w: 10, h: 10 }).success, false);
  const parsed = nodeSchema.safeParse({
    ...minimalNode,
    box: { x: 0, y: 0, w: 50, h: 20 },
    responsive: { mobile: { box: { x: 0, y: 0, w: 100, h: 30 } } },
  });
  assert.equal(parsed.success, true);
  const source = readFileSync(new URL("../../src/platform/document/canvas-box.ts", import.meta.url), "utf8");
  assert.equal(source.includes("percentages of the parent"), true);
});
