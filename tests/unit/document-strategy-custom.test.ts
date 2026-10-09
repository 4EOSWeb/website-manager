import { test } from "node:test";
import assert from "node:assert/strict";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { resolveBreakpoint } from "../../src/platform/document/strategy.ts";
import { minimalNode } from "./document-fixtures.ts";

test("custom placement uses a mobile box and reflows when it is missing", () => {
  const desktop = { x: 40, y: 40, w: 20, h: 20 };
  const mobile = { x: 0, y: 10, w: 100, h: 20 };
  const placed = resolveBreakpoint({
    box: desktop,
    responsive: { strategy: "custom", mobile: { box: mobile } },
  }, "mobile");
  assert.deepEqual(placed, { box: mobile });

  const child = { box: { ...desktop }, responsive: { strategy: "custom" as const } };
  assert.deepEqual(resolveBreakpoint(child, "mobile"), { mode: "flow", direction: "vertical" });
  assert.deepEqual(child.box, desktop);

  const parsed = nodeSchema.safeParse({
    ...minimalNode,
    responsive: { strategy: "custom", mobile: { box: mobile } },
  });
  assert.equal(parsed.success, true);
});
