import { test } from "node:test";
import assert from "node:assert/strict";
import { flowLayoutSchema } from "../../src/platform/document/layout-flow.ts";

test("vertical flow parses and freeform does not", () => {
  assert.equal(flowLayoutSchema.safeParse({ mode: "flow", direction: "vertical", gap: 16 }).success, true);
  assert.equal(flowLayoutSchema.safeParse({ mode: "freeform", direction: "vertical", gap: 16 }).success, false);
});
