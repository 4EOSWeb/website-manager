import { test } from "node:test";
import assert from "node:assert/strict";
import { nodeTypes } from "../../src/platform/document/node-type.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { minimalNode } from "./document-fixtures.ts";

test("custom is allowed and freeform is rejected", () => {
  assert.equal(nodeTypes.includes("custom"), true);
  assert.equal(nodeSchema.safeParse({ ...minimalNode, type: "custom" }).success, true);
  assert.equal(nodeSchema.safeParse({ ...minimalNode, type: "freeform" }).success, false);
  assert.equal(nodeTypes.includes("insights" as never), false);
});
