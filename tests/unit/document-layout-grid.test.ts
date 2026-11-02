import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutSchema } from "../../src/platform/document/layout.ts";

test("grid, flow, and flex parse through the shared layout schema", () => {
  assert.equal(layoutSchema.safeParse({ mode: "layout", display: "grid", columns: 3, gap: 16, align: "start" }).success, true);
  assert.equal(layoutSchema.safeParse({ mode: "layout", display: "grid", columns: 5, gap: 16, align: "start" }).success, false);
  assert.equal(layoutSchema.safeParse({ mode: "flow", direction: "vertical", gap: 8 }).success, true);
  assert.equal(layoutSchema.safeParse({
    mode: "layout",
    display: "flex",
    direction: "row",
    gap: 8,
    align: "start",
    justify: "start",
    wrap: false,
  }).success, true);
});
