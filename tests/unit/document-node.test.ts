import { test } from "node:test";
import assert from "node:assert/strict";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { createPlatformId } from "../../src/platform/ids.ts";
import { minimalNode } from "./document-fixtures.ts";

test("a node missing an id fails and a minimal node parses", () => {
  const { id: _id, ...rest } = minimalNode;
  assert.equal(nodeSchema.safeParse(rest).success, false);
  assert.equal(nodeSchema.safeParse(minimalNode).success, true);
  assert.equal(nodeSchema.safeParse({ ...minimalNode, id: createPlatformId("node") }).success, true);
  assert.equal(nodeSchema.safeParse({ ...minimalNode, id: "page_home" }).success, false);
});
