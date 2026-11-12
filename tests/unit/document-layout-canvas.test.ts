import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canvasLayoutSchema } from "../../src/platform/document/layout-canvas.ts";
import { layoutSchema } from "../../src/platform/document/layout.ts";

test("canvas layout parses without child coordinates", () => {
  assert.equal(layoutSchema.safeParse({ mode: "canvas", snap: 4, showGrid: true }).success, true);
  assert.equal(canvasLayoutSchema.safeParse({ mode: "canvas", snap: 40, showGrid: false }).success, false);
  const source = readFileSync(new URL("../../src/platform/document/layout-canvas.ts", import.meta.url), "utf8")
    + readFileSync(new URL("../../src/platform/document/layout.ts", import.meta.url), "utf8");
  assert.equal(source.includes("freeform"), false);
});
